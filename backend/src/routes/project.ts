import express from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken';
import { db } from '../db/db.js';
import { project } from '../db/schema.js';


const JWT_SECRET = process.env.JWT_SECRET || "secret"; // w praktyce wrzucasz w .env
const projectRouter = express.Router();

projectRouter.post("/project", (req, res) => {

    const token = req.headers["authorization"]

    // Błędny token lub brak
    if(!token) return res.status(401).json({ 
        message: "Not a valid token", 
        flag: "INVALID_TOKEN",
        success: false 
    })
    
    // pozyskiwanie id użytkownika   
    jwt.verify(token, JWT_SECRET, async (error, decoded) => {
        if(error) {
            return res.status(401).json({ 
            message: "Not a valid token",
            flag: "INVALID_TOKEN",
            success: false 
            })
        }

        const decodedPayload = decoded as JwtPayload & { userId?: number };
        const decodedId = decodedPayload.userId;

        if (!decodedId) {
            return res.status(401).json({ 
            message: "Problem with conversion",
            flag: "JWT_CONVERSION_ERROR",
            success: false 
            })
        }

        
        try {
            const [result] = await db.insert(project).values({
                title: "New Project",
                editorContent: {},
                chatMessages: [],
                userId: decodedId
            }).returning()

            res.status(201).json({
                data: result,
                message: `Created succesfuly project id: ${result.id}`,
                flag: "PROJECT_CREATED",
                success: true
            })
        } catch (error) {
            console.error("Internal server error", error)
            res.status(500).json({ 
                message: "Internal server error",
                flag: "INTERNAL_SERVER_ERROR",
                success: false 
            })
        }
    })

})

export default projectRouter