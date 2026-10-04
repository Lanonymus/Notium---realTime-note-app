import express, { type Request, type Response } from "express";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import AuthTokenMiddleware from "../../controllers/AuthTokenMiddleware.js";
import { activityCompletions, learningSessions, projects, projectSkills, skillCatalog, users } from "../../db/schema.js";
import { db } from "../../db/db.js";

const activityRouter = express.Router();

const MAX_HEARTBEAT_SECONDS = 75;

const startSchema = z.object({
  projectId: z.string().uuid(),
  resourceId: z.string().min(1).max(200).nullable().optional(),
  activityType: z.enum(["notes", "quiz", "flashcards", "podcast"]),
});

const summarySchema = z.object({
  timeframe: z.enum(["week", "month", "year", "all"]),
  from: z.string().datetime(),
  to: z.string().datetime(),
});


const heartbeatSchema = z.object({
  isActive: z.boolean(),
});

const endSchema = heartbeatSchema.extend({
  reason: z.enum([
    "completed",
    "route_changed",
    "tab_closed",
    "context_changed",
  ]),
});

function secondsSince(date: Date, now: Date) {
  return Math.max(
    0,
    Math.min(
      MAX_HEARTBEAT_SECONDS,
      Math.floor((now.getTime() - date.getTime()) / 1000),
    ),
  );
}

activityRouter.post("/start",AuthTokenMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false });

    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity payload",
      });
    }

    const { projectId, resourceId, activityType } = parsed.data;

    try {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
        .limit(1);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const [session] = await db
        .insert(learningSessions)
        .values({
          userId,
          projectId,
          resourceId: resourceId ?? null,
          activityType,
        })
        .returning({ id: learningSessions.id });

      return res.status(201).json({
        success: true,
        sessionId: session.id,
      });
    } catch (error) {
      console.error("Starting learning activity failed", error);
      return res.status(500).json({ success: false });
    }
  },
);



activityRouter.post("/:sessionId/heartbeat",
  AuthTokenMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false });

    const sessionId = z.string().uuid().safeParse(req.params.sessionId);
    const payload = heartbeatSchema.safeParse(req.body);

    if (!sessionId.success || !payload.success) {
      return res.status(400).json({ success: false });
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(learningSessions)
          .where(
            and(
              eq(learningSessions.id, sessionId.data),
              eq(learningSessions.userId, userId),
              isNull(learningSessions.endedAt),
            ),
          )
          .for("update")
          .limit(1);

        if (!session) return null;

        const now = new Date();
        const addedSeconds = payload.data.isActive
          ? secondsSince(session.lastHeartbeatAt, now)
          : 0;

        const [updated] = await tx
          .update(learningSessions)
          .set({
            activeSeconds: session.activeSeconds + addedSeconds,
            lastHeartbeatAt: now,
          })
          .where(eq(learningSessions.id, session.id))
          .returning({ activeSeconds: learningSessions.activeSeconds });

        return updated;
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Active session not found",
        });
      }

      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("Learning activity heartbeat failed", error);
      return res.status(500).json({ success: false });
    }
  },
);




activityRouter.post("/:sessionId/end", AuthTokenMiddleware, async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false });

    const sessionId = z.string().uuid().safeParse(req.params.sessionId);
    const payload = endSchema.safeParse(req.body);

    if (!sessionId.success || !payload.success) {
      return res.status(400).json({ success: false });
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(learningSessions)
          .where(
            and(
              eq(learningSessions.id, sessionId.data),
              eq(learningSessions.userId, userId),
              isNull(learningSessions.endedAt),
            ),
          )
          .for("update")
          .limit(1);

        // Ending an already closed session is intentionally idempotent.
        if (!session) return { alreadyEnded: true };

        const now = new Date();
        const addedSeconds = payload.data.isActive
          ? secondsSince(session.lastHeartbeatAt, now)
          : 0;

        const [updated] = await tx
          .update(learningSessions)
          .set({
            activeSeconds: session.activeSeconds + addedSeconds,
            lastHeartbeatAt: now,
            endedAt: now,
            endedReason: payload.data.reason,
          })
          .where(eq(learningSessions.id, session.id))
          .returning({ activeSeconds: learningSessions.activeSeconds });

        return updated;
      });

      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("Ending learning activity failed", error);
      return res.status(500).json({ success: false });
    }
  },
);






