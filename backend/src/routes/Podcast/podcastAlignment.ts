import { z } from "zod";
import type { TranscriptWord, Utterance } from "./podcastTypes.js";

const time = z.number().finite().nonnegative();

export const alignmentSchema = z.object({
  characters: z.array(z.string().min(1)).min(1),
  character_start_times_seconds: z.array(time),
  character_end_times_seconds: z.array(time),
});



export const timedResponseSchema = z.object({
  audio_base64: z.string().min(1),
  alignment: alignmentSchema.nullish(),
  normalized_alignment: alignmentSchema.nullish(),
  voice_segments: z.array(
    z.object({
      voice_id: z.string(),
      start_time_seconds: time,
      end_time_seconds: time,
      character_start_index: z.number().int().nonnegative(),
      character_end_index: z.number().int().nonnegative(),
      dialogue_input_index: z.number().int().nonnegative(),
    }),
  )
  .min(1),
});


export type TimedResponse = z.infer<typeof timedResponseSchema>;

// batch = [ [{id: "1", speakerId: "1", text: "Hello"}, {..}, {...}], [] ]

export type ScriptTurn = { 
  id: string; 
  speakerId: string; 
  text: string
};

// Keep UTF-16 offsets for JS slicing even if the provider emits Unicode codepoints
// or multiple characters per array entry. Never invent intermediate timestamps.

export function toWords(
  id: string,
  text: string,
  units: { text: string; start: number; end: number }[],
  language: string,
): TranscriptWord[] {

  let offset = 0;

  const positioned = units.map((u) => {
    const start = offset;
    offset += u.text.length;
    return { ...u, from: start, to: offset };
  });

  if (offset !== text.length)
    throw new Error("Alignment text length mismatch.");

  const locale = language === "fil" ? "fil" : language;
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });

  const words: TranscriptWord[] = [];

  for (const piece of segmenter.segment(text)) {
    if (!piece.isWordLike) continue;

    const charStart = piece.index
    const charEnd = piece.index + piece.segment.length;
    const matching = positioned.filter(
      (u) => u.from < charEnd && u.to > charStart,
    );

    if (!matching.length) throw new Error("Word has no provider timing.");
    words.push({
      id: `${id}-w${words.length}`,
      text: piece.segment,
      charStart,
      charEnd,
      start: matching[0].start,
      end: matching[matching.length - 1].end,
    });
  }

  if (!words.length) throw new Error("No spoken words in the alignment.");
  return words;
}


const comparable = (value: string) =>
  value.normalize("NFKC").replace(/\s/gu, "");



/** Use original alignment ONLY: voice_segments' character indices are paired
 * with that array. Substituting aligment differently normalized array can shift every
 * boundary after a number/abbreviation. Missing alignment is an error, not a cue
 * to distribute the duration proportionally over text.
 */
export function alignBatch(
  response: TimedResponse,
  batch: ScriptTurn[],
  names: Map<string, string>,
  language: string,
  duration: number,
  offset: number,
): Utterance[] {

  const aligment = response.alignment;

  if (!aligment)
    throw new Error("ElevenLabs returned no original character alignment.");
  const charsLen = aligment.characters.length;

  if (
    aligment.character_start_times_seconds.length !== charsLen ||
    aligment.character_end_times_seconds.length !== charsLen
  )
    throw new Error("Unequal character timing arrays.");

  for (let i = 0; i < charsLen; i++) {
    const start = aligment.character_start_times_seconds[i]
    const end = aligment.character_end_times_seconds[i]

    if (
      end < start ||
      end > duration + 0.05 ||
      (i > 0 && start < aligment.character_start_times_seconds[i - 1])
    )
      throw new Error("Invalid or non-monotonic character timestamps.");
  }

  type emptyBatch = {
    index: number;
    segment: TimedResponse["voice_segments"][number];
  }

  const groups = batch.map(() => [] as emptyBatch[]);

  const covered = new Set<number>();

  for (const segment of response.voice_segments) {
    const turn = batch[segment.dialogue_input_index];

    if (
      !turn ||
      segment.voice_id !== turn.speakerId ||
      segment.end_time_seconds < segment.start_time_seconds ||
      segment.end_time_seconds > duration + 0.05 ||
      segment.character_end_index > charsLen ||
      segment.character_end_index <= segment.character_start_index
    )
      throw new Error("Invalid voice segment or speaker/input mismatch.");


    for (let i = segment.character_start_index; i < segment.character_end_index; i++) {
      if (covered.has(i)) throw new Error("Overlapping character ranges.");
      covered.add(i);
      groups[segment.dialogue_input_index].push({ index: i, segment: segment });
    }
  }

  // Unassigned spaces are harmless; dropping spoken characters is not.
  for (let i = 0; i < charsLen; i++) {
    if (!covered.has(i) && aligment.characters[i].trim()) {
      throw new Error("Unassigned spoken characters in alignment.");
    }
  }

  // przesyłka 2000 / X znaków - rozpakowanie i analiza 
  const transcript = batch.map((turn, inputIndex) => {

    const indices = groups[inputIndex].sort((x, y) => x.index - y.index);

    if (!indices.length)
      throw new Error("Missing or truncated dialogue input.");

    const text = indices.map((object) => aligment.characters[object.index]).join("");

    if (comparable(text) !== comparable(turn.text))
      throw new Error(
        "Original alignment differs from the script; refusing fabricated timestamps.",
      );

    const units = indices.map(({ index }) => ({
      text: aligment.characters[index],
      start: offset + aligment.character_start_times_seconds[index],
      end: offset + aligment.character_end_times_seconds[index],
    }));

    const words = toWords(turn.id, text, units, language);
    const start = Math.min(...indices.map((x) => x.segment.start_time_seconds));
    const end = Math.max(...indices.map((x) => x.segment.end_time_seconds));

    if (
      words[0].start < offset + start - 0.05 ||
      words[words.length - 1].end > offset + end + 0.05
    )
      throw new Error("Word timings lie outside their voice segment.");

    const speaker = names.get(turn.speakerId);
    if (!speaker) throw new Error("Unknown speaker.");

    return {
      id: turn.id,
      speakerId: turn.speakerId,
      speaker,
      text,
      words,
      start: offset + start,
      end: offset + end,
    };
  });

  for (let i = 1; i < transcript.length; i++)
    if (transcript[i].start < transcript[i - 1].start)
      throw new Error("Dialogue input order mismatch.");

  return transcript;
}
