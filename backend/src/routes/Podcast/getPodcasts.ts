import express from 'express';
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { eq } from 'drizzle-orm';
import AuthTokenMiddleware from '../../controllers/AuthTokenMiddleware.js';
import { projects } from '../../db/schema.js';
import { db } from '../../db/db.js';
import { supabaseAdmin } from '../../db/supabaseAdmin.js';



dotenv.config()

const getPodcastsRouter = express.Router()

getPodcastsRouter.post("/getPodcasts", AuthTokenMiddleware, async (req, res) => {
    // Weryfikacja id użytkownika
    const userId = req.userId

    if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    const { projectId } = req.body

    if(!projectId) return res.status(400).json({ success: false, message: "Nie podano projectID do pobrania podkastów"})

    try {
        const [projectData] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))

        if(!projectData) return res.status(500).json({ success: false, message: "Internal problem with loading podcasts"})

        const podcasts = projectData.podcasts
        const title = projectData.title

        if(!podcasts) return res.status(404).json({ success: false, message: "no podcasts found"})

        const podcastsWithAudio = podcasts.map((podcast) => {
            const filePath = `podcasts/audio/${podcast.id}.wav`;

            const { data } = supabaseAdmin.storage
                .from("Notium_Media")
                .getPublicUrl(filePath);

            return {
                ...podcast,
                audioUrl: data.publicUrl,
            };
        });

        return res.status(200).json({ 
            success: true,
            podcastsWithAudio, 
            title,
        });
            
    } catch (error) {
        console.error("Internal problem with loading podcasts", error);
        return res.status(500).json({ success: false, message: "Internal problem with loading podcasts"})
    }
})

export default getPodcastsRouter

