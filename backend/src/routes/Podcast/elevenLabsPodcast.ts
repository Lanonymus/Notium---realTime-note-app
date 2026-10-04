import type { Podcast, PodcastScenario, Utterance } from "./podcastTypes.js";
import { MAX_BATCH_CHARACTERS } from "./podcastContract.js";
import {
  alignBatch,
  timedResponseSchema,
  type ScriptTurn,
} from "./podcastAlignment.js";
import createWaveform from "./createWaveform.js";

export const PODCAST_MODEL = "eleven_v3";
export const SAMPLE_RATE = 24000;
const MAX_AUDIO_BYTES = SAMPLE_RATE * 2 * 1800;
const MAX_BATCH_AUDIO_BYTES = SAMPLE_RATE * 2 * 300;


// tutaj przetwarzamy wszystkie wypowiedzi w chapterze na
export function batchTurns(turns: ScriptTurn[]): ScriptTurn[][] {

  const batches: ScriptTurn[][] = [];
  let current: ScriptTurn[] = [];
  let length = 0;

  for (const turn of turns) {
    if (!turn.text.trim() || turn.text.length > MAX_BATCH_CHARACTERS)
      throw new Error("Utterance exceeds dialogue batch limit.");

    if (length + turn.text.length > MAX_BATCH_CHARACTERS) {
      batches.push(current);
      current = [];
      length = 0;
    }

    current.push(turn);
    length += turn.text.length;
  }
  if (current.length) batches.push(current);

  return batches;
}

/** Linear scan: a repeated-group RegExp can overflow V8's stack on audio-sized strings. */
export function isValidBase64(value: string): boolean {
  // każde 4 znaki w base64 odpowiadają dokładnie 3 bajtom danych
  if (!value.length || value.length % 4 !== 0) return false;

  // ucinamy ekstra znaki == lub = na końcu jeśli zostały wypełniacze
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const end = value.length - padding;

  for (let i = 0; i < end; i++) {
    const c = value.charCodeAt(i);
    if (!(
        (c >= 65 && c <= 90) ||
        (c >= 97 && c <= 122) ||
        (c >= 48 && c <= 57) ||
        c === 43 ||
        c === 47)
    )
      return false;
  }
  return true;
}

export function pcmToWav(pcm: Buffer): Buffer {
  if (!pcm.length || pcm.length % 2 || pcm.length > MAX_AUDIO_BYTES)
    throw new Error("Invalid PCM audio size.");
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SAMPLE_RATE, 24);
  h.writeUInt32LE(SAMPLE_RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

export class PodcastProviderError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`ElevenLabs HTTP ${status}`);
    this.status = status;
  }
}

// cały chapter od elevenlabs - audio
async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("Empty provider response.");

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let length = 0;
  const MEGA_BYTES_LIMIT = 24 * 1024 * 1024; // 24 MB limit

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      length += value.byteLength;
      if (length > MEGA_BYTES_LIMIT) {
        await reader.cancel();
        throw new Error("Provider response too large.");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  // Buffer.concat() skleja poszatkowane porcje danych przypływających w całość
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}


/** A single frontend request; bounded provider batches, no ASR/WhisperX.
 * Seconds for each subsequent batch are offset by actual PCM frames, including
 * trailing silence. Concatenate PCM, never standalone WAV/MP3 containers.
 */
export async function generateElevenLabsPodcast(
  scenario: PodcastScenario,
  options: { apiKey: string; signal: AbortSignal; fetcher?: typeof fetch }
): Promise<{ podcast: Podcast; wav: Buffer; providerRequests: number }> {

  if (!options.apiKey.trim()) throw new Error("Missing ELEVENLABS_API_KEY.");

  // przetwarzanie chapterów po koleji - wypowiedzi chapterów
  // wszystkie wypowiedzi na mniejsze paczki po 2000 znaków każda - MAX_BATCH_SIZE
  const batches = batchTurns(scenario.chapters.flatMap((chapter) => chapter.utterances));

  if (!batches.length) throw new Error("Empty script.");

  const names = new Map(scenario.speakers.map((s) => [s.id, s.name]));
  const pcmParts: Buffer[] = [];
  const transcript: Utterance[] = [];

  let bytes = 0;
  // dla każdej paczki 2000 / X znaków
  for (const batch of batches) {
    options.signal.throwIfAborted();

    const response = await (options.fetcher ?? fetch)(
      "https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps?output_format=pcm_24000",
      {
        method: "POST",
        signal: AbortSignal.any([options.signal, AbortSignal.timeout(180_000)]),
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": options.apiKey,
        },
        body: JSON.stringify({
          model_id: PODCAST_MODEL,
          language_code: scenario.language === "fil" ? "tl" : scenario.language,
          inputs: batch.map((utterance) => ({ 
            text: utterance.text, 
            voice_id: utterance.speakerId 
          })),
          settings: { stability: 1 },
        }),
      },
    );

    if (!response.ok) {
      await response.body?.cancel();
      throw new PodcastProviderError(response.status);
    }

    const result = timedResponseSchema.parse(await boundedJson(response));

    options.signal.throwIfAborted();

    if (!isValidBase64(result.audio_base64))
      throw new Error("Invalid base64 audio.");

    const pcm = Buffer.from(result.audio_base64, "base64");
    if (
      !pcm.length ||
      pcm.length % 2 ||
      pcm.length > MAX_BATCH_AUDIO_BYTES ||
      bytes + pcm.length > MAX_AUDIO_BYTES
    ) throw new Error("Invalid PCM data or podcast exceeds 30 minutes.");

    transcript.push(
      ...alignBatch(
        result,
        batch,
        names,
        scenario.language,
        pcm.length / (SAMPLE_RATE * 2),
        bytes / (SAMPLE_RATE * 2),
      ),
    );

    pcmParts.push(pcm);
    bytes += pcm.length;
  }

  options.signal.throwIfAborted();

  const pcm = Buffer.concat(pcmParts, bytes)
  const duration = bytes / (SAMPLE_RATE * 2)
  // tworzy szybki słownik który pozwala w O(1) znajdować czasy startu i końca wypowiedzi
  const byId = new Map(transcript.map((t) => [t.id, t]));

  const waves = 55
  const frames = pcm.length / 2;  
  const waveform = createWaveform(waves, frames, pcm)


  const chapters = scenario.chapters.map((chapter) => {

    const first = byId.get(chapter.utterances[0].id)
    const last = byId.get(chapter.utterances[chapter.utterances.length - 1].id);

    if (!first || !last || last.end === undefined)
      throw new Error("Missing chapter audio.");

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      start: first.start,
      end: last.end,
      icon: chapter.icon
    };
  });

  const podcast: Podcast = {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    duration,
    speakers: scenario.speakers,
    chapters,
    transcript,
    waveform,
  };

  return { podcast, wav: pcmToWav(pcm), providerRequests: batches.length };
}