activityRouter.get("/summary", AuthTokenMiddleware, async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
      });
    }

    const parsed = summarySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics range",
      });
    }

    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);
    const timeframe = parsed.data.timeframe;

    if (from >= to) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    try {

      // pobieranie umiejętności użytkownika
      const skills = await db
        .select({
          key: skillCatalog.key,
          name: skillCatalog.label,
          count: sql<number>`count(*)::int`,
        })
        .from(projectSkills)
        .innerJoin(
          projects,
          eq(projects.id, projectSkills.projectId),
        )
        .innerJoin(
          skillCatalog,
          eq(skillCatalog.key, projectSkills.skillKey),
        )
        .where(
          and(
            eq(projects.userId, userId),
            gte(projectSkills.detectedAt, from),
            lt(projectSkills.detectedAt, to),
          ),
        )
        .groupBy(skillCatalog.key, skillCatalog.label)
        .orderBy(desc(sql`count(*)`))
        .limit(6);      





      // pobieranie danych nagłówkowych czyli ilość aktywności oraz średnia z quizu
      const [metrics] = await db
        .select({
          activitiesCompleted: sql<number>`
            count(*)::int
          `,

          correctAnswers: sql<number>`
            coalesce(
              sum(${activityCompletions.correctAnswers}),
              0
            )::int
          `,

          totalQuestions: sql<number>`
            coalesce(
              sum(${activityCompletions.totalQuestions}),
              0
            )::int
          `,
        })
        .from(activityCompletions)
        .where(
          and(
            eq(activityCompletions.userId, userId),
            gte(activityCompletions.completedAt, from),
            lt(activityCompletions.completedAt, to),
          ),
        );

      const totalQuestions = Number(metrics.totalQuestions);
      const correctAnswers = Number(metrics.correctAnswers);

      const quizAccuracy =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;

      const [user] = await db
        .select({
          timezone: users.timezone,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }





      // Week i month pokazujemy dzień po dniu.
      // Year i all grupujemy miesiącami.
      const bucket =
        timeframe === "year" || timeframe === "all"
          ? sql<string>`
              to_char(
                timezone(${user.timezone}, ${learningSessions.startedAt}),
                'YYYY-MM'
              )
            `
          : sql<string>`
              to_char(
                timezone(${user.timezone}, ${learningSessions.startedAt}),
                'YYYY-MM-DD'
              )
            `;

      const rows = await db
        .select({
          bucket,
          activeSeconds: sql<number>`
            coalesce(sum(${learningSessions.activeSeconds}), 0)::int
          `,
        })
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.userId, userId),
            gte(learningSessions.startedAt, from),
            lt(learningSessions.startedAt, to),
          ),
        )
        // `bucket` contains a bound timezone parameter. Reusing it in
        // SELECT, GROUP BY and ORDER BY makes Drizzle create a different
        // placeholder for every occurrence, which PostgreSQL does not treat
        // as the same grouping expression. Positions refer to the already
        // selected bucket expression and avoid rebinding it.
        .groupBy(sql.raw("1"))
        .orderBy(sql.raw("1"));

      const points = rows.map((row) => ({
        bucket: row.bucket,
        activeSeconds: Number(row.activeSeconds),
        hours: Number((Number(row.activeSeconds) / 3600).toFixed(2)),
      }));

      const totalSeconds = points.reduce(
        (total, point) => total + point.activeSeconds,
        0,
      );



      // zwracanie danych
      return res.status(200).json({
        success: true,
        timeframe,
        from: from.toISOString(),
        to: to.toISOString(),
        totalSeconds,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        points,

        activitiesCompleted: Number(metrics.activitiesCompleted),
        quizAccuracy,     
        
        skills: skills.map((skill) => ({
          ...skill,
          count: Number(skill.count),
        })),
      });

      
    } catch (error) {
      console.error("Fetching activity summary failed", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);





export default activityRouter;
