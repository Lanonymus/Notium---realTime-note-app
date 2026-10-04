import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken';
import { db } from '../../db/db.js';
import { projects, projectSkills } from '../../db/schema.js';
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { GoogleGenerativeAI } from '@google/generative-ai';
import AuthTokenMiddleware from '../../controllers/AuthTokenMiddleware.js';

// 1. Parsery Tiptapa konwertujące html -> AST
import { generateJSON } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import { projectSchema, systemPrompt } from './data.js';
import { generatedNoteSchema } from './dataShape.js';

dotenv.config()



const projectRouter = express.Router();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAi.getGenerativeModel({ model: "gemini-3.1-flash-lite" });


projectRouter.post("/createProject", AuthTokenMiddleware, async (req: Request, res: Response) => {
    // Weryfikacja id użytkownika
    const userId = req.userId

    if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    const { prompt, contextText, youtubeUrls } = req.body

    try {
        const userMessage = `
            Temat/Instrukcja użytkownika: ${prompt || "Stwórz szczegółowe notatki z poniższych materiałów."}
            
            Materiały źródłowe:
            ${contextText}
        `;        

        const result = await model.generateContent({
            contents: [
            {
                role: "user",
                parts: [{ text: userMessage}],
            },
            ],
            systemInstruction: systemPrompt,
            // wymusz na gemini poprawną strukturę JSON
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: projectSchema,
            }
        });

        // foremka od zoda
        const parsedData = generatedNoteSchema.parse(
            JSON.parse(result.response.text())
        )
        const generatedHtml = parsedData.htmlContent        
        const tiptapJson = generateJSON(generatedHtml, [StarterKit])

        const uniqueSkills = [...new Set(parsedData.skills)]

        // Konwersja HTML na natywną strukturę Tiptapa
        const projectId = uuidv4()

        try {
            const createdProject = await db.transaction(async (tx) => {
                const [project] = await tx.insert(projects).values({
                    id: projectId,
                    icon: parsedData.icon,
                    title: parsedData.title,
                    editorContent: tiptapJson,
                    chatMessages: [],
                    userId,
                    resources: {
                    hasNotes: true,
                    hasQuiz: false,
                    hasFlashcards: false,
                    hasPodcast: false,
                    },
                    type: "Text",
                    coverPrompt: parsedData.coverPrompt,
                    coverImageStatus: "pending",
                }).returning();

                if (uniqueSkills.length > 0) {
                    await tx.insert(projectSkills).values(
                        uniqueSkills.map((skillKey) => ({
                            projectId,
                            skillKey,
                        })),
                    );
                }

                return project
            });


            return res.status(201).json({
                data: createdProject,
                message: `Created succesfuly project id: ${createdProject.id}`,
                flag: "PROJECT_CREATED",
                success: true,
            })

        } catch (error) {
            console.error("Internal server error", error)
            return res.status(500).json({ 
                message: "Internal server error",
                flag: "INTERNAL_SERVER_ERROR",
                success: false 
            })
        }        

    } catch (error) {
        console.error("Błąd generowania materiałów:", error);
        return res.status(500).json({ error: "Nie udało się wygenerować materiałów" });
    }
})

export default projectRouter