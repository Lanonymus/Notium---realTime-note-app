import express from 'express';
import { db } from '../db/db.js';
import { projects, QuizInstance } from '../db/schema.js';
import AuthTokenMiddleware from '../controllers/AuthTokenMiddleware.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const saveQuizProgressRouter = express.Router();

saveQuizProgressRouter.post("/saveQuizProgress", AuthTokenMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Brak userId" });
    }

    const { projectId, quizObject, quizId } = req.body;

    try {
        const [project] = await db
            .select({
                quizes: projects.quizes
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            return res.status(404).json({ success: false, message: "Nie znaleziono projektu!!" });
        }

        const currentQuizes = (project.quizes as QuizInstance[]) || [];

        if (currentQuizes.length === 0) {
            return res.status(400).json({ success: false, message: "Brak quizów do zaktualizowania." });
        }

        // Szukamy po quizId, a jeśli nie podano/nie znaleziono – wybieramy ostatni quiz
        let targetIndex = quizId ? currentQuizes.findIndex(q => q.id === quizId) : -1;
        if (targetIndex === -1) {
            targetIndex = currentQuizes.length - 1;
        }

        // Tworzymy nową tablicę z podmienionymi odpowiedziami dla wskazanego quizu
        const updatedQuizes = currentQuizes.map((quiz, index) => {
            if (index === targetIndex) {
                return quizObject
            }
            return quiz;
        });

        // Zapis w bazie danych
        await db
            .update(projects)
            .set({
                quizes: updatedQuizes,
                updatedAt: new Date()
            })
            .where(eq(projects.id, projectId));

        console.log("zaktualizowany quiz: ", quizObject);
        
        return res.status(200).json({ success: true, message: "Postęp quizu został pomyślnie zapisany." });

    } catch (error) {
        console.error("Internal problem with saving quiz progress", error);
        return res.status(500).json({ success: false, message: "Internal problem with saving quiz progress" });
    }
});

export default saveQuizProgressRouter;