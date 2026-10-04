import express from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { eq } from 'drizzle-orm';
import AuthTokenMiddleware from '../../controllers/AuthTokenMiddleware.js';
import {Flashcard, FlashcardsSet, projects } from '../../db/schema.js';
import { db } from '../../db/db.js';
import { difficultyInstructions } from './difficultyInstructions.js';
import { saveFlashcardsToProject } from './saveFlashcardsToProject.js';





dotenv.config()

const generateFlashcardsRouter = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});
const geminiAiModel = process.env.GEMINI_AI_MODEL!

generateFlashcardsRouter.post("/generateFlashcards", AuthTokenMiddleware, async (req, res) => {
    // Weryfikacja id użytkownika
    const userId = req.userId

    if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    const { projectId, amount, difficulty, additionalInstructions, notes } = req.body



    // 1. Definicja JSON Schema dla Gemini Structured Outputs (opisy przetłumaczone)
    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            flashcards: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: {
                            type: Type.STRING,
                            description: "Question or active recall prompt"
                        },

                        back: {
                            type: Type.STRING,
                            description: "Correct answer to the question"
                        }
                    },
                    required: ["front", "back"]
                }
            }
        },
        required: ["flashcards"]
    };

    // 2. Zoptymalizowany Prompt (System Instruction)
    const systemInstruction = `
        You are an expert in education, cognitive science, and active recall learning.

        Your task is to analyze the provided note and generate high-quality flashcards that help the learner actively recall and understand the material.

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        CORE REQUIREMENTS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        1. LANGUAGE
        All generated flashcards MUST be written in English.

        2. SOURCE
        Use ONLY information supported by the provided note.

        Do not invent facts, examples, definitions, dates, names, relationships, or explanations that are not supported by the note.

        3. QUANTITY
        Generate EXACTLY ${amount} flashcards.

        4. DIFFICULTY
        Generate the flashcards according to this difficulty level:

        ${difficultyInstructions[difficulty]}

        Difficulty must influence the actual cognitive demand of the flashcards.

        Do NOT simply make questions longer to make them more difficult.

        5. LEARNING PRINCIPLE
        Prioritize active recall.

        Questions should require the learner to retrieve information from memory rather than recognize it from multiple-choice options.

        6. QUALITY
        Each flashcard should test one clear concept.

        Avoid vague, ambiguous, overly broad, or trivial questions.

        7. ANSWERS
        The answer must directly and clearly answer the question.

        Keep answers concise, but include enough information to make the flashcard useful for learning.

        8. REDUNDANCY
        Avoid generating multiple flashcards that test essentially the same fact.

        9. COVERAGE
        Distribute flashcards across the important concepts present in the note.

        Prioritize:
        - key concepts
        - definitions
        - relationships
        - processes
        - causes and effects
        - important distinctions
        - important details

        Do not focus excessively on one small section of the note.

        10. ADDITIONAL USER INSTRUCTIONS
        The user may provide additional instructions.

        Follow them when they do not conflict with the rules above.

        Additional instructions:
        ${additionalInstructions?.trim() || "None provided"}

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        FLASHCARD FORMAT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        Each flashcard must contain:

        - front: a clear question or recall prompt
        - back: the correct answer

        The flashcard front should NOT contain the answer.

        The flashcard back should NOT contain unnecessary commentary.

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        FINAL VALIDATION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        Before returning the result, verify that:

        - there are exactly ${amount} flashcards
        - every flashcard is based on the provided note
        - every flashcard matches the requested difficulty
        - there are no duplicate concepts
        - every front has one clear question
        - every back contains the answer
        - all content is in English
    `;

    try {
        
        // console.log("czysty tekst: ", plainTextForLLM);
        if(!notes.trim()) {
            return res.status(400).json({ success: false, message: "no notes provided"})
        }
        
        const response = await ai.models.generateContent({
            model: geminiAiModel,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate flashcards from the following note. NOTE: ${notes}`
                        }
                    ]
                }
            ],
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
                temperature: 0.3,
            },
            });

        const flashcardsSetData = JSON.parse(response.text!);

        if (
            !flashcardsSetData.flashcards ||
            flashcardsSetData.flashcards.length !== amount
        ) {
            return res.status(500).json({
                success: false,
                message: "Generated flashcard count does not match requested amount"
            });
        }        
        
        const flashcards: Flashcard[] = flashcardsSetData.flashcards.map(
            (card: { front: string, back: string}) => ({
                id: uuidv4(),
                front: card.front,
                back: card.back,
                state: "New",
                points: 0    
        }))

        const newFlashcardsSet: FlashcardsSet = {
            id: uuidv4(),
            flashcards,
            tempFlashcards: flashcards,
            newFlashcards: flashcards,
            learningFlashcards: [],
            masteredFlashcards: [],
            favoritedFlashcards: [],
            currentCardIndex: 0,
            mistakesCount: 0,
            correctAnswersCount: 0,            
            settings: {
                isTrackingProgress: true,
                settingsIsFlipOn: false,
                starredOnly: false,
                isAutoAudio: false,
                isRandomCardOn: false

            },
            createdAt: new Date().toISOString(),
            startTime: "",
            finishTime: ""
            
        }
        saveFlashcardsToProject(projectId, newFlashcardsSet)
 

        return res.status(200).json({ newFlashcardsSet });
            
    } catch (error) {
        console.error("Internal problem with generating quiz", error);
        return res.status(500).json({ success: false, message: "Internal problem with generating quiz"})
    }
})

export default generateFlashcardsRouter




// Typy dla struktury Tiptap JSON
type TiptapNode = {
  type?: string;
  text?: string;
  content?: TiptapNode[];
  [key: string]: any;
};

function extractTextFromJson(node: TiptapNode): string {
  // Jeśli to jest najniższy poziom (węzeł tekstowy), zwracamy jego tekst
  if (node.type === 'text') {
    return node.text || '';
  }

  // Jeśli węzeł ma w sobie inne elementy (np. akapity, listy, nagłówki)
  if (node.content && Array.isArray(node.content)) {
    // Odpalamy funkcję rekurencyjnie dla każdego dziecka
    const text = node.content.map(extractTextFromJson).join('');

    // Ważne: Dodajemy znak nowej linii po elementach blokowych, 
    // żeby LLM nie dostał jednej wielkiej ściany złączonego tekstu.
    const blockNodes = ['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock'];
    if (node.type && blockNodes.includes(node.type)) {
      return text + '\n';
    }
    
    return text;
  }

  return '';
}
