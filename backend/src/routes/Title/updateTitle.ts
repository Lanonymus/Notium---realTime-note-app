import express from 'express';
import { db } from '../../db/db.js';
import { projects, QuizInstance } from '../../db/schema.js';
import AuthTokenMiddleware from '../../controllers/AuthTokenMiddleware.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const updateTitleRouter = express.Router();

updateTitleRouter.post("/updateTitle", AuthTokenMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Brak userId" });
    }

    const { projectId, newTitle } = req.body;

    try {

        if(newTitle.trim() === "") {
            return res.status(400).json({ success: false, message: "Tytuł projektu nie może być pusty." });
        }

        // Zapis w bazie danych
        await db
            .update(projects)
            .set({
                title: newTitle,
                updatedAt: new Date()
            })
            .where(eq(projects.id, projectId));

        console.log("zaktualizowany projekt: ", newTitle);
        
        return res.status(200).json({ success: true, message: "Tytuł projektu został pomyślnie zaktualizowany." });

    } catch (error) {
        console.error("Internal problem with saving project title", error);
        return res.status(500).json({ success: false, message: "Internal problem with saving project title" });
    }
});

export default updateTitleRouter;