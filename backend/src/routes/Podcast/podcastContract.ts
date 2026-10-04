import { z } from "zod";

export const MAX_BATCH_CHARACTERS = 1000;
export const MAX_SCENARIO_CHARACTERS = 25000;

export const scenarioSchema = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().trim().min(1).max(200),
    description: z.string().max(1500),
    language: z.string().min(2).max(20),
    mode: z.enum(["monologue", "dialogue"]),
    speakers: z.array(
        z.object({
          id: z.string().min(1).max(60),
          name: z.string().trim().min(1).max(40),
          description: z.string().max(1500),
        }),
      )
      .min(1)
      .max(2),
    chapters: z.array(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().trim().min(1).max(200),
        description: z.string().max(1000),
        icon: z.string().min(1).max(100),
        utterances: z.array(
          z.object({
            id: z.string().min(1).max(100),
            speakerId: z.string().min(1).max(60),
            text: z.string().trim().min(1).max(MAX_BATCH_CHARACTERS)
              .refine(
                (t) => !/[\[\]]/.test(t),
                "Podcast script must contain spoken words, without audio tags.",
              ),
          }),
        )
        .min(1)
        .max(100),
      }),
      )
      .min(1)
      .max(8),
  })
  .superRefine((podcast, context) => {
    const turns = podcast.chapters.flatMap((c) => c.utterances);
    const ids = new Set(podcast.speakers.map((v) => v.id));

    if (
      // wywali błąd jeżeli:
      // nie odpowiednia liczba mówców dla danego trybu
      // jeżeli liczba id mówców jest większa niż długość listy mówców
      // jest więcej niż 100 wypowiedzi
      // 
      podcast.speakers.length !== (podcast.mode === "monologue" ? 1 : 2) ||
      ids.size !== podcast.speakers.length ||
      turns.length > 100 ||
      turns.reduce((n, t) => n + t.text.length, 0) > MAX_SCENARIO_CHARACTERS ||
      turns.some((t) => !ids.has(t.speakerId)) ||
      podcast.speakers.some((v) => !turns.some((t) => t.speakerId === v.id)) ||
      new Set(turns.map((t) => t.id)).size !== turns.length ||
      new Set(podcast.chapters.map((c) => c.id)).size !== podcast.chapters.length
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Invalid speakers, duplicate IDs, or scenario exceeds 100 utterances / 25000 characters.",
      });
    }
  });
