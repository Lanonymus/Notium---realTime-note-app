import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
import express from "express"
import { Request, Response } from "express"

dotenv.config()

const API_KEY = process.env.GEMINI_API_KEY
const Router_AI = express.Router()
const GenAi = new GoogleGenerativeAI(API_KEY!)

Router_AI.post("/ask-ai", async (req: Request, res: Response) => {
    try {
        const { contextContent, userPrompt, type } = req.body
        
        // Szybki i tani model gemini flash 2.5
        const model = GenAi.getGenerativeModel({ model: "gemini-3.1-flash-lite"})


        const systemInstruction = `
            Jesteś asystentem wbudowanym w edytor dokumentów o nazwie Notium. 
            Twoim zadaniem jest przetworzenie przekazanego kontekstu zgodnie z prośbą użytkownika.
            
            Zwracaj TYLKO czysty tekst lub kod formatowania, bez zbędnych komentarzy typu "Oto Twoja odpowiedź:".
            Jeśli modyfikujesz tabelę, staraj się odpowiedzieć w formacie, który łatwo wkleić z powrotem.
        `;

        const inlineAiGenerationPrompt = `
            Jesteś zaawansowanym silnikiem generowania treści w czasie rzeczywistym dla edytora dokumentów Notium.
            Twoim zadaniem jest przetworzenie kontekstu edytora i wygenerowanie odpowiedzi na prośbę użytkownika.

            ### Krytyczne Zasady Formatowania (Strumieniowanie):
            1. Odpowiadaj WYŁĄCZNIE przy użyciu czystego, semantycznego kodu HTML.
            2. ABSOLUTNY ZAKAZ używania bloków kodu Markdown typu \`\`\`html ... \`\`\`. Zacznij pisać czysty kod HTML od pierwszego znaku odpowiedzi.
            3. Dozwolone tagi zgodne ze schematem Tiptap:
            - Paragrafy: <p>Tekst</p>
            - Nagłówki: <h1>, <h2>, <h3>
            - Listy: <ul>, <ol>, ze znacznikami <li>
            - Style: <strong>, <em>
            - Tabele: <table>, <thead>, <tbody>, <tr>, <th>, <td>

            ### Zachowanie przy tabelach:
            Jeśli prośba wymaga tabeli, zacznij od struktury <table>. Pisz zawartość komórek <td> naturalnie. Nie twórz pustych tabel – wypełniaj je treścią w trakcie generowania rzędów.

            Zwracaj TYLKO i WYŁĄCZNIE kod HTML. Brak komentarzy przed i po, brak tekstów typu "Oto wynik:".
        `;


        const fullPrompt = `
            ${type === "inlineAiGeneration" ? inlineAiGenerationPrompt : systemInstruction}
            
            KONTEKST Z EDYTORA (JSON lub tekst):
            ${JSON.stringify(contextContent)}
            
            PROŚBA UŻYTKOWNIKA:
            ${userPrompt}
        `;

        // ustawianie nagłówków strumienia
        res.setHeader("Content-Type", "text/plain; charset=utf-8")
        res.setHeader("Transfer-Encoding", "chunked")
        res.setHeader("Cache-control", "no-cache")
        res.setHeader("Connection", "keep-alive")

        // metoda strumieniowa od gemini
        const result = await model.generateContentStream(fullPrompt)

        for await (const chunk of result.stream){
            const chunkText = chunk.text()
            res.write(chunkText)
        }

        res.end()

    } catch (error) {
        console.error("Streaming error: ", error)
        if (!res.headersSent) {
            res.status(500).json({ message: "Error generating content", success: false });
        }
    }
})

export default Router_AI