import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  Search,
  Upload,
  ClipboardPaste,
  Play,
  ChevronDown,
  Image,
  FileText,
  Headphones,
  X,
  LoaderCircle,
  Check,
  CircleAlert,
  Paperclip,
  Plus,
  NotebookPen,
  Mic,
  Pause,
  SquarePause,
} from "lucide-react";
import AllowedDataTypes from "./AllowedDataTypes";
import { Modal } from "./DashboardWidgets";
import { getYoutubeId, type useDashboardData } from "./useDashboardData";


import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



export default function ProjectComposer({
  data,
  onCreateBlank,
}: {
  data: ReturnType<typeof useDashboardData>;
  onCreateBlank?: () => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<"paste" | "youtube" | "recordAudio" | null>(null);
  const [draft, setDraft] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [recordingState, setRecordingState] = useState<
    "idle" | "requesting" | "recording" | "stopping"
  >("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const microphoneStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingStartedAt = useRef(0);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveRecording = useRef(false);
  const microphoneRequest = useRef(0);
  const waveformCanvas = useRef<HTMLCanvasElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const waveformAnimationFrame = useRef<number | null>(null);
  const waveformLevels = useRef<number[]>([]);

  const isRecording = recordingState === "recording";
  const isChangingRecordingState =
    recordingState === "requesting" || recordingState === "stopping";


  function clearRecordingTimer() {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  }


  function releaseMicrophone() {
    microphoneStream.current?.getTracks().forEach((track) => track.stop());
    microphoneStream.current = null;
  }

  
  function stopAudioVisualizer() {
    if (waveformAnimationFrame.current !== null) {
      cancelAnimationFrame(waveformAnimationFrame.current);
      waveformAnimationFrame.current = null;
    }

    audioAnalyser.current?.disconnect();
    audioAnalyser.current = null;

    const context = audioContext.current;
    audioContext.current = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }

    waveformLevels.current = [];
    const canvas = waveformCanvas.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }



  function startAudioVisualizer(stream: MediaStream) {
    stopAudioVisualizer();

    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.1;
      analyser.minDecibels = -80;
      analyser.maxDecibels = -15;
      source.connect(analyser);

      audioContext.current = context;
      audioAnalyser.current = analyser;
      if (context.state === "suspended") {
        void context.resume().catch(() => undefined);
      }

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 43;
      waveformLevels.current = Array.from({ length: barCount }, () => 0);

      const drawWaveform = () => {
        const canvas = waveformCanvas.current;
        const currentAnalyser = audioAnalyser.current;
        if (!canvas || !currentAnalyser) return;

        const drawingContext = canvas.getContext("2d");
        if (!drawingContext) return;

        currentAnalyser.getByteFrequencyData(frequencyData);
        drawingContext.clearRect(0, 0, canvas.width, canvas.height);
        drawingContext.strokeStyle = "#1e2939";
        drawingContext.lineCap = "round";

        const centerY = canvas.height / 2;
        const step = canvas.width / (barCount + 2);
        const middle = (barCount - 1) / 2;
        drawingContext.lineWidth = Math.max(5, step * 0.42);

        for (let index = 0; index < barCount; index += 1) {
          // Mirrored frequency bins create the familiar, centred waveform shape.
          const distanceFromMiddle = Math.abs(index - middle);
          const frequencyIndex = Math.min(
            frequencyData.length - 1,
            1 + Math.floor(
              (distanceFromMiddle / middle) *
                (frequencyData.length - 2) *
                0.55,
            ),
          );
          const rawLevel = frequencyData[frequencyIndex] / 255;
          const audibleLevel = Math.max(0, (rawLevel - 0.055) / 0.945);
          const centreEmphasis = 1 - (distanceFromMiddle / middle) * 0.42;
          const targetHeight =
            7 + Math.pow(audibleLevel, 0.72) * (canvas.height * 0.72) * centreEmphasis;
          const previousHeight = waveformLevels.current[index] ?? 7;
          const height = previousHeight * 0.68 + targetHeight * 0.32;
          waveformLevels.current[index] = height;

          const x = step * (index + 1.5);
          drawingContext.beginPath();
          drawingContext.moveTo(x, centerY - height / 2);
          drawingContext.lineTo(x, centerY + height / 2);
          drawingContext.stroke();
        }

        waveformAnimationFrame.current = requestAnimationFrame(drawWaveform);
      };

      drawWaveform();
    } catch {
      // Recording can continue even if the browser cannot render a visualizer.
      stopAudioVisualizer();
    }
  }


  function recordingErrorMessage(error: unknown) {
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError")
        return "Microphone access was denied. Allow it in your browser settings and try again.";
      if (error.name === "NotFoundError")
        return "No microphone was found. Connect one and try again.";
      if (error.name === "NotReadableError")
        return "Your microphone is being used by another application.";
    }
    return "Couldn't start the recording. Check your microphone and try again.";
  }

  function audioExtension(mimeType: string) {
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("ogg")) return "ogg";
    return "webm";
  }

  async function startRecording() {
    if (recordingState !== "idle") return;

    setDialogError("");
    setRecordingState("requesting");
    const requestId = ++microphoneRequest.current;

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new Error("Audio recording is not supported in this browser.");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // The modal may have been closed while the browser permission prompt was open.
      if (requestId !== microphoneRequest.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      microphoneStream.current = stream;

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      mediaRecorder.current = recorder;
      audioChunks.current = [];
      saveRecording.current = false;
      startAudioVisualizer(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      recorder.onerror = () => {
        saveRecording.current = false;
        clearRecordingTimer();
        stopAudioVisualizer();
        releaseMicrophone();
        mediaRecorder.current = null;
        audioChunks.current = [];
        setRecordingState("idle");
        setRecordingSeconds(0);
        setDialogError("The recording was interrupted. Please try again.");
      };

      recorder.onstop = () => {
        const shouldSave = saveRecording.current;
        const recordedMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(audioChunks.current, { type: recordedMimeType });

        clearRecordingTimer();
        stopAudioVisualizer();
        releaseMicrophone();
        mediaRecorder.current = null;
        audioChunks.current = [];
        saveRecording.current = false;
        setRecordingState("idle");
        setRecordingSeconds(0);

        if (!shouldSave) return;
        if (!blob.size) {
          setDialogError("The recording is empty. Please try again.");
          return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const file = new File(
          [blob],
          `recording-${timestamp}.${audioExtension(recordedMimeType)}`,
          { type: recordedMimeType, lastModified: Date.now() },
        );

        void data.addFiles([file]);
        setDialog(null);
        input.current?.focus();
      };

      recorder.start(250);
      recordingStartedAt.current = Date.now();
      setRecordingSeconds(0);
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(
          Math.floor((Date.now() - recordingStartedAt.current) / 1000),
        );
      }, 250);
      setRecordingState("recording");
    } catch (error) {
      if (requestId !== microphoneRequest.current) return;
      stopAudioVisualizer();
      releaseMicrophone();
      setRecordingState("idle");
      setDialogError(
        error instanceof Error && error.message.includes("not supported")
          ? error.message
          : recordingErrorMessage(error),
      );
    }
  }

  function stopRecording(shouldSave: boolean) {
    clearRecordingTimer();
    saveRecording.current = shouldSave;

    const recorder = mediaRecorder.current;
    if (recorder?.state === "recording" || recorder?.state === "paused") {
      if (shouldSave) setRecordingState("stopping");
      recorder.stop();
      return;
    }

    releaseMicrophone();
    stopAudioVisualizer();
    mediaRecorder.current = null;
    audioChunks.current = [];
    setRecordingState("idle");
    setRecordingSeconds(0);
  }

  function closeDialog() {
    // Invalidates a getUserMedia request that may still be waiting for permission.
    microphoneRequest.current += 1;
    stopRecording(false);
    setDialogError("");
    setDialog(null);
  }

  function formatRecordingTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  useEffect(() => {
    return () => {
      microphoneRequest.current += 1;
      clearRecordingTimer();
      stopAudioVisualizer();
      const recorder = mediaRecorder.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      releaseMicrophone();
    };
  }, []);


  function pick(accept: string) {
    if (!picker.current) return;
    picker.current.accept = accept;
    picker.current.click();
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!data.creating)
      void data.addFiles(Array.from(event.dataTransfer.files));
  }

  function openDialog(mode: "paste" | "youtube" | "recordAudio") {
    setDraft("");
    setDialogError("");
    setRecordingSeconds(0);
    setDialog(mode);
  }
  
  

  const addCompletedActivity = async ({
    attemptId,
    activityType,
    projectId,
    resourceId,
    correctAnswers,
    totalQuestions,
  }: {
    attemptId: string;
    activityType: "notes" | "quiz" | "flashcards" | "podcast";
    projectId?: string;
    resourceId?: string;
    correctAnswers?: number;
    totalQuestions?: number;
  }) => {
    const response = await fetch(
      "http://localhost:8000/api/activity/complete",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attemptId,
          activityType,
          projectId,
          resourceId,
          correctAnswers,
          totalQuestions,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Could not register completed activity");
    }

    return response.json();
  };


  function submitPrompt() {
    if (getYoutubeId(data.prompt)) {

      data.addYoutube(data.prompt);
      data.setPrompt("");
    } else {
      data.createProject()
    } 
  }

  function addDraft(event: FormEvent) {
    event.preventDefault();

    if (!draft.trim()) return;

    if (dialog === "youtube") {
      if (!getYoutubeId(draft)) {
        setDialogError("Enter a valid YouTube video link.");
        return;
      }
      data.addYoutube(draft);
    } else {
      data.setPrompt(
        data.prompt ? `${data.prompt}\n\n${draft.trim()}` : draft.trim(),
      );
    }
    setDialog(null);
    input.current?.focus();
  }
  return (
    <section
      style={{ animationDelay: `${0.2}s`}}
      className="nh-composer min-w-0 pt-[70px] [&_h1]:text-[clamp(27px,2.45vw,40px)]
       [&_h1]:leading-[1.2] [&_h1]:font-[720] [&_h1]:tracking-[-1.4px] [&_h1]:text-[#292929]
        @max-[1250px]/home:pt-[50px] @max-[1250px]/home:[&_h1]:text-[29px] @max-[1250px]/home:[&_h1]:tracking-[-1px]
         @max-[1050px]/home:col-span-full @max-[1050px]/home:row-start-1 @max-[1050px]/home:mx-auto @max-[1050px]/home:mb-[18px]
          @max-[1050px]/home:w-full @max-[1050px]/home:max-w-[680px] @max-[1050px]/home:pt-[30px] @max-[1050px]/home:[&_h1]:text-[36px]
           @max-[720px]/home:order-0 @max-[720px]/home:mx-0 @max-[720px]/home:mb-[5px] @max-[720px]/home:pt-[10px]
            @max-[720px]/home:[&_h1]:mx-auto @max-[720px]/home:[&_h1]:max-w-[390px] @max-[720px]/home:[&_h1]:text-[30px] animate-face-down"
      aria-labelledby="nh-composer-title "
    >

      <div className="flex flex-col justify-center items-center">
        {/* <img 
          src="/doodles/doodle_1.png" 
          alt="cool blob" 
          style={{ animationDelay: `${0.5}s`}}
          className="w-[130px] h-auto mb-5 animate-rotate"
        /> */}

        <div className="aspect-square w-[130px] mb-5 overflow-hidden rounded-[16px] bg-[#ff5a16]">
          <video
            src="/Animations/blinking.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full scale-[1.05] object-cover"
          />
        </div>

        <div className="nh-composer-heading mb-[37px] text-center [&>p]:mt-3 [&>p]:text-[clamp(16px,1.25vw,20px)] [&>p]:font-[450]
         [&>p]:text-[#858585] @max-[1250px]/home:[&>p]:text-[15px] @max-[1050px]/home:mb-[25px] @max-[720px]/home:[&>p]:mt-[10px]">
          <h1 id="nh-composer-title">What do you want to learn?</h1>
          <p>Turn your curiosity into progress</p>
        </div>
      </div>


      {/* Główny input dashboardu */}
      <div
        className={`nh-input-panel relative rounded-[34px] border-2 border-[#e5e5e5] bg-white transition-colors duration-200 overflow-hidden 
           focus-within:border-blue-600 group focus-within:bg-blue-50 [&.is-dragging]:border-[#456dff] ${dragging ? "is-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (event.dataTransfer.types.includes("Files")) {
            dragDepth.current++;
            setDragging(true);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDragging(false);
        }}
        onDrop={drop}
      >
        {dragging && (
          <div className="nh-drop-overlay pointer-events-none absolute -inset-[2px] z-[2] flex items-center justify-center gap-[10px] rounded-[inherit] border-2 border-dashed border-[#456dff] bg-[#f0f3ffed]">
            <Upload size={24} />
            <span>Drop your files here</span>
          </div>
        )}

        {data.sources.length > 0 && (
          <ul
            className="nh-attachments m-0 flex max-h-[200px] list-none flex-wrap gap-[10px] overflow-auto px-4 pt-[15px] pb-[2px]
              [&::-webkit-scrollbar]:w-[5px]
              [&::-webkit-scrollbar]:h-[5px]
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              [&::-webkit-scrollbar-thumb]:rounded-[4px] "
            aria-label="Attached sources"
          >
            {data.sources.map((source) => (
              <li
                key={source.id}
                className={`nh-attachment flex max-w-full items-center  group-focus-within:border-gray-200 border-1 border-transparent
                  gap-[10px] rounded-[10px] bg-gray-100 px-2 py-[7px] text-[12px] font-[450] text-gray-800 [&.has-error]:border-[#e7b7b7]
                  [&.has-error]:bg-[#fff5f5]
                  [&.has-error]:text-[#a83636] [&_small]:block [&_small]:font-[400] [&_small]:text-[10px] [&_small]:text-gray-500 [&>svg]:shrink-0
                  [&>button]:grid [&>button]:place-items-center [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-1
                  [&>button]:text-inherit ${source.status === "error" ? "has-error" : ""}`}
              >
                {source.status === "extracting" ? (
                  <LoaderCircle
                    className="nh-spin motion-safe:animate-spin"
                    size={14}
                  />
                ) : source.status === "error" ? (
                  <CircleAlert size={14} />
                ) : (
                  <Check size={14} />
                )}
                <span
                  className="nh-attachment-name min-w-0 [overflow-wrap:anywhere]"
                  title={source.name}
                >
                  {source.name}
                  <small>
                    {source.status === "extracting"
                      ? source.progress < 100 && source.type !== "youtube"
                        ? `Uploading ${source.progress}%`
                        : "Extracting content…"
                      : source.status === "error"
                        ? source.error
                        : "Ready"}
                  </small>
                </span>

                <button
                  type="button"
                  disabled={data.creating}
                  onClick={() => data.removeSource(source.id)}
                  aria-label={`Remove ${source.name}`}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="nh-prompt flex min-h-[68px] items-end gap-[3px] pl-3 p-2 [&>svg]:shrink-0
           [&_textarea]:block [&_textarea]:max-h-40 [&_textarea]:min-h-[38px] [&_textarea]:min-w-0 [&_textarea]:flex-1
            [&_textarea]:resize-none [&_textarea]:border-0 [&_textarea]:bg-transparent [&_textarea]:px-0 [&_textarea]:py-[7px]
             [&_textarea]:text-[17px] [&_textarea]:leading-6 [&_textarea]:text-[#222] [&_textarea]:outline-none!
              [&_textarea::placeholder]:text-[#9b9b9b] [&_textarea::placeholder]:opacity-100 @max-[1250px]/home:min-h-[60px]
               @max-[1250px]/home:gap-2 @max-[1250px]/home:pl-[14px] @max-[1250px]/home:[&_textarea]:text-[14px] @max-[720px]/home:p-[6px]
                @max-[720px]/home:pl-[13px] @max-[720px]/home:[&>svg]:w-[18px]"
          onSubmit={(event) => {
            event.preventDefault();
            submitPrompt();
          }}
        >

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="mb-[6px] p-[8px] flex justify-center items-center rounded-full
               hover:bg-gray-100 transition-all duration-150">
                <Plus size={23} aria-hidden="true" className="text-gray-700"/>
              </button>
            }/>
            <DropdownMenuContent 
              align="start" 
              alignOffset={0} 
              className="!border-1 !p-[4px]  border-gray-200 w-[170px] [&_svg]:text-gray-700"
            >

              <DropdownMenuGroup className="!p-0 ">
                <DropdownMenuItem 
                    onClick={() => pick("application/pdf")}
                    className="mb-[4px] !py-[7px] flex justify-between items-center"
                  >
                  <span>PDF</span>
                  <img src="/images/pdf.png" alt="" className="w-[20px]" /> 
                </DropdownMenuItem>
                <DropdownMenuSeparator className="h-[2px] bg-gray-200 !py-0 !my-0"/>
                <DropdownMenuItem 
                    onClick={() => openDialog("youtube")}
                    className="mb-[4px] mt-[4px] !py-[7px] flex justify-between items-center"
                  >
                  <span>Youtube</span>
                  <img src="/images/youtube.png" alt="" className="w-[20px]" /> 
                </DropdownMenuItem>                
                <DropdownMenuSeparator className="h-[2px] bg-gray-200 !py-0 !my-0"/>    
                <DropdownMenuItem 
                    onClick={() => openDialog("paste")}
                    className="mb-[4px] mt-[4px] !py-[7px] flex justify-between items-center"
                  >
                  <span>Notes</span>
                  <NotebookPen />
                </DropdownMenuItem>                                 
                <DropdownMenuSeparator className="h-[2px] bg-gray-200 !py-0 !my-0"/>     
                <DropdownMenuItem 
                    onClick={() => pick("image/*")}
                    className="mb-[4px] mt-[4px] !py-[7px] flex justify-between items-center"
                  >
                  <span>Image</span>
                  <Image />
                </DropdownMenuItem>                          
                <DropdownMenuSeparator className="h-[2px] bg-gray-200 !py-0 !my-0"/>            
                <DropdownMenuItem 
                    onClick={() => openDialog("recordAudio")}
                    className="mb-[4px] mt-[4px] !py-[7px] flex justify-between items-center"
                  >
                  <span>Record audio</span>
                  <Mic />
                </DropdownMenuItem>                   
                <DropdownMenuSeparator className="h-[2px] bg-gray-200 !py-0 !my-0"/>       
                <DropdownMenuItem 
                    onClick={() => pick("audio/*")}
                    className="mb-[4px] mt-[4px] !py-[7px] flex justify-between items-center"
                  >
                  <span>Upload audio</span>
                  <Headphones />
                </DropdownMenuItem>                                                   
              </DropdownMenuGroup>
            </DropdownMenuContent>

          </DropdownMenu>          

          <textarea
            ref={input}
            aria-label="What do you want to learn?"
            placeholder="What do you want to learn?"
            className="mb-[6px] 
                  [&::-webkit-scrollbar]:w-[5px]
                  [&::-webkit-scrollbar]:h-[5px]
                  [&::-webkit-scrollbar-track]:transparent
                  [&::-webkit-scrollbar-thumb]:transparent
                  [&::-webkit-scrollbar-thumb]:rounded-[4px]                  
            "
            rows={1}
            value={data.prompt}
            disabled={data.creating}
            onChange={(event) => {
              data.setPrompt(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (getYoutubeId(text)) {
                event.preventDefault();
                data.addYoutube(text);
              }
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submitPrompt();
              }
            }}
          />
          <button
            type="submit"
            className="nh-ask grid min-h-12 min-w-20 shrink-0 place-items-center rounded-full border-0 bg-[#456dff] px-[18px] py-[9px] text-[16px] font-[550] text-white disabled:bg-[#f2f2f2] disabled:text-[#b9b9b9] disabled:opacity-100! enabled:hover:bg-[#3957ed] @max-[1250px]/home:min-h-[42px] @max-[1250px]/home:min-w-[59px] @max-[1250px]/home:px-3 @max-[1250px]/home:text-[14px] @max-[720px]/home:min-h-[43px] @max-[720px]/home:min-w-[58px]"
            disabled={!data.canCreate}
            aria-label={
              data.creating ? "Creating your project" : "Create project"
            }
          >
            {data.creating ? (
              <LoaderCircle
                size={20}
                className="nh-spin motion-safe:animate-spin"
              />
            ) : (
              "Ask"
            )}
          </button>
        </form>
      </div>



      {data.error && (
        <p
          role="alert"
          className="nh-error mt-[10px]! text-[13px] text-[#b23636]"
        >
          {data.error}
        </p>
      )}
      {data.creating && (
        <p
          className="nh-status mt-[10px]! text-[13px] text-[#666]"
          role="status"
        >
          Creating your learning materials…
        </p>
      )}
      <div className="nh-source-actions mt-[17px] grid grid-cols-4 gap-[9px] @max-[1250px]/home:gap-[6px] @max-[720px]/home:mt-[13px]
       @max-[720px]/home:grid-cols-2 @max-[720px]/home:gap-[9px]">
        <AllowedDataTypes
          icon={<Upload size={20} />}
          label="Upload"
          disabled={data.creating}
          onClick={() =>
            pick(".pdf,.txt,.csv,.doc,.docx,image/*,audio/*,video/*")
          }
        />
        <AllowedDataTypes
          icon={<ClipboardPaste size={20} />}
          label="Paste"
          disabled={data.creating}
          onClick={() => openDialog("paste")}
        />
        <AllowedDataTypes
          icon={<Play size={22} />}
          label="YouTube"
          disabled={data.creating}
          onClick={() => openDialog("youtube")}
        />

        <details className="nh-menu relative open:z-10 nh-more-menu">

          <summary className="nh-source-button flex min-h-[43px] w-full items-center justify-center gap-[9px] rounded-full border-2
          border-[#e5e5e5] bg-white px-[9px] py-[10px] text-[13px] font-semibold whitespace-nowrap
            text-[#222] transition-colors duration-150 hover:bg-[#f8f8f8] active:translate-y-[3px] [&>svg]:shrink-0
             @max-[1250px]/home:gap-[5px] @max-[1250px]/home:px-[5px] @max-[1250px]/home:text-[11px] @max-[1250px]/home:[&>svg]:w-[17px]
              @max-[1050px]/home:gap-[9px] @max-[1050px]/home:text-[14px] @max-[720px]/home:text-[13px]
               shadow-[0px_2px_0px_#e5e5e5] active:shadow-none">
            <ChevronDown size={20} />
            <span>More</span>
          </summary>

          <div
            className="nh-menu-content absolute top-[calc(100%+8px)] right-0 z-10 min-w-[185px] max-w-[calc(100vw-32px)]
             rounded-xl border-2 border-gray-200 bg-white p-[0px] shadow-[0_8px_26px_#00000012] [&>button]:flex [&>button]:w-full
              [&>button]:items-center [&>button]:gap-[10px] [&>button]:rounded-[3px] [&>button]:border-0 [&>button]:bg-transparent
               [&>button]:px-[13px] [&>button]:py-[16px] [&>button]:text-left [&>button]:text-[13px] [&>button]:font-[600]
                [&>button]:text-gray-800 [&>button:hover]:bg-gray-100 overflow-hidden"
            onClick={(event) =>
              event.currentTarget.closest("details")?.removeAttribute("open")
            }
          >
            <button
              type="button"
              disabled={data.creating}
              onClick={() => pick("image/*")}
            >
              <Image size={17} />
              Upload image
            </button>

            <div className="w-full h-[2px] bg-gray-200"/>

            <button
              type="button"
              disabled={data.creating}
              onClick={() => pick("application/pdf")}
            >
              <FileText size={17} />
              Upload PDF
            </button>

            <div className="w-full h-[2px] bg-gray-200"/>

            <button
              type="button"
              disabled={data.creating}
              onClick={() => pick("audio/*")}
            >
              <Headphones size={17} />
              Upload audio
            </button>
            {onCreateBlank && (
              <button
                type="button"
                disabled={data.creating}
                onClick={onCreateBlank}
              >
                <Paperclip size={17} />
                Blank document
              </button>
            )}
          </div>
        </details>

      </div>
      <input
        ref={picker}
        type="file"
        multiple
        hidden
        aria-label="Choose source files"
        onChange={(event) => {
          void data.addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <Modal
        open={dialog !== null}
        title={
          dialog === "youtube" ? "Learn from a video" : dialog === "paste" ? "Paste text" : "Record audio"
        }
        onClose={closeDialog}
        type={dialog}
      >
        <form
          onSubmit={addDraft}
          className="nh-source-form flex flex-col gap-[14px] [&_label]:text-[14px] [&_label]:text-[#666] [&_textarea]:min-h-[70px]
           [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border-2 [&_textarea]:border-[#e5e5e5]
            [&_textarea]:bg-white [&_textarea]:p-[13px] [&_textarea]:text-[14px] [&_textarea]:text-[#222] "
        >
          <label htmlFor="nh-source-draft" className={`${dialog === "recordAudio" ? "" : ""}`}>
            {dialog === "youtube" && "YouTube video link"}
            {dialog === "paste" && "Notes, text, or a topic"}
            {dialog === "recordAudio" && "Start recording by pressing the button"}                        
          </label>

          {dialog === "youtube" || dialog === "paste" ? (
            <textarea
              id="nh-source-draft"
              autoFocus
              rows={dialog === "youtube" ? 2 : 7}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                dialog === "youtube"
                  ? "https://www.youtube.com/watch?v=…"
                  : "Paste your material here…"
              }
            />
          ) : (
            <div className="w-full h-[220px] flex justify-start items-center flex-col">
                <div className={`bg-gray-100 rounded-full p-5 flex justify-center items-center mt-5 
                ${isRecording ? "bg-red-100" : ""}`}>
                  <Mic size={38} className={`${isRecording ? "text-red-700" : "text-gray-800"}`}/>
                </div>

                <canvas
                  ref={waveformCanvas}
                  width={760}
                  height={112}
                  role="img"
                  aria-label="Live microphone activity"
                  className={`mt-3 h-[56px] w-full max-w-[380px] transition-opacity duration-200 ${
                    isRecording || recordingState === "stopping"
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />

                {(isRecording || recordingState === "stopping") && (
                  <div className="mt-2 font-[600] text-[20px] tabular-nums">
                    {formatRecordingTime(recordingSeconds)}
                  </div>
                )}      

            </div>
          )}



          {dialogError && (
            <p
              className="nh-error mt-[10px]! text-[13px] text-[#b23636]"
              role="alert"
            >
              {dialogError}
            </p>
          )}

          <button
            className={`nh-primary flex min-h-12 w-full items-center justify-center rounded-full
              px-4 py-[9px] font-[650] duration-150 active:translate-y-[2px] mt-1 
               ${isRecording ? "border-2 border-gray-200 bg-white enabled:hover:bg-gray-50 text-gray-800" :
                "border-gray-800 bg-gray-800/92 enabled:hover:bg-gray-800/90 transition-[background,transform] active:border-none border-b-4 border-0 text-white"}`}
            disabled={
              dialog === "recordAudio"
                ? isChangingRecordingState
                : !draft.trim()
            }
            onClick={() => {
              if (dialog !== "recordAudio") return;
              if (isRecording) stopRecording(true);
              else void startRecording();
            }}
            type={dialog === "recordAudio" ? "button" : "submit"}
          >

            {dialog === "youtube" ? (
              "Add video"
            ) : dialog === "paste" ? (
              "Use this text"
            ) : recordingState === "requesting" ? (
              <div className="flex items-center gap-2">
                <LoaderCircle className="motion-safe:animate-spin" />
                Waiting for microphone…
              </div>
            ) : recordingState === "stopping" ? (
              <div className="flex items-center gap-2">
                <LoaderCircle className="motion-safe:animate-spin" />
                Saving recording…
              </div>
            ) : !isRecording ? (
              "Start recording"
            ) : (
              <div className="flex gap-2">
                <SquarePause className="text-gray-800" />
                Stop recording
              </div>
            )}
          </button>

        </form>
      </Modal>
    </section>
  );
}
