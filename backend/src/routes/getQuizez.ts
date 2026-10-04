import express from 'express';
import { db } from '../db/db.js';
import { projects } from '../db/schema.js';
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import AuthTokenMiddleware from '../controllers/AuthTokenMiddleware.js';
import { eq } from 'drizzle-orm';



dotenv.config()

const getQuizezRouter = express.Router()

getQuizezRouter.post("/getQuizez", AuthTokenMiddleware, async (req, res) => {
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

        if(!projectData) return res.status(500).json({ success: false, message: "Internal problem with loading quizez"})

        const quizez = projectData.quizes
        const title = projectData.title

        // console.log(quizez);
        

        return res.status(200).json({ quizez, title});
            
    } catch (error) {
        console.error("Internal problem with loading quizez", error);
        return res.status(500).json({ success: false, message: "Internal problem with loading quizez"})
    }
})

export default getQuizezRouter

