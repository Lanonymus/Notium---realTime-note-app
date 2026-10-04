import { Router, json } from "express";
import dotenv from "dotenv";
import { ZodError } from "zod";
import AuthTokenMiddleware from "../../controllers/AuthTokenMiddleware.js";
import { EXAMPLE_VOICES } from "../shared/podcastVoices.js";
import { normalizeLanguageId } from "../shared/podcastLanguages.js";
import { scenarioSchema } from "./podcastContract.js";
import {
  generateElevenLabsPodcast,
  PodcastProviderError,
} from "./elevenLabsPodcast.js";
import { db } from "../../db/db.js";
import { savePodcastToProject } from "../HelperFunctions/savePodcastToProject.js";
import { savePodcastAudio } from "../HelperFunctions/savePodcastAudio.js";

dotenv.config();
const generatePodcastAudioRouter = Router();
const activeUsers = new Set<string>();
const MAX_ACTIVE = 2; // Per process; multi-instance deployments need a shared queue/limiter.

generatePodcastAudioRouter.post("/generatePodcastAudio", AuthTokenMiddleware, json({ limit: "300kb" }), async (req, res) => {
    
    res.setHeader("Cache-Control", "no-store");

    const userId = (req as typeof req & { userId?: string }).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Please sign in." });
      return;
    }

    const parsed = scenarioSchema.safeParse(req?.body.scenario);
    
    if (!parsed.success) {
      res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid podcast scenario (maximum 2000 characters per utterance, no audio tags).",
        });
      return;
    }

    const scenario = parsed.data;
    const { projectId } = req.body;

    const language = normalizeLanguageId(scenario.language);
    if (
      !language ||
      scenario.speakers.some(
        (speaker) => !EXAMPLE_VOICES.some((v) => v.voiceId === speaker.id),
      )
    ) {
      res
        .status(400)
        .json({ success: false, message: "Unsupported voice or language." });
      return;
    }

    scenario.language = language;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res
        .status(503)
        .json({
          success: false,
          message: "Configure ELEVENLABS_API_KEY on the server.",
        });
      return;
    }

    if (activeUsers.has(userId) || activeUsers.size >= MAX_ACTIVE) {
      res.setHeader("Retry-After", "10");
      res
        .status(429)
        .json({
          success: false,
          message: "Podcast generation is busy. Please try again shortly.",
        });
      return;
    }


    activeUsers.add(userId);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error("Podcast timeout")),
      900_000,
    );

    const onClose = () => {
      if (!res.writableEnded) controller.abort();
    };

    res.on("close", onClose);

    try {
      const result = await generateElevenLabsPodcast(
        scenario, 
        {
          apiKey,
          signal: controller.signal,
        }
      );

      if (res.destroyed || controller.signal.aborted) return;

      const audio = {
          mimeType: "audio/wav", 
          base64: result.wav.toString("base64")         
      }

      res.json({
        success: true,
        podcast: result.podcast,
        audio: audio,
        providerRequests: result.providerRequests,
      });

      // zapis w tle po zwróceniu contentu
      void Promise.all([
        savePodcastToProject(projectId, result.podcast),
        savePodcastAudio(result.wav, scenario.id),
      ]).catch((error) => {
        console.error("[podcast-save] Failed:", error);
      });      






    } catch (error) {

      if (res.destroyed) return;
      
      console.error("[podcast-audio] Failed", {
        provider: "elevenlabs",
        status:
          error instanceof PodcastProviderError ? error.status : undefined,
        errorType: error instanceof Error ? error.name : "Unknown",
        message:
          error instanceof ZodError ? "Invalid provider response shape" : error instanceof Error
              ? error.message
              : "Unknown failure",
      });
      const status = controller.signal.aborted ? 504 
          : error instanceof PodcastProviderError && error.status === 429
          ? 429
          : 502;
      res
        .status(status)
        .json({
          success: false,
          message:
            status === 504
              ? "Podcast generation timed out."
              : status === 429
                ? "ElevenLabs rate limit reached. Please try again later."
                : "Couldn't generate complete audio with valid timestamps. Check ElevenLabs access and the server configuration.",
        });
    } finally {
      clearTimeout(timeout);
      res.off("close", onClose);
      activeUsers.delete(userId);
    }
  }
)
export default generatePodcastAudioRouter;
