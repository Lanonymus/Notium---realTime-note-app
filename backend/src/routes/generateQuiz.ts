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
import { saveQuizToProject } from './HelperFunctions/saveQuizToProject.js';




dotenv.config()

const generateQuizRouter = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY});
const geminiAiModel = process.env.GEMINI_AI_MODEL!

generateQuizRouter.post("/generateQuiz", AuthTokenMiddleware, async (req, res) => {
    // Weryfikacja id użytkownika
    const userId = req.userId

    if(!userId) return res.status(401).json({ success: false, message: "Brak userId"})

    const { projectId, extractedNotes, quizFormats, quizTopics, selectedTopics, questionCount, spacedRepetition,
         wrongAnswers, timeLimit, immediateFeedback } = req.body


    const shouldGenerateTopics = !selectedTopics || selectedTopics.length === 0
    const hasWrongAnswers = spacedRepetition && Array.isArray(wrongAnswers) && wrongAnswers.length > 0
    const targetCount = Math.min(Math.max(Number(questionCount) || 5, 1), 15);

    // 1. Definicja JSON Schema dla Gemini Structured Outputs (opisy przetłumaczone)
    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            ...(shouldGenerateTopics && {
                topics: {
                    type: Type.ARRAY,
                    description: "Main themes and subtopics extracted from the note",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { 
                                type: Type.STRING 
                            },
                            name: { 
                                type: Type.STRING
                            },
                            description: { 
                                type: Type.STRING 
                            },
                            difficulty: { 
                                type: Type.STRING, enum: ["Easy", "Medium", "Hard"]
                            },
                        },
                        required: ["id", "name", "description", "difficulty"],
                    },
                },
            }),

            questions: {
                type: Type.ARRAY,
                items: {
                    // Używamy anyOf, aby rozdzielić schematy dla różnych typów pytań
                    anyOf: [
                        // 1. Schemat dla Multiple Choice
                        {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ["multipleChoice"] },
                                options: { 
                                    type: Type.ARRAY, 
                                    items: { type: Type.STRING },
                                    description: "Exactly 4 options"
                                },
                                correctIndex: { 
                                    type: Type.INTEGER, 
                                    description: "Index of the correct answer (0-3)" 
                                },
                                explanation: { type: Type.STRING },
                                hint: { type: Type.STRING },
                                topicId: { type: Type.STRING },
                                timeInSeconds: { type: Type.INTEGER }
                            },
                            // TUTAJ JEST KLUCZ: Wymagamy options i correctIndex!
                            required: ["id", "text", "type", "options", "correctIndex", "explanation", "hint", "timeInSeconds"]
                        },
                        
                        // 2. Schemat dla True / False
                        {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ["true/false"] },
                                correctAnswer: { type: Type.BOOLEAN },
                                explanation: { type: Type.STRING },
                                hint: { type: Type.STRING },
                                topicId: { type: Type.STRING },
                                timeInSeconds: { type: Type.INTEGER }
                            },
                            // Wymagamy correctAnswer
                            required: ["id", "text", "type", "correctAnswer", "explanation", "hint", "timeInSeconds"]
                        },
                        
                        // 3. Schemat dla Short Answer
                        {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ["shortAnswer"] },
                                explanation: { type: Type.STRING, description: "Model answer" },
                                hint: { type: Type.STRING },
                                topicId: { type: Type.STRING },
                                timeInSeconds: { type: Type.INTEGER }
                            },
                            // Tutaj wystarczą standardowe pola
                            required: ["id", "text", "type", "explanation", "hint", "timeInSeconds"]
                        }
                    ]
                }
            }
        },
        required: shouldGenerateTopics ? ["topics", "questions"] : ["questions"],
    };

    // 2. Zoptymalizowany Prompt (System Instruction)
    const systemInstruction = `
        You are an education and cognitive learning expert. Your task is to analyze the provided note and generate a well-balanced quiz.
        
        CRITICAL RULES:
        1. Language: All generated content (questions, options, explanations, hints, topics) MUST be in English.
        2. Quantity: Generate EXACTLY ${targetCount} questions.
        3. Allowed Formats: ${quizFormats.join(', ')}. DO NOT use any other formats.

        QUESTION STRUCTURE RULES:
        - 'multipleChoice': Provide exactly 4 options in 'options' and the correct index in 'correctIndex' (0-3).
        - 'true/false': Provide a boolean in 'correctAnswer'. Leave 'options' empty.
        - 'shortAnswer': Provide a model answer in 'explanation'. Leave 'options', 'correctIndex', and 'correctAnswer' empty.

        TIME LIMIT FEATURE:
        ${timeLimit 
            ? "The user has enabled a STRICT TIME LIMIT. Calculate 'timeInSeconds' for each question carefully based on cognitive load and reading length (e.g., 15-20s for True/False, 30-45s for Multiple Choice, 60-90s for Short Answer). Make it challenging but fair." 
            : "Provide a standard recommended 'timeInSeconds' for each question type to maintain user focus (e.g., 30s, 45s, or 60s)."
        }

        TOPICS HANDLING:
        ${shouldGenerateTopics 
            ? "Analyze the note and extract 3-5 main topics into the 'topics' array. Assign an appropriate 'topicId' to each question." 
            : `Use EXACTLY these existing topics: ${JSON.stringify(selectedTopics)}. Assign each question's 'topicId' to one of these IDs. DO NOT generate new topics.`
        }

        ${hasWrongAnswers 
            ? `SPACED REPETITION & NEURAL PATHWAY REINFORCEMENT (CRITICAL):
        The user is currently struggling with specific concepts. Here is the history of their recent wrong answers:
        ${JSON.stringify(wrongAnswers, null, 2)}
        
        TASK: Dedicate a significant portion of the generated questions to target these exact misconceptions. 
        - DO NOT just repeat the exact same questions. 
        - Rephrase the scenarios or test the underlying concepts from a different angle to force active recall and solidify neural pathways.
        - Ensure the 'explanation' and 'hint' explicitly address why the user's previous reasoning ('userAnswer') might have been flawed.` 
            : ""
        }
    `;

    try {
        // extracting notes here 

        // const [result] = await db
        //     .select()
        //     .from(projects)
        //     .where(eq(projects.id, projectId))

        // const documentJson = result.editorContent
        // const plainTextForLLM = extractTextFromJson(documentJson!)

        // console.log("czysty tekst: ", plainTextForLLM);
        
        const response = await ai.models.generateContent({
            model: geminiAiModel,
            contents: [
                // Przetłumaczony wstęp do notatki
                { role: 'user', parts: [{ text: `Note content:\n${extractedNotes}` }] }
            ],
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
                temperature: 0.3,
            },
            });

        const quizData = JSON.parse(response.text!);
        
        if(quizData.questions && Array.isArray(quizData.questions)) {
            if (quizData.questions.length > targetCount) {
                quizData.questions = quizData.questions.slice(0, targetCount)
            }
        } else {
            return res.status(500).json({ success: false, message: "Internal problem with generating quiz"})
        }

        const quizStartTime = new Date().toISOString()

        const newQuiz = {
            id: uuidv4(),
            createdAt: quizStartTime,
            quizFormats: quizFormats,
            topics: quizTopics ? quizTopics : quizData.topics,
            questions: quizData.questions,
            settings: {
                spacedRepetition: spacedRepetition,
                timeLimit: timeLimit,
                immediateFeedback: immediateFeedback
            },
            userAnswers: [],
            selectedTopics: selectedTopics,
            finishTime: ""
        }
        saveQuizToProject(projectId, newQuiz)      

        return res.status(200).json({ quizData, newQuiz, quizStartTime});
            
    } catch (error) {
        console.error("Internal problem with generating quiz", error);
        return res.status(500).json({ success: false, message: "Internal problem with generating quiz"})
    }
})

export default generateQuizRouter

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