import express from 'express';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import AuthTokenMiddleware from '../../controllers/AuthTokenMiddleware.js';
import { db } from '../../db/db.js';
import { FlashcardsSet, projects } from '../../db/schema.js';

dotenv.config();

const saveFlashcardSetProgressRouter = express.Router();

saveFlashcardSetProgressRouter.post("/saveFlashcardSetProgress", AuthTokenMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Brak userId" });
    }

    const { projectId, latestFlashcardSet, latestFlashcardSetId } = req.body;

    try {
        const [project] = await db
            .select({
                flashcardSets: projects.flashcardSets
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

        if (!project) {
            return res.status(404).json({ success: false, message: "Nie znaleziono projektu!!" });
        }

        const currentFlashcardSets = (project.flashcardSets as FlashcardsSet[]) || [];

        if (currentFlashcardSets.length === 0) {
            return res.status(400).json({ success: false, message: "Brak fiszek do zaktualizowania." });
        }

        // Szukamy po id seta, a jeśli nie podano/nie znaleziono – wybieramy ostatni fiszki
        let targetIndex = latestFlashcardSetId ? currentFlashcardSets.findIndex(set => set.id === latestFlashcardSetId) : -1;
        if (targetIndex === -1) {
            targetIndex = currentFlashcardSets.length - 1;
        }

        // Tworzymy nową tablicę z podmienionymi odpowiedziami dla wskazanego setu fiszek
        const updatedFlashcardSets = currentFlashcardSets.map((set, index) => {
            if (index === targetIndex) {
                return latestFlashcardSet
            }
            return set;
        });

        // Zapis w bazie danych
        await db
            .update(projects)
            .set({
                flashcardSets: updatedFlashcardSets,
                updatedAt: new Date()
            })
            .where(eq(projects.id, projectId));

        console.log("zaktualizowany set fiszek: ", latestFlashcardSet.currentCardIndex);
        
        return res.status(200).json({ success: true, message: "Postęp setu fiszek został pomyślnie zapisany." });

    } catch (error) {
        console.error("Internal problem with saving fiszki progress", error);
        return res.status(500).json({ success: false, message: "Internal problem with saving flashcardsSet progress" });
    }
});

export default saveFlashcardSetProgressRouter;