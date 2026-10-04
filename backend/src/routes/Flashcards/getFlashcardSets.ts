import express from 'express';
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { eq } from 'drizzle-orm';
import AuthTokenMiddleware from '../../controllers/AuthTokenMiddleware.js';
import { projects } from '../../db/schema.js';
import { db } from '../../db/db.js';



dotenv.config()

const getFlashcardsRouter = express.Router()

getFlashcardsRouter.post("/getFlashcardSets", AuthTokenMiddleware, async (req, res) => {
    // Weryfikacja id użytkownika
    const userId = req.userId

    if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    const { projectId } = req.body

    if(!projectId) return res.status(400).json({ success: false, message: "Nie podano projectId"})


    try {
        const [projectData] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))

        if(!projectData) return res.status(500).json({ success: false, message: "Internal problem with loading FlashcardSets"})

        const flashcardSets = projectData.flashcardSets
        const title = projectData.title
        // console.log(quizez); lol
        

        return res.status(200).json({ flashcardSets, title});
            
    } catch (error) {
        console.error("Internal problem with loading flashcardSets", error);
        return res.status(500).json({ success: false, message: "Internal problem with loading flashcardSets"})
    }
})

export default getFlashcardsRouter

