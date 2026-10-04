import express from "express";
import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import AuthTokenMiddleware from "../../controllers/AuthTokenMiddleware.js";
import { db } from "../../db/db.js";
import { projects } from "../../db/schema.js";
import {
  requestSchema,
  extractNotes,
  prepareScenario,
  finalizeScenario,
} from "./scenarioCore.js";

const generateScenarioRouter = express.Router();

function errorDetails(error: unknown) {
  const value = error as { 
    name?: unknown; 
    message?: unknown; 
    status?: unknown 
  } | null;

  const message = typeof value?.message === "string" ? value.message : "Unknown error";
  const key = process.env.GEMINI_API_KEY;

  return {
    name: typeof value?.name === "string" ? value.name : "Error",
    status: typeof value?.status === "number" ? value.status : undefined,
    message: (key ? message.split(key).join("[REDACTED]") : message).slice(0, 2000),
  };
}

generateScenarioRouter.post("/generateScenario", AuthTokenMiddleware, async (req, res) => {

    const userId = (req as typeof req & { userId?: string }).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Please sign in." });
      return;
    }

    // validacja danych sprawdzania czy od frontendu wszystko przyszło jak miało używając zoda - tzw. foremka
    const parsed = requestSchema.safeParse(req.body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ success: false, message: "Invalid PodcastData" });
      return;
    }

    // dane z frontendu
    const { podcastData } = parsed.data;
    let stage = "load-project";
    
    try {
      // UWAGA: zapytanie z przesłanego pliku sprawdza tylko ID projektu.
      // Dodaj tutaj swój istniejący warunek właściciela/członkostwa;
      // AuthTokenMiddleware potwierdza logowanie, nie dostęp do tego projektu.


      let prepared;
      try {
        // tworzymy scenariusz z dodatkowych materiałów oraz z orginalnych notatek
        prepared = prepareScenario(
          podcastData,
          podcastData.notes
        )
      } catch (e) {
        res
          .status(400)
          .json({
            success: false,
            message: e instanceof Error ? e.message : "Invalid source data.",
          });
        return;
      }

      const model = process.env.GEMINI_AI_MODEL;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!model || !apiKey) {
        res
          .status(503)
          .json({
            success: false,
            message: "Scenario generation is not configured.",
          });
        return;
      }
      if (/tts|live|image/i.test(model)) {
        res.status(503).json({success:false, message:"GEMINI_AI_MODEL must select a text model supporting structured output, not TTS/live/image."});
        return;
      }
      
      stage = "google-request";
      const startedAt = Date.now();
      console.info("[scenario] Google request started", { model, maxOutputTokens: 16000 });
      

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({                                                                                    
        model,
        contents: [{ role: "user", parts: [{ text: prepared.prompt }] }],
        config: {
          systemInstruction: prepared.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: prepared.responseSchema,
          temperature: 0.3,
          maxOutputTokens: 16000,
          httpOptions: { timeout: 120_000 },
        },
      });

      stage = "google-response";
      const candidate = response.candidates?.[0];
      const responseText = response.text;
      
      console.info("[scenario] Google response received", {
        model,
        elapsedMs: Date.now() - startedAt,
        finishReason: candidate?.finishReason,
        blockReason: response.promptFeedback?.blockReason,
        textLength: responseText?.length ?? 0,
      });

      console.log("google scenario: ", responseText);
      

      if (candidate?.finishReason !== "STOP" || !responseText) {
        res
          .status(502)
          .json({
            success: false,
            message:
              "The model did not complete the scenario. Check server logs for finishReason/blockReason.",
          });
        return;
      }

      stage = "validate-scenario";
      

      let scenario;
      try {
        scenario = finalizeScenario(JSON.parse(responseText), prepared);
      } catch (error) {
        console.error("[scenario] Invalid generated JSON/scenario", errorDetails(error));
        res
          .status(502)
          .json({
            success: false,
            message:
              "The model returned an invalid scenario. Please try again.",
          });
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({ success: true, scenario });

      console.info("[scenario] Scenario ready", { chapters: scenario.chapters.length });
      

    } catch (error) {
      console.error("[scenario] Failed", {stage, model: process.env.GEMINI_AI_MODEL, ...errorDetails(error)});
      res
        .status(502)
        .json({
          success: false,
          message: "Couldn't generate the scenario. Please try again.",
        });
    }
  },
);
export default generateScenarioRouter;
