

export type PodcastResource = {
  id: string;
  name: string;
  kind: "file" | "youtube" | "text";
  text: string;
  createdAt: string;
  originalUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type ResourceInput =
  | { kind: "file"; file: File }
  | { kind: "youtube"; url: string }
  | { kind: "text"; title: string; text: string };

export const ACCEPTED_FILES = ".pdf,.txt,.mp3,.wav,.m4a,.ogg,.aac,.flac";
// Ograniczenie UX. Backend nadal powinien stosować własny limit Multer.
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function validateFile(file: File) {
  if (!/\.(pdf|txt|mp3|wav|m4a|ogg|aac|flac)$/i.test(file.name)) {
    throw new Error("Choose a PDF, TXT or supported audio file.");
  }
  if (!file.size) throw new Error("This file is empty.");
  if (file.size > MAX_FILE_BYTES)
    throw new Error("Choose a file smaller than 20 MB.");
}

export function youtubeUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Paste a valid YouTube video link.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("Paste a valid YouTube video link.");

  const host = url.hostname.toLowerCase();

  let id: string | null = null;

  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];

  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else
      id =
        url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1] ??
        null;
  }

  if (!id || !/^[\w-]{11}$/.test(id))
    throw new Error("Paste a link to a specific YouTube video.");

  return `https://www.youtube.com/watch?v=${id}`;
}

export async function extractResource(
  input: ResourceInput,
  options: { signal?: AbortSignal } = {},

): Promise<PodcastResource> {
  const form = new FormData();

  let metadata: Omit<PodcastResource, "id" | "text" | "createdAt">;
  
  if (input.kind === "file") {
    validateFile(input.file);
    form.append("files", input.file);
    metadata = {
      kind: "file",
      name: input.file.name,
      fileName: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
    };
  } else if (input.kind === "youtube") {
    const url = youtubeUrl(input.url);
    form.append("youtubeUrl", url);
    metadata = {
      kind: "youtube",
      name: "YouTube · " + new URL(url).searchParams.get("v"),
      originalUrl: url,
    };
  } else {
    const text = input.text.trim();
    if (!text) throw new Error("Paste some text first.");
    // Endpoint nie dodaje req.body.prompt do extractedText. Korzystamy z jego obsługi TXT.
    form.append(
      "files",
      new File([text], "pasted-text.txt", { type: "text/plain" }),
    );
    metadata = { kind: "text", name: input.title.trim() || "Pasted text" };
  }

  const response = await fetch("http://localhost:8000/api/dataToText", {
    method: "POST",
    credentials: "include",
    body: form,
    signal: options.signal,
  });

  // Nie ustawiaj Content-Type: przeglądarka dodaje boundary dla multipart/form-data.
  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    extractedText?: string;
    error?: string;
  } | null;

  if (!response.ok || data?.success !== true)
    throw new Error(
      data?.error || `Couldn't read this material (HTTP ${response.status}).`,
    );

  if (typeof data.extractedText !== "string" || !data.extractedText.trim()) {
    throw new Error(
      "No readable text found. For scanned PDFs, paste the text instead.",
    );
  }

  return {
    ...metadata,
    id: crypto.randomUUID(),
    text: data.extractedText.trim(),
    createdAt: new Date().toISOString(),
  };
}
