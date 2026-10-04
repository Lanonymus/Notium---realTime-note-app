

import { Router, Request, Response } from "express"
import AuthTokenMiddleware from "../controllers/AuthTokenMiddleware.js";
import { db } from "../db/db.js";
import { projects, streakDays, users } from "../db/schema.js";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { success } from "zod";


const getUserDataRouter = Router()


// Verifying data fetch request
getUserDataRouter.get("/getUserData", AuthTokenMiddleware, async (req: Request, res: Response) => {

  const userId = req.userId
  if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    try {
        const today = getDateInTimeZone("Europe/Warsaw")
        const historyStartDate = substractDays(today, 30)

        const [userRows, userProjects, streakHistory] =
            await Promise.all([
                // wczytywanie danych użytkownika
                db.select({
                    id: users.id,
                    username: users.username,
                    email: users.email,
                    createdAt: users.createdAt,

                    dailyStreak: users.dailyStreak,
                    maxStreak: users.maxStreak,
                    streakFreezes: users.streakFreezes,
                    lastStreakDate: users.lastStreakDate,

                    keysLeft: users.keysLeft,
                    xp: users.xp
                })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1),

                // wczytywanie projektów użytkowniak
                db.select()
                    .from(projects)
                    .where(eq(projects.userId, userId)),

                // wczytywanie dni aktywności użytkownika
                db.select({
                    date: streakDays.activityDate,
                    type: streakDays.type,
                })
                .from(streakDays)
                .where(
                    and(
                        eq(streakDays.userId, userId),
                        gte(streakDays.activityDate, historyStartDate),
                        lte(streakDays.activityDate, today)
                    )
                )
                .orderBy(asc(streakDays.activityDate))
            ]);   


        const userData = userRows[0];


        if (!userData) {
            return res.status(404).json({ 
            message: "User not found",
            flag: "USER_NOT_FOUND",
            success: false 
            })
        }

        const activeDates = streakHistory
            .filter((day) => day.type === "activity")
            .map((day) => day.date)

        const frozenDates = streakHistory
            .filter((day) => day.type === "freeze")
            .map((day) => day.date)


        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",

            userData,
            userProjects,

            learningStats: {
                maxStreak: userData.maxStreak,
                dailyStreak: userData.dailyStreak,
                streakFreezes: userData.streakFreezes,
                lastStreakDate: userData.lastStreakDate,
                activeDates,
                frozenDates,
                xp: userData.xp,
                
            },

            flag: "DATA_FETCHED"
        })

    } catch (error) {
      console.error("Error fetching user data", error)
      return res.status(500).json({
        message: "Internal server error",
        flag: "INTERNAL_SERVER_ERROR",
        success: false
      })
    }
});


function getDateInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}


function substractDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);

  return date.toISOString().slice(0, 10);
}


export default getUserDataRouter
