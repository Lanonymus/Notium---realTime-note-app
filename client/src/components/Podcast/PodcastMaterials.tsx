import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  FileText,
  Upload,
  Type,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Play,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ACCEPTED_FILES,
  extractResource,
  validateFile,
  type PodcastResource,
  type ResourceInput,
} from "./podcastResources";
import { motion } from "framer-motion";

type Props = {
  resources: PodcastResource[];
  onAddResources: (resources: PodcastResource[]) => void;
  onRemoveResource: (id: string) => void;
  disabled?: boolean;
};

const control =
  "rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const iconFor = { file: FileText, youtube: Play, text: Type };

export default function PodcastMaterials({
  resources,
  onAddResources,
  onRemoveResource,
  disabled = false,

}: Props) {

  const uid = useId();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "youtube" | "text">("file");
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState("");
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<PodcastResource | null>(null);
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const locked = useRef(false);

  useEffect(() => {
    return function cleanup() {
      abort.current?.abort();
      abort.current = null;
    };
  }, []);

  function close() {
    abort.current?.abort();
    abort.current = null;
    locked.current = false;
    setLoading(false);
    setReading("");
    setError("");
    setDragging(false);
    setPreview(null);
    setOpen(false);
  }


  // sprawdza plik i dodanie do files
  function addFiles(incoming: File[]) {
    if (loading || disabled) return;

    const accepted: File[] = [];
    const messages: string[] = [];

    for (const file of incoming) {
      try {
        validateFile(file);
        accepted.push(file);
      } catch (e) {
        messages.push(`${file.name}: ${(e as Error).message}`);
      }
    }

    setFiles((current) => {
      const next = [...current];
      for (const file of accepted)
        if (
          !next.some(
            (f) =>
              f.name === file.name &&
              f.size === file.size &&
              f.lastModified === file.lastModified,
          )
        )
          next.push(file);
      return next;
    });
    setError(messages.join(" "));
  }

  // dodanie do resources pliku / plików
  async function submit() {

    if (locked.current || disabled) return;

    const inputs: ResourceInput[] =
      mode === "file"
        ? files.map((file) => ({ kind: "file", file }))
        : mode === "youtube"
          ? [{ kind: "youtube", url }]
          : [{ kind: "text", title, text }];

    if (!inputs.length) return;

    locked.current = true;
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError("");

    const timeout = setTimeout(
      () => {
        controller.abort(
          new Error("Reading timed out. Try a smaller material.")
      )}, 180_000);

    let completed = 0;
    const failures: string[] = [];

    try {
      for (const input of inputs) {
        setReading(
          input.kind === "file"
            ? input.file.name
            : input.kind === "youtube"
              ? "YouTube transcript"
              : "Your text",
        );

        try {

          const resource = await extractResource(input, {
            signal: controller.signal,
          });

          if (controller.signal.aborted || abort.current !== controller) return;
          onAddResources([resource]);
          completed++;
          
          setNotice(
            `${completed} material${completed === 1 ? "" : "s"} added.`,
          );

          if (input.kind === "file")
            setFiles((current) => current.filter((f) => f !== input.file));
        } catch (e) {
          if (controller.signal.aborted) throw e;
          failures.push(
            `${input.kind === "file" ? input.file.name + ": " : ""}${e instanceof Error ? e.message : "Couldn't read this material."}`,
          );
        }
      }
      if (!failures.length) {
        setUrl("");
        setTitle("");
        setText("");
        close();
      } else setError(failures.join(" "));

    } catch (e) {
      if (abort.current === controller)
        setError(
          controller.signal.reason?.message ||
            (e instanceof Error ? e.message : "Couldn't read this material."),
        );
    } finally {
      clearTimeout(timeout);
      if (abort.current === controller) {
        abort.current = null;
        locked.current = false;
        setLoading(false);
        setReading("");
      }
    }
  }

  return (
    <section aria-labelledby={`${uid}-materials-heading`} className="mb-8 text-gray-800">
      <h2 id={`${uid}-materials-heading`} className="sr-only">Podcast materials</h2>

      <div className="flex flex-col gap-4 rounded-[9px] border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-500">
            <FileText size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <p className="text-sm font-medium text-gray-800">Your notes</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                <Check size={12} aria-hidden="true" />
                Included automatically
              </span>
            </div>
            <p id={`${uid}-materials-help`} className="mt-1 text-xs leading-relaxed text-gray-500">
              Optional: add supporting materials to complement your notes.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setPreview(null);
            setError("");
            setNotice("");
            setOpen(true);
          }}
          aria-describedby={`${uid}-materials-help`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-gray-200
           bg-white px-3 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed
            disabled:opacity-50 motion-reduce:transition-none sm:self-center focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Plus size={15} aria-hidden="true" />
          Add materials
        </button>

      </div>
      
      <p role="status" className="sr-only">
        {notice}
      </p>

      {resources.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 px-1 text-[11px] font-medium text-gray-500">
            Additional materials · {resources.length}
          </p>
          <ul
            className="flex flex-wrap gap-2"
            aria-label="Additional materials"
          >
            {resources.map((resource) => {
              const Icon = iconFor[resource.kind];
              return (
                <li
                  key={resource.id}
                  className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-white py-1 pl-2.5 pr-1"
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setPreview(resource);
                      setOpen(true);
                    }}
                    className="flex min-w-0 items-center gap-2 rounded-md text-left outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <Icon size={14} aria-hidden="true" className="shrink-0 text-gray-400" />
                    <span title={resource.name} className="min-w-0 max-w-[240px] truncate py-1 text-xs text-gray-600">
                      {resource.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Remove ${resource.name}`}
                    onClick={() => onRemoveResource(resource.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 rounded-2xl
         !border-gray-200 !border-1 bg-white p-0 text-gray-800 sm:max-w-[560px] overflow-hidden
         modernScrollbar
         ">
          <DialogHeader className="shrink-0 px-6 pb-5 pt-6 text-left ">
            <DialogTitle className="pr-8 text-xl font-semibold tracking-tight">
              {preview ? preview.name : "Add materials"}
            </DialogTitle>

            <DialogDescription className="text-[13px] leading-relaxed text-gray-500">
              {preview
                ? "This text will be included alongside your notes."
                : "Your notes are already included. Add a little more context."}
            </DialogDescription>
          </DialogHeader>
          
          {preview ? (
            <>
              <div className="min-h-0 overflow-y-auto px-6 pb-6  modernScrollbar">
                <pre
                  className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 p-4 font-sans text-sm leading-7"
                  dir="auto"
                >
                  {preview.text}
                </pre>
              </div>
              <div className="shrink-0 border-t border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className={`${control} !bg-gray-50 !rounded-[9px] cursor-pointer hover:!bg-gray-100 inline-flex h-10 items-center gap-2 px-3`}
                >
                  <ArrowLeft size={15} />
                  Add more materials
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-0 overflow-y-auto px-6 pb-6 modernScrollbar ">
                <div
                  className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-gray-50 p-1"
                  aria-label="Material type"
                >
                  {(
                    [
                      { id: "file", label: "Files", icon: FileText },
                      { id: "youtube", label: "YouTube", icon: Play },
                      { id: "text", label: "Paste text", icon: Type },
                    ] as const
                  ).map((tab) => {
                    const active = mode === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        aria-pressed={active}
                        disabled={loading}
                        onClick={() => {
                          setMode(tab.id);
                          setError("");
                        }}
                        className={`
                          relative isolate flex min-h-10 items-center justify-center
                          rounded-lg text-xs font-medium outline-none
                          focus-visible:ring-2 focus-visible:ring-blue-600
                          disabled:opacity-50 cursor-pointer
                          ${active
                            ? "text-gray-800"
                            : "text-gray-500 hover:text-gray-800"
                          }
                        `}
                      >
                        {active && (
                          <motion.span
                            layoutId="activePodcastTab"
                            aria-hidden="true"
                            className="
                              pointer-events-none absolute inset-0 z-0
                              rounded-lg bg-white shadow-sm
                            "
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}

                        <span className="relative z-10 flex items-center gap-2">
                          <Icon size={15} />
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {mode === "file" && (
                  <>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      accept={ACCEPTED_FILES}
                      className="sr-only"
                      tabIndex={-1}
                      disabled={loading || disabled}
                      onChange={(event) => {
                        addFiles(Array.from(event.target.files ?? []));
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={loading || disabled}
                      onClick={() => fileInput.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        console.log("test");
                        
                        if (!loading) setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        addFiles(Array.from(event.dataTransfer.files));
                      }}
                      className={`${control} flex w-full flex-col items-center border-2 border-dashed px-4 cursor-pointer
                         py-8 ${dragging ? "!border-blue-600 !bg-blue-50" : "bg-gray-50/50 hover:bg-gray-50"}`}
                    >
                      <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-blue-600">
                        <Upload size={21} />
                      </span>
                      <span className="text-sm font-medium">
                        Drop your files here
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        or{" "}
                        <span className="font-medium text-blue-600">
                          browse files
                        </span>
                      </span>
                      <span className="mt-4 text-[11px] text-gray-500">
                        PDF, TXT or audio · Up to 20 MB per file
                      </span>
                    </button>
                    {files.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {files.map((file, index) => (
                          <li
                            key={`${file.name}-${file.lastModified}-${file.size}`}
                            className="flex items-center gap-2 rounded-[9px] border border-gray-200 px-3 py-2 text-xs"
                          >
                            <FileText
                              size={16}
                              className="shrink-0 text-gray-400"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {file.name}
                            </span>
                            <span className="shrink-0 text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${file.name} from upload`}
                              disabled={loading}
                              onClick={() =>
                                setFiles((current) =>
                                  current.filter((_, i) => i !== index),
                                )
                              }
                              className={`${control} grid h-8 w-8 place-items-center !border-0 hover:bg-gray-50`}
                            >
                              <X size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {mode === "youtube" && (
                  <div>
                    <label
                      htmlFor={`${uid}-url`}
                      className="mb-2 block text-sm font-medium"
                    >
                      YouTube link
                    </label>
                    <input
                      id={`${uid}-url`}
                      type="url"
                      value={url}
                      disabled={loading}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className={`${control} !rounded-[9px] h-11 w-full bg-gray-50 px-3 text-sm`}
                    />
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      We’ll use the video’s available transcript. Some videos
                      may not have one.
                    </p>
                  </div>
                )}
                {mode === "text" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor={`${uid}-title`}
                        className="mb-2 flex justify-between text-sm font-medium"
                      >
                        Title
                        <span className="text-xs font-normal text-gray-400">
                          Optional
                        </span>
                      </label>
                      <input
                        id={`${uid}-title`}
                        value={title}
                        maxLength={120}
                        disabled={loading}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="e.g. Chapter 3 — Memory"
                        className={`${control} !rounded-[9px] h-11 w-full bg-gray-50 px-3`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`${uid}-text`}
                        className="mb-2 block text-sm font-medium"
                      >
                        Your text
                      </label>
                      <textarea
                        id={`${uid}-text`}
                        value={text}
                        disabled={loading}
                        maxLength={200000}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="Paste an explanation, an article excerpt or anything worth including…"
                        className={`${control} !rounded-[9px] min-h-44 w-full resize-y bg-gray-50 p-3 leading-relaxed modernScrollbar`}
                      />
                      <p className="mt-1 text-right text-[11px] text-gray-400">
                        {text.length.toLocaleString()} / 200,000
                      </p>
                    </div>
                  </div>
                )}
                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
                  >
                    {error}
                  </p>
                )}
                {loading && (
                  <p
                    role="status"
                    className="mt-4 flex items-center gap-2 text-xs text-gray-500"
                  >
                    <Loader2
                      size={15}
                      className="shrink-0 animate-spin motion-reduce:animate-none"
                    />
                    <span className="truncate">Reading {reading}…</span>
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-gray-50 border-gray-200 px-6 py-4">
                <button
                  type="button"
                  onClick={close}
                  className={`h-10 !border-0 px-3 text-gray-800 rounded-[12px] bg-gray-100 hover:bg-gray-200 cursor-pointer`}
                >
                  {loading ? "Stop & close" : "Cancel"}
                </button>

                <button
                  type="button"
                  disabled={
                    disabled ||
                    loading ||
                    (mode === "file"
                      ? !files.length
                      : mode === "youtube"
                        ? !url.trim()
                        : !text.trim())
                  }
                  onClick={() => void submit()}
                  className={`${control} inline-flex h-10 items-center justify-center gap-2 !border-blue-600
                     !bg-blue-600 px-4 font-medium !text-white hover:!bg-blue-700 cursor-pointer`}
                >
                  {loading ? (
                    <Loader2
                      size={15}
                      className="animate-spin motion-reduce:animate-none"
                    />
                  ) : (
                    <Plus size={15} />
                  )}
                  {loading
                    ? "Reading materials…"
                    : mode === "file" && files.length > 1
                      ? `Add ${files.length} materials`
                      : "Add material"}
                </button>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
