import express from 'express';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import AuthTokenMiddleware from '../controllers/AuthTokenMiddleware.js';
import { streakDays, users } from '../db/schema.js';
import { db } from '../db/db.js';

dotenv.config();

const extendStreakRouter = express.Router();

extendStreakRouter.post("/extendStreak", AuthTokenMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Brak userId" });
    }


    try {
        const today = getTodayInTimeZone("Europe/Warsaw");
        const yesterday = getPreviousDate(today)

        const result = await db.transaction(async (tx) => {

            const insertedDays = await tx
                .insert(streakDays)
                .values({
                    userId,
                    activityDate: today
                })
                .onConflictDoNothing()
                .returning({
                    activityDate: streakDays.activityDate,
                });
            
            // jeżeli nie dodano dnia czyli już istniał to nic się nie dzieję
            if (insertedDays.length === 0) {
                const [user] = await tx
                    .select({
                        dailyStreak: users.dailyStreak,
                        maxStreak: users.maxStreak,
                        lastStreakDate: users.lastStreakDate
                    })
                    .from(users)
                    .where(eq(users.id, userId))
                    .limit(1);
            
                return {
                    extended: false,
                    ...user
                }        
            }
            
            // jeżeli dzień został dodany - to zwiększamy streak
            const [user] = await tx
                .select({
                    dailyStreak: users.dailyStreak,
                    maxStreak: users.maxStreak,
                    lastStreakDate: users.lastStreakDate,
                    streakFreezes: users.streakFreezes

                })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1)
                .for("update")

            if(!user) {
                throw new Error("User not found")
            }

            let newDailyStreak: number;
            let newStreakFreezes = user.streakFreezes;
            let usedFreezes = 0;

            if(!user.lastStreakDate) {
                // pierwszy dzień użytkownika

                newDailyStreak = 1
            } else {
                const difference = differenceInCalendarDays(
                    user.lastStreakDate,
                    today
                );

                const missedDays = Math.max(0, difference - 1)

                if(missedDays === 0) {
                    // ostatnia aktywność była wczoraj
                    newDailyStreak = user.dailyStreak + 1
                } else if (user.streakFreezes >= missedDays) {
                    // Użytkownik pominoł X dni ale ma wystarczająco freezów
                    usedFreezes = missedDays
                    newStreakFreezes = user.streakFreezes - missedDays
                    newDailyStreak = user.dailyStreak + 1;
                } else {
                    // użytkownik nie ma wystarczającej liczby freezów
                    newDailyStreak = 1
                }

            }

            const newMaxStreak = Math.max(
                user.maxStreak,
                newDailyStreak
            )

            // aktualizacja danych
            await tx
                .update(users)
                .set({
                    dailyStreak: newDailyStreak,
                    maxStreak: newMaxStreak,
                    lastStreakDate: today,
                    streakFreezes: newStreakFreezes
                })
                .where(eq(users.id, userId));


            return {
                extended: true,
                dailyStreak: newDailyStreak,
                maxStreak: newMaxStreak,
                lastStreakDate: today,
                streakFreezes: newStreakFreezes,
                usedFreezes: usedFreezes
            }

        });

        
        return res.status(200).json({
            success: true,
            ...result,
            message: result.extended
                ? "Streak extended!"
                : "Streak arleady extended today"
        })

    } catch (error) {
      console.error("Problem with extending streak", error);

      return res.status(500).json({
        success: false,
        message: "Internal problem with extending streak",
      });
    }
});

export default extendStreakRouter;


// zamiast daty iso z godziną dostajemy np. 2026-09-22
function getTodayInTimeZone(timeZone = "Europe/Warsaw") {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}

function getPreviousDate(dateString: string) {
    const date = new Date(`${dateString}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);

    return date.toISOString().slice(0, 10);
}

function differenceInCalendarDays(from: string, to: string) {
    const fromDate = new Date(`${from}T12:00:00Z`);
    const toDate = new Date(`${to}T12:00:00Z`);

    return Math.round(
        (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)
    );
}
