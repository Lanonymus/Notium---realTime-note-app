import { Router, json, type RequestHandler } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sampleRepository, type SampleDatabase } from "./sampleRepository.js";
import { sampleStorage } from "./sampleStorage.js";
import { sampleDefinition, VoiceNotConfiguredError } from "./sampleDefinition.js";
import { elevenLabsSampleGenerator } from "./generateSample.js";
import { voiceSampleService } from "./voiceSampleService.js";

// Wstrzykuj istniejące db, supabaseAdmin i middleware autoryzacji.
// Nie tworzymy drugiej puli połączeń ani drugiego klienta Supabase.
export function createVoiceSamplesRouter(options: {
  db: SampleDatabase;
  supabaseAdmin: SupabaseClient;
  requireAuth: RequestHandler;
  elevenLabsApiKey: string;
  allowedOrigins: string[];
  bucketName?: string;
}) {
  if (!options.allowedOrigins.length)
    throw new Error("Configure frontend allowedOrigins.");


  const voiceSamplesRouter = Router();
  const service = voiceSampleService(
    sampleRepository(options.db),
    sampleStorage(options.supabaseAdmin, options.bucketName),
    elevenLabsSampleGenerator(options.elevenLabsApiKey),
  );

  voiceSamplesRouter.use(options.requireAuth);
  voiceSamplesRouter.use(json({ limit: "2kb" }));


  voiceSamplesRouter.post("/", async (req, res) => {

    res.setHeader("Cache-Control", "no-store");
    // Cookie auth: nie pozwalamy obcej stronie inicjować kosztownej generacji.
    if (!options.allowedOrigins.includes(req.get("origin") ?? "")) {
      res
        .status(403)
        .json({ status: "failed", message: "Origin not allowed." });
      return;
    }
    
    const { voiceId, languageId } = req.body ?? {};
    
    if (
      typeof voiceId !== "string" ||
      typeof languageId !== "string" ||
      voiceId.length > 50 ||
      languageId.length > 12
    ) {
      res
        .status(400)
        .json({ status: "failed", message: "Provide voiceId and languageId." });
      return;
    }
    let definition;
    
    try {
      definition = sampleDefinition(voiceId, languageId);
    } catch (error) {
      if (error instanceof VoiceNotConfiguredError) {
        res.status(503).json({ status: "failed", message: "This voice is not configured yet." });
        return;
      }
      res
        .status(400)
        .json({ status: "failed", message: "Unsupported voice or language." });
      return;
    }
    try {
      const result = await service.getOrCreate(definition);
      if (result.status === "pending") res.setHeader("Retry-After", "2");
      res
        .status(
          result.status === "ready"
            ? 200
            : result.status === "pending"
              ? 202
              : 503,
        )
        .json(result);
    } catch {
      res
        .status(503)
        .json({
          status: "failed",
          message: "Voice samples temporarily unavailable. Try again.",
        });
    }
  });
  return voiceSamplesRouter;
}
