
export type VoiceSampleResponse =
  | { status: "ready"; id: string; url: string; expiresIn: number }
  | { status: "pending"; id: string; retryAfterMs: number }
  | { status: "failed"; id?: string; message: string };



function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const finish = () => {
      signal.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}



export async function getOrCreateVoiceSample(
  voiceId: string,
  languageId: string,
  options: { signal?: AbortSignal; endpoint?: string; timeoutMs?: number } = {},
): Promise<string> {
  
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);

  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(
    () =>
      controller.abort(new Error("Sample generation timed out. Try again.")),
    options.timeoutMs ?? 300_000,
  );
  try {

    while (true) {
      // POST jest get-or-create, nie wymusza ponownej generacji.
      // Powtórzenie pozwala też przejąć wygasłą blokadę po awarii backendu.
      const response = await fetch("http://localhost:8000/api/voice-samples", {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          voiceId, 
          languageId 
        }),
      });

      const body = (await response
        .json()
        .catch(() => null)) as VoiceSampleResponse | null;
        
      if (!response.ok || !body || body.status === "failed") {
        throw new Error(
          body?.status === "failed"
            ? body.message
            : `Voice sample request failed (${response.status}).`,
        );
      }
      
      if (body.status === "ready" && typeof body.url === "string")
        return body.url;

      if (body.status !== "pending")
        throw new Error("Invalid voice sample response.");
      
      const delay = Math.max(
        1000,
        Math.min(Number(body.retryAfterMs) || 2000, 5000),
      );

      await wait(delay + Math.random() * 300, controller.signal);
    }

  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
