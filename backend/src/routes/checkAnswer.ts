import express from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken';
import { db } from '../db/db.js';
import { projects } from '../db/schema.js';
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { GoogleGenAI, Type, Schema } from '@google/genai';
import AuthTokenMiddleware from '../controllers/AuthTokenMiddleware.js';
import { eq } from 'drizzle-orm';
import { required } from 'zod/mini';

dotenv.config()

const checkAnswerRouter = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});
const geminiAiModel = process.env.GEMINI_AI_MODEL!


checkAnswerRouter.post("/checkAnswer", AuthTokenMiddleware, async (req, res) => {
    // Weryfikacja id użytkownika
    const userId = req.userId

    if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    const { question, userAnswer, correctAnswer } = req.body

    // Jasny, precyzyjny prompt w języku angielskim
    const prompt = `
        You are an expert teacher evaluating a student's answer to a quiz question.
        Question: "${question}"
        Official Correct Answer / Explanation: "${correctAnswer}"
        Student's Answer: "${userAnswer}"

        Task: Determine if the student's answer is correct. 
        Rules:
        1. The student's answer does not need to be an exact word-for-word match.
        2. It should be marked correct if it captures the core concept, meaning, or fact presented in the official answer.
        3. Be forgiving of minor typos, but strict on factual accuracy.
    `; 

    try {

    
        const response = await ai.models.generateContent({
            model: geminiAiModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isCorrect: {
                            type: Type.BOOLEAN,
                            description: "True if the student's answer is conceptually correct, otherwise false."
                        },
                        feedback: {
                            type: Type.STRING,
                            description: "Feedback to provide to the student about their answer. Should be clear and concise."
                        }
                    },
                    required: ["isCorrect", "feedback"]
                }
            }
        })

        if(!response.text) return res.status(501).json({ success: false, message: "Unable to parse response from AI model."})
        
        const resultText = response.text;
        const jsonResult = JSON.parse(resultText!); // Parsujemy string do obiektu JS

        return res.status(200).json(jsonResult)
        
            
    } catch (error) {
        console.error("Internal problem with generating quiz");
        return res.status(500).json({ success: false, message: "Internal problem with generating quiz"})
    }

 
})

export default checkAnswerRouter



