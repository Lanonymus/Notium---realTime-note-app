import type { Podcast, PodcastScenario } from "./podcastTypes";

export async function requestPodcastAudio(
  projectId: string,
  scenario: PodcastScenario,
  signal?: AbortSignal,
): Promise<{ podcast: Podcast; blob: Blob }> {
  
  signal?.throwIfAborted();

  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);

  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) cancel();

  const timeout = setTimeout(
    () => controller.abort(new Error("Podcast generation timed out.")),
    920000,
  );

  try {
    const response = await fetch(
      "http://localhost:8000/api/generatePodcastAudio",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId,
          scenario
        }),
        signal: controller.signal,
      },
    );
    const result = await response.json().catch(() => null);



    // TODO: tutaj nie zapisuję audio wava - dodaj do bucket storage na backendzie
    if (!response.ok || !result?.success)
      throw new Error(
        result?.message || `Podcast generation failed (${response.status}).`,
      );

      // podkast musi być wav, jego zakodowanie w base64 musi być stringiem
      // musi istnieć, musi mieć skończoną długość, musi mieć jakieś chaptery
      // musi mieć jakieś transkrypty
      // musi mieć jakąś długość transkryptu
    if (
      result.audio?.mimeType !== "audio/wav" ||
      typeof result.audio?.base64 !== "string" ||
      !result.podcast ||
      !Number.isFinite(result.podcast.duration) ||
      !Array.isArray(result.podcast.chapters) ||
      !Array.isArray(result.podcast.transcript) ||
      !result.podcast.transcript.length
    )
      throw new Error("Invalid podcast response.");
      
    // Reject missing/corrupt word timing instead of displaying guessed positions.
    for (const turn of result.podcast.transcript) {
      if (
        typeof turn.text !== "string" ||
        !Array.isArray(turn.words) ||
        !turn.words.length
      ) {
        throw new Error("Missing transcript word timestamps.")
      }

      let previousEnd = 0;
      for (const word of turn.words) {
        if (
          !Number.isFinite(word.start) ||
          !Number.isFinite(word.end) ||
          word.start < 0 ||
          word.end < word.start ||
          word.end > result.podcast.duration + 0.05 ||
          !Number.isInteger(word.charStart) ||
          !Number.isInteger(word.charEnd) ||
          word.charStart < previousEnd ||
          word.charEnd <= word.charStart ||
          word.charEnd > turn.text.length ||
          turn.text.slice(word.charStart, word.charEnd) !== word.text
        )
          throw new Error("Invalid transcript word timestamps.");
        previousEnd = word.charEnd;
      }
    }

    controller.signal.throwIfAborted();
    const binary = atob(result.audio.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: "audio/wav" });

    return {
      podcast: { ...result.podcast, audioUrl: URL.createObjectURL(blob) },
      blob,
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
