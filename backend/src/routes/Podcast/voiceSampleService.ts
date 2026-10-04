import { randomUUID } from "node:crypto";
import type { SampleDefinition } from "./sampleDefinition.js";
import type { sampleRepository } from "./sampleRepository.js";
import { SIGNED_URL_SECONDS, type SampleStorage } from "./sampleStorage.js";
import type { VoiceSampleResponse } from "../shared/voiceSampleResponse.js";
import type { VoiceSampleRow } from "../../db/schema.js";
import { ElevenLabsSampleError } from "./generateSample.js";
import { VOICE_CATALOG } from "../shared/podcastVoices.js";

export function voiceSampleService(
  repo: ReturnType<typeof sampleRepository>,
  storage: SampleStorage,
  generate: (definition: SampleDefinition) => Promise<Buffer>,
) {
  
  async function describe(row: VoiceSampleRow): Promise<VoiceSampleResponse> {
    if (row.status === "ready" && row.storageKey) {
      const url = await storage.signedUrl(row.storageKey);
      if (url)
        return {
          status: "ready",
          id: row.id,
          url,
          expiresIn: SIGNED_URL_SECONDS,
        };
      await repo.missing(row.id, row.storageKey);
      return { status: "pending", id: row.id, retryAfterMs: 2000 };
    }
    if (row.status === "failed")
      return {
        status: "failed",
        id: row.id,
        message:
          row.attempts >= 3
            ? "Sample generation failed repeatedly. Please contact support."
            : "Couldn't generate the sample. Try again in 30 seconds.",
      };
    return { status: "pending", id: row.id, retryAfterMs: 2000 };
  }

  return {
    async getOrCreate(definition: SampleDefinition): Promise<VoiceSampleResponse> {
      let row = await repo.ensure(definition);
      
      if (row.status === "ready") return describe(row);
      
      const token = randomUUID();
      const claimed = await repo.claim(row.id, token);
      if (!claimed) {
        await repo.exhaust(row.id);
        row = (await repo.find(row.id))!;
        return describe(row);
      }

      // Każda próba ma osobny plik: stary proces nie nadpisze nowszej próbki.
      const name = VOICE_CATALOG.find((voice) => voice.voiceId === definition.voiceId)?.name
      const key = `samples/${name}/${definition.languageId}/${definition.cacheKey}/${token}.wav`;
      try {
        const wav = await generate(definition);
        await storage.upload(key, wav);
      } catch (error) {
        console.warn("Voice sample generation/upload failed", {
          provider: definition.provider,
          status: error instanceof ElevenLabsSampleError ? error.status : undefined,
        });
        // Nie zwracamy klientowi surowych błędów dostawców.
        await repo.fail(row.id, token);
        return describe((await repo.find(row.id))!);
      }

      // Błąd sieci przy UPDATE może oznaczać, że zapis jednak się udał.
      // Nie usuwamy wtedy pliku ani nie oznaczamy wpisu jako failed.
      const won = await repo.ready(row.id, token, key);
      if (!won) {
        // Token stracił ważność; ten konkretny obiekt nie jest wynikiem zwycięzcy.
        await storage
          .remove(key)
          .catch(() => console.warn("Voice sample orphan cleanup deferred."));
      }
      return describe((await repo.find(row.id))!);
    },
  };
}
