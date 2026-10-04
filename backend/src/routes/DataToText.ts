import { Router, Request, Response } from "express";
import { YoutubeTranscript } from "youtube-transcript";
import multer from "multer";
import * as path from "path";
import { PDFParse } from "pdf-parse";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { IMAGE_ANALYSE } from "../prompts/IMAGE_ANALYSE.js";

dotenv.config();

const DataToTextRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Standardowy model multimodalny do metody generateContent
const geminiModel = genAi.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

// Obsługuje
// 1. Youtube z napisami
// 2. Audio
// 3. PDF
// 4. Zwykły tekst


DataToTextRouter.post("/dataToText", upload.array('files'), async (req: Request, res: Response) => {
    let combinedText = "";

    try {
        const prompt = req.body.prompt;
        const youtubeUrl = req.body.youtubeUrl;

        console.log("Otrzymany link:", youtubeUrl);
        console.log("Prompt od użytkownika:", prompt);

        // Obsługa napisów z YouTube
        if (youtubeUrl) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
                combinedText += transcript.map(t => t.text).join(' ') + "\n\n";
            } catch (e) {
                return res.status(400).json({ success: false, error: "Nie udało się pobrać transkryptu z YouTube. Sprawdź URL." });
            }
        }

        const uploadedFiles = req.files as Express.Multer.File[];

        if (uploadedFiles && uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
                const ext = path.extname(file.originalname).toLowerCase();
                const isAudio = file.mimetype.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'].includes(ext);

                // Obsługa zdjęć
                const isImage = file.mimetype.startsWith('image/')

                // 1. Parsowanie PDF
                if (file.mimetype === "application/pdf" || ext === ".pdf") {
                    const uint8Array = new Uint8Array(file.buffer);
                    const pdfData = new PDFParse({ data: uint8Array });
                    try {
                        combinedText += (await pdfData.getText()).text + "\n\n";
                    } finally {
                        await pdfData.destroy();
                    }
                }

                // 2. Parsowanie Audio przez Gemini
                else if (isAudio) {
                    const base64Data = file.buffer.toString("base64");
                      
                    // Normalizacja MIME type dla Gemini
                    let finalMimeType = file.mimetype
                    if (finalMimeType === "application/octet-stream" || !finalMimeType.startsWith('audio/')) {
                        finalMimeType = ext === ".mp3" ? "audio/mp3" : "audio/wav"
                    }

                    // 2. Wywołujesz generateContent – przekazujesz bufor audio oraz krótki polecenie
                    const result = await geminiModel.generateContent([
                        {
                            inlineData: {
                                mimeType: finalMimeType, // musi być poprawny typ MIME
                                data: base64Data
                            }
                        },
                        "Transcribe the audio verbatim." // instrukcja sterująca dla silnika
                    ]);

                    combinedText += result.response.text() + "\n\n";
                } 
                
                else if (isImage) {
                    const supportedImageTypes = new Set([
                        "image/jpeg",
                        "image/jpg",
                        "image/png",
                        "image/webp",
                        "image/heic",
                        "image/heif"
                    ])

                    const normalizedMimeType = file.mimetype === "image/jpg" 
                        ? "image/jpeg"
                        : file.mimetype
                
                    if(!supportedImageTypes.has(normalizedMimeType)) {
                        throw new Error(
                            `Unsupported image format: ${file.mimetype}`,
                        );
                    }

                    // base64 zwiększa o ok. 33% więc lepiej zachować niższy limit
                    if(file.size > 15 * 1024 * 1024) {
                        throw new Error("Image is too large. Maximum is 15 MB")
                    }

                    const base64Data = file.buffer.toString("base64")

                    const result = await geminiModel.generateContent([
                        {
                            inlineData: {
                                mimeType: normalizedMimeType,
                                data: base64Data,
                            }
                        },
                        IMAGE_ANALYSE.trim()
                    ]);

                    const imageAnalysis = result.response.text().trim()

                    if (!imageAnalysis) {
                        throw new Error(
                            `No useful content could be extracted from ${file.originalname}.`,
                        );
                    }

                    combinedText += 
                        `--- IMAGE: ${file.originalname} ---\n` +
                        imageAnalysis +
                        "\n\n";
                }

                // 3. Zwykły tekst
                else if (file.mimetype === "text/plain" || ext === ".txt") {
                    combinedText += file.buffer.toString('utf-8') + "\n\n";
                }
            }
        }

        console.log("Otrzymane pliki:", uploadedFiles?.map(f => f.originalname));
        console.log("UZBIERANE DANE:\n", combinedText);

        return res.status(200).json({ success: true, message: "Dane Odebrane", extractedText: combinedText });
    } catch (error) {
        console.error("Błąd serwera:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

export default DataToTextRouter;
