import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
import express from "express"
import { Request, Response } from "express"

dotenv.config()


const defaultGeneration = ` 
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

const generateChatTitleprompt = `
    Jesteś inteligentnym asystentem w aplikacji Notium.
    Twoim zadaniem jest przeanalizowanie pierwszej wiadomości lub kontekstu czatu i wygenerowanie:
    1. Jednej emotki (emoji), która idealnie pasuje do tematu (np. 🌿 dla mitologii, 📜 dla historii, ⚡ dla fizyki).
    2. Krótkiego, zwięzłego tytułu czatu (maksymalnie 4-5 słów).

    ZWRÓĆ WYNIK WYŁĄCZNIE W FORMATOWANIU JSON:
    {
    "emoji": "🌿",
    "title": "Mit arkadyjski i jego ewolucja"
    }

    Zasady:
    - Odpowiedz TYLKO poprawnym kodem JSON.
    - Nie dodawaj żadnych wstępów, komentarzy ani znaczników markdown (nie używaj \`\`\`json).
    - Tytuł musi być w tym samym języku co tekst użytkownika.
`;



const API_KEY = process.env.GEMINI_API_KEY
const Router_AI = express.Router()
const GenAi = new GoogleGenerativeAI(API_KEY!)

Router_AI.post("/ask-ai", async (req: Request, res: Response) => {
    try {
        const { contextContent, userPrompt, type } = req.body
        let systemInstruction = ``

        // Szybki i tani model gemini flash 2.5
        const model = GenAi.getGenerativeModel({ model: "gemini-3.1-flash-lite"})




        switch (type) {
            case "GENERATE_INLINE_CONTENT":
                systemInstruction = inlineAiGenerationPrompt
                break;
            case "GENERATE_TITLE":
                // console.log("Wywołano generateChatMetadata");
                systemInstruction = generateChatTitleprompt
                break;
            case "GENERATE_TEXT":
                systemInstruction = defaultGeneration
                break;
            default:
                systemInstruction = defaultGeneration
        }

        const fullPrompt = `
            INSTRUKCJA SYSTEMOWA:
            ${systemInstruction}
            
            KONTEKST Z EDYTORA (JSON lub tekst):
            ${JSON.stringify(contextContent)}
            
            PROŚBA UŻYTKOWNIKA:
            ${userPrompt}
        `;


        // -------------------------------------------------------------
        // CASE 1: GENEROWANIE TYTUŁU (Jednorazowa odpowiedź JSON)
        // -------------------------------------------------------------
        if (type === "GENERATE_TITLE") {
            const result = await model.generateContent({
                contents: [
                {
                    role: "user",
                    parts: [{ text: `Kontekst: ${contextContent || ""}\nPrompt: ${userPrompt}` }],
                },
                ],
                systemInstruction: systemInstruction,
                generationConfig: {
                    responseMimeType: "application/json", // Gwarantuje, że Gemini zwróci czysty JSON
                },
            });

            const responseText = result.response.text();
            const metadata = JSON.parse(responseText);

            // Odsyłamy jeden gotowy obiekt JSON
            return res.status(200).json(metadata);
        }

        // -------------------------------------------------------------
        // CASE 2: STRUMIENIOWANIE TEKSTU (GENERATE_INLINE_CONTENT / GENERATE_TEXT)
        // -------------------------------------------------------------
        
        // Ustawiamy nagłówki dla strumieniowania HTTP Chunked Response
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        // Pobieramy strumień z Gemini API
        const streamingResult = await model.generateContentStream({
            contents: [
                {
                role: "user",
                parts: [{ text: `Kontekst: ${contextContent || ""}\nPrompt: ${userPrompt}` }],
                },
            ],
            systemInstruction: systemInstruction,
        });

        // Ślemy kolejne fragmenty tekstu do klienta na żywo
        for await (const chunk of streamingResult.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        // Zamykamy strumień po zakończeniu wysyłania
        return res.end();
        

    } catch (error) {
        console.error("Streaming error: ", error)
        if (!res.headersSent) {
            res.status(500).json({ message: "Error generating content", success: false });
        }
    }
})

export default Router_AI