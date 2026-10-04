import type { SampleDefinition } from "./sampleDefinition.js";

const MAX_PCM_BYTES = 24000 * 2 * 90;

export function pcmToWav(pcm: Buffer) {
  if (!pcm.length || pcm.length % 2 || pcm.length > MAX_PCM_BYTES)
    throw new Error("Invalid PCM length or sample exceeds 90 seconds.");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export class ElevenLabsSampleError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`ElevenLabs TTS HTTP ${status}`);
    this.status = status;
    this.name = "ElevenLabsSampleError";
  }
}

/** Same contract as before: SampleDefinition -> Buffer containing a complete WAV.
 * No retries here: repository leases and attempt limits manage retry ownership.
 */
export function elevenLabsSampleGenerator(apiKey: string) {
  if (!apiKey?.trim()) throw new Error("Missing ELEVENLABS_API_KEY on server.");

  return async (d: SampleDefinition): Promise<Buffer> => {

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(d.providerVoiceId)}?output_format=${d.outputFormat}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({
          text: d.text,
          model_id: d.modelId,
          language_code: d.languageCode,
          voice_settings: d.voiceSettings,
        }),
      },
    );
    if (!response.ok) {
      await response.body?.cancel();
      throw new ElevenLabsSampleError(response.status);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!contentType || !(contentType.startsWith("audio/") || contentType === "application/octet-stream")) {
      await response.body?.cancel();
      throw new Error("Expected binary PCM audio from ElevenLabs.");
    }

    if (!response.body) throw new Error("Empty ElevenLabs response.");

    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_PCM_BYTES) {
          await reader.cancel();
          throw new Error("Sample exceeds 90 seconds.");
        }
        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }
    
    return pcmToWav(Buffer.concat(chunks, size));
  };
}
