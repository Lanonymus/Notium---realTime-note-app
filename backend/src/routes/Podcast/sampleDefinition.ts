import { createHash } from "node:crypto";
import {
  VOICE_CATALOG
} from "../shared/podcastVoices.js";
import {
  getSampleText,
  normalizeLanguageId,
  SAMPLE_MODEL_ID,
  SAMPLE_VERSION,
} from "../shared/podcastLanguages.js";

export class VoiceNotConfiguredError extends Error {}

// Explicit settings make the cache independent of changes in dashboard defaults.
export const SAMPLE_VOICE_SETTINGS = Object.freeze({
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  speed: 1,
});

export type SampleDefinition = ReturnType<typeof sampleDefinition>;

export function sampleDefinition(voiceId: string, language: string) {
  const languageId = normalizeLanguageId(language);

  if(languageId !== "en") {
    if (!languageId || !VOICE_CATALOG.some((v) => v.voiceId === voiceId)) {
      throw new Error("Unsupported voice or language.");
    }
  }

  const providerVoiceId = voiceId?.trim();
  if (!providerVoiceId || !/^[a-zA-Z0-9_-]{10,128}$/.test(providerVoiceId)) {
    throw new VoiceNotConfiguredError(
      `Configure ElevenLabs voice ID for ${voiceId}.`,
    );
  }  

  const provider = "elevenlabs";
  const modelId = SAMPLE_MODEL_ID;
  let text: string;

  if (languageId === "en") {
    const defaultVoiceLine = VOICE_CATALOG.find((voice) => voice.voiceId === voiceId)?.defaultVoiceLine;
    text = defaultVoiceLine ?? "What's up, what are we going to learn today ?";
  } else {
    text = getSampleText(languageId);
  }
  

  // API language_code requires ISO 639-1; Filipino's corresponding code is tl.
  const languageCode = languageId === "fil" ? "tl" : languageId;
  const outputFormat = "pcm_24000";
  const voiceSettings = { ...SAMPLE_VOICE_SETTINGS };
  
  const cacheKey = createHash("sha256")
    .update(
      JSON.stringify({
        provider,
        modelId,
        voiceId,
        providerVoiceId,
        languageId,
        languageCode,
        text,
        voiceSettings,
        outputFormat,
        version: SAMPLE_VERSION,
        format: "wav-pcm16-mono-24000-v1",
      }),
    )
    .digest("hex");
  return {
    provider,
    modelId,
    voiceId,
    providerVoiceId,
    languageId,
    languageCode,
    text,
    voiceSettings,
    outputFormat,
    cacheKey,
  };
}
