import { Router, Request, Response } from "express";
import { db } from "../../db/db.js";
import { activityCompletions, users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import AuthTokenMiddleware from "../../controllers/AuthTokenMiddleware.js";


const completeRouter = Router()

completeRouter.post("/complete", AuthTokenMiddleware , async (req: Request, res: Response) => {

    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false });

    const { attemptId, activityType, projectId, correctAnswers, totalQuestions, resourceId } = req.body


    try {

        const [completion] = await db
            .insert(activityCompletions)
            .values({
                userId,
                attemptId,
                activityType,
                projectId: projectId ?? null,
                resourceId: resourceId ?? null,
                correctAnswers:
                activityType === "quiz" ? correctAnswers : null,
                totalQuestions:
                activityType === "quiz" ? totalQuestions : null,
            })
            .onConflictDoNothing({
                target: [
                activityCompletions.userId,
                activityCompletions.attemptId,
                ],
            })
            .returning({
                id: activityCompletions.id,
            });

        if (!completion) {
        return res.status(200).json({
            success: true,
            alreadyRecorded: true,
        });
        }

    } catch (error) {

      console.error("Activity wasn't counted", error);
    }
})


export default completeRouter;