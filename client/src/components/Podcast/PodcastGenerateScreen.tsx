import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Headphones,
  Languages,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Flag from "./Flag";
import { getOrCreateVoiceSample } from "./getOrCreateVoiceSample";
import { EXAMPLE_VOICES, PodcastVoice, VOICE_CATALOG, VOICE_DIRECTIONS, VOICE_TAGS } from "./podcastVoices";
import { EXAMPLE_LANGUAGES } from "./podcastLanguages";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// @ts-ignore
import "flag-icons/css/flag-icons.min.css";
import { PodcastResource } from "./podcastResources";
import PodcastMaterials from "./PodcastMaterials";
import { onGenerate as generateScenario, buildPodcast, extractFiles } from "./HelperFunctions";
import type { Podcast, PodcastScenario } from "./podcastTypes";
import { useParams } from "react-router-dom";
import VoiceAvatar from "./VoiceAvatar";
import DifficultyProgressBar from "./PodcastProgressBar";
import PodcastProgressBar from "./PodcastProgressBar";
import CreatingScreen from "../CreatingScreen";



export type PodcastLanguage = { 
  id: string; 
  label: string; 
  flag: string 
};

export type PodcastSource = PodcastResource

export type PodcastGenerationSettings = {
  /** Notes are the default source; sourceIds contains additional materials only. */
  includeNotes: true;
  sourceIds: string[];
  languageId: string;
  speakerIds: string[];
  length: "short" | "long";
  level: "beginner" | "intermediate" | "advanced" | "expert";
  additionalInstructions: string;
};

type GenerationState = "none" | "extractedNotes" | "createdScenario" | "createdAudio"
type PodcastState = "generateMode" | "creatingPodcast" | "activeMode"

type PodcastGenerateScreenProps = {
  /** Additional materials only. Notes are included separately by your generator. */
  onPodcastReady?: (podcast: Podcast, audioBlob: Blob) => void;
  generationState: GenerationState;
  onSetGenerationState: (value: GenerationState) => void;
  podcastState: PodcastState;
  onSetPodcastState: (value: PodcastState) => void;
};



const LENGTHS = [
  { id: "short", label: "Short", time: "3–5 min", bars: 1 },
  { id: "long", label: "Long", time: "8-10 min", bars: 2 },
] as const;

const LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Explain from the basics and define unfamiliar terms.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Build on the basics with practical examples.",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Explore deeper connections and technical detail.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Assume strong background knowledge and discuss nuances.",
  },
] as const;



const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";



export default function PodcastGenerateScreen({
  onPodcastReady,
  generationState,
  onSetGenerationState,
  podcastState,
  onSetPodcastState

}: PodcastGenerateScreenProps) {
  const { projectID: projectId } = useParams() 


  const [resources, setResources] = useState<PodcastResource[]>([])
  const languages = EXAMPLE_LANGUAGES;
  const voices = VOICE_CATALOG ?? EXAMPLE_VOICES;
  const preview = !EXAMPLE_LANGUAGES || !VOICE_CATALOG;
  const generationAbort = useRef<AbortController | null>(null);
  const [generationStage, setGenerationStage] = useState("");
  const uid = useId();
  const reducedMotion = useReducedMotion();

  // jeżeli użytkownik przerwał - abortował proces generowania
  useEffect(() => () => { 
    generationAbort.current?.abort(); 
  }, []);

  // języki
  const [languageId, setLanguageId] = useState<string>(languages[0]?.id ?? "");
  const selectedLanguage = languages.find(
    (language) => language.id === languageId,
  );


  const [length, setLength] =
    useState<PodcastGenerationSettings["length"]>("short");
  const [instructions, setInstructions] = useState("");
  const [speakerIds, setSpeakerIds] = useState<string[]>(['keVdKhqmSInYxwD98sI8']);

  const [dialog, setDialog] = useState< 0 | 1 | null>(null);
  const [query, setQuery] = useState("");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const sampleAbort = useRef<AbortController | null>(null);
  const request = useRef(0);
  const submitting = useRef(false);
  const alive = useRef(true);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const language = languages.find((item) => item.id === languageId);
  const [languageOpen, setLanguageOpen] = useState(false);

  // const compatibleVoices = voices.filter((voice) =>
  //   voice.languageIds.includes(languageId),
  // );

  const selectedVoices = speakerIds.map((id) =>
    voices.find((voice) => voice.voiceId === id),
  );
  const currentLength = LENGTHS.find((item) => item.id === length)!;

  // wartości zwiazane z levelem ciężkości
  const [level, setLevel] =
    useState<PodcastGenerationSettings["level"]>("intermediate");
  const currentLevel = LEVELS.find((item) => item.id === level)!;
  // Indeks jest wyliczany z level: suwak i ustawienia generowania mają jeden stan.
  const difficultyIndex = LEVELS.findIndex((item) => item.id === level);



  const valid = Boolean(
    language &&
    speakerIds.length &&
    speakerIds.length <= 2 &&
    selectedVoices.every(Boolean) &&
    new Set(speakerIds).size === speakerIds.length,
  );

  const stopSample = () => {
    request.current++;
    sampleAbort.current?.abort();
    sampleAbort.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
      audio.current = null;
    }
    setSampleId(null);
    setSampleLoading(false);
  };

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      request.current++;
      sampleAbort.current?.abort();
      audio.current?.pause();
      if (focusTimer.current) clearTimeout(focusTimer.current);
    };
  }, []);

  // Reconcile asynchronously loaded catalogs without leaving stale voice IDs.
  useEffect(() => {
    const nextLanguage = languages.some((item) => item.id === languageId) ? languageId
      : (languages[0]?.id ?? "");
    if (nextLanguage !== languageId) setLanguageId(nextLanguage);

  }, [languages, voices, languageId]);


  const closeDialog = () => {
    stopSample();
    setDialog(null);
    setQuery("");
    setSampleError("");
    // Works with a controlled shadcn Dialog without wrapping every card in a trigger.
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => returnFocus.current?.focus(), 200);
  };

  const openVoices = (slot: 0 | 1, trigger: HTMLButtonElement) => {
    if (focusTimer.current) clearTimeout(focusTimer.current);
    returnFocus.current = trigger;
    setQuery("");
    setSampleError("");
    setDialog(slot);
  };

  const changeLanguage = (next: string) => {
    if (busy) return;
    stopSample();
    setLanguageId(next);
    setError("");
    setComplete(false);
  };


  // Tutaj zaczyna się puszczenie próbki / sampla z wybranego obiektu głosu
  const playSample = async (voice: PodcastVoice) => {

    // jeżeli puszczany sample to aktualny to zatrzymujemy
    if (sampleId === voice.voiceId) {
      stopSample();
      return;
    }

    // zatrzymujemy dawny sample i resetujemy stan erroru
    stopSample();
    setSampleError("");


    const token = request.current;
    const controller = new AbortController();

    // załączenie sampla id oraz rozpoczęcie kręcenia kołowrotkiem - spinnerem
    sampleAbort.current = controller;
    setSampleId(voice.voiceId);
    setSampleLoading(true);


    let player: HTMLAudioElement | null = null;

    // jeżeli coś poszło nie tak to tutaj na to reagujemy
    const fail = () => {
      if (!alive.current || token !== request.current) return;
      player?.pause();
      setSampleLoading(false);
      setSampleId(null);
      setSampleError(`Couldn't play ${voice.name}'s sample. Try again.`);
    };

    try {
      // tutaj odnosimy się do funkcji która wyślę fetcha / pinga z zapytaniem - ewentualnie wygeneruje nowy sample
      // oraz przesyłam signał który pozwoli abortować tę akcję
      // TA FUNKCJA ZWRACA TYLKO URL (pobrany lub wygenerowany przez API)
      const url = await getOrCreateVoiceSample(
        voice.voiceId, 
        languageId, 
        { 
          signal: controller.signal 
        }
      );

      if (!alive.current || token !== request.current) return;

      player = new Audio(url);
      audio.current = player;

      // wyłączanie spinnera 
      player.onplaying = () => {
        if (alive.current && token === request.current) setSampleLoading(false);
      };

      // włączanie spinnera
      player.onwaiting = () => {
        if (alive.current && token === request.current) setSampleLoading(true);
      };

      // wyłączanie spinnera
      player.onended = () => {
        if (alive.current && token === request.current) {
          setSampleId(null);
          setSampleLoading(false);
        }
      };

      // akcja kiedy jest błąd
      player.onerror = fail;
      await player.play();

    } catch (error) {
      // jeżeli ktoś abortował albo
      if (controller.signal.aborted || !alive.current || token !== request.current) return;
      fail();
      if (error instanceof Error) setSampleError(error.message);
    }
  };


  


  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!valid || preview || submitting.current) { 
      setError("not valid"); 
      return; 
    }
    if (!projectId) { setError("Missing project ID."); return; }
    if (!onPodcastReady) { setError("Connect onPodcastReady to your podcast player."); return; }

    // włączamy flage submiting
    submitting.current = true;
    const controller = new AbortController();
    generationAbort.current = controller;
    stopSample();
    setBusy(true);
    setError("");
    setComplete(false);

    try {

      setGenerationStage("Writing your podcast…");
      onSetPodcastState("creatingPodcast")

      console.log(projectId);
      
      const notes = await extractFiles(projectId, controller.signal)

      if(!notes.trim()) return console.log("No notes found"); 
    onSetGenerationState("extractedNotes")  

      const podcastData = {
        includeNotes: true,
        notes: notes,
        resources: resources,
        language: languageId,
        speakerIds: [...speakerIds],
        length,
        difficulty: level,
        additionalInstructions: instructions.trim(),        
      }

      const scenario = await generateScenario(podcastData, controller.signal);

      if (controller.signal.aborted) return;
      onSetGenerationState("createdScenario")

      const result = await buildPodcast(projectId, scenario, {
        signal: controller.signal,
        onProgress: (done, total) => { 
          if (alive.current) {
            setGenerationStage(done === total ? "Audio ready" : "Creating voices and syncing transcript…")            
          }
        }
      });

      onSetGenerationState("createdAudio")
      

      if (!alive.current || controller.signal.aborted) { 
        URL.revokeObjectURL(result.podcast.audioUrl!); 
        return; 
      }
      // Własność blob URL przechodzi do rodzica/playera; rodzic zwalnia go przy wymianie/usunięciu.

      try { 
        // poinformowanie PodcastLayout wyżej w hierarchi że podkast został wygenerowany
        onPodcastReady(result.podcast, result.blob ); //result.blob 
      } catch (error) { 
        URL.revokeObjectURL(result.podcast.audioUrl!);
        throw error; 
      }

      if (alive.current) setComplete(true);

    } catch (error) {
      if (alive.current && !controller.signal.aborted)
        setError(
          error instanceof Error ? error.message : "Couldn't create your podcast.",
        );
    } finally {
      submitting.current = false;
      if (generationAbort.current === controller) generationAbort.current = null;

      if (alive.current) { 
        setBusy(false); 
        setGenerationStage(""); 
      }
    }
  };

  const stages = {
    "none": 0,
    "extractedNotes": 1,
    "createdScenario": 2,
    "createdAudio" : 3
  }

  const waitTime = currentLength.label === "Short" ? 60 : 120  



  return (
    <>
      {podcastState === "creatingPodcast" && (
        <CreatingScreen 
          generationState={generationState}
          estimatedWaitTime={waitTime}
          customDictStages={stages}
          kind={"Podcast"}
        />      
      )}

      {podcastState === "generateMode" && (

        <div className="w-full bg-white text-gray-800">
          <main className="mx-auto max-w-[980px] px-5 py-8 sm:px-10 sm:py-10">

            <header className="mb-7 flex min-h-[112px] items-center justify-between gap-5 sm:mb-8">
              <div className="max-w-[540px]">
                <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-gray-500">
                  <Headphones size={14} aria-hidden="true" /> YOUR STUDY PODCAST
                </p>
                <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.8px]">
                  Create podcast
                </h1>
                <p className="mt-3 max-w-[440px] text-sm leading-relaxed text-gray-500">
                  Turn your study materials into a conversation worth listening to.
                </p>
              </div>
              <img
                src="/podcast_4.png"
                alt=""
                className="h-20 w-20 shrink-0 object-contain sm:h-32 sm:w-32"
              />
            </header>

            <div className="mb-8">
              <PodcastMaterials
                resources={resources}
                disabled={busy}
                onAddResources={added => {
                  setResources(current => [...current, ...added]);
                  setComplete(false);
                }}
                onRemoveResource={id => {
                  setResources(current => current.filter(resource => resource.id !== id));
                  setComplete(false);
                }}
              />
            </div>

            {busy && <p role="status" className="mb-4 text-sm text-gray-500">{generationStage}</p>}
            <form onSubmit={submit}>
              <fieldset
                disabled={busy}
                className="min-w-0 space-y-7 disabled:opacity-70"
              >

                {/* Pole inputowe języków */}
                <div>
                  <label
                    id={`${uid}-language-label`}
                    htmlFor={`${uid}-language-trigger`}
                    className="mb-3 block text-sm font-semibold"
                  >
                    Language
                  </label>

                  <Popover
                    open={languageOpen}
                    onOpenChange={setLanguageOpen}
                  >
                    <PopoverTrigger render={
                      <button
                        id={`${uid}-language-trigger`}
                        type="button"
                        disabled={busy || !languages.length}
                        aria-labelledby={`${uid}-language-label ${uid}-language-value`}
                        className="
                          flex min-h-10 w-fit items-center justify-between gap-7
                          rounded-[10px] border border-gray-200 bg-white px-3 py-2
                          text-sm text-gray-800 shadow-none
                          hover:bg-gray-50
                          focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-blue-600
                          disabled:cursor-not-allowed disabled:opacity-50
                        "
                      >
                        <span
                          id={`${uid}-language-value`}
                          className="flex items-center gap-3"
                        >
                          {selectedLanguage ? (
                            <>
                              <Flag country={selectedLanguage.flag} />
                              <span>{selectedLanguage.label}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">
                              Select language
                            </span>
                          )}
                        </span>

                        <ChevronDown
                          size={16}
                          aria-hidden="true"
                          className="shrink-0 text-gray-400"
                        />
                      </button>
                    }>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      side="bottom"
                      sideOffset={6}
                      className="
                        w-[260px] max-w-[calc(100vw-2rem)]
                        overflow-hidden rounded-xl border-gray-200
                        bg-white p-0 text-gray-800 shadow-md
                      "
                    >
                      <Command className="bg-white text-gray-800">
                        <CommandInput
                          placeholder="Search languages…"
                          aria-label="Search languages"
                          className="h-11 text-sm"
                        />

                        <CommandList className="max-h-60 overflow-y-auto">
                          <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                            No languages found.
                          </CommandEmpty>

                          <CommandGroup className="">
                            {languages.map((language) => (
                              <CommandItem
                                key={language.id}
                                value={language.id}
                                keywords={[language.label]}
                                disabled={busy}
                                onSelect={() => {
                                  changeLanguage(language.id);
                                  setLanguageOpen(false);
                                }}
                                className={`
                                  !flex !w-full !justify-start
                                  items-center gap-3 rounded-lg !pl-2 !pr-0 !mr-0 py-2.5 mt-1
                                  cursor-pointer
                                  data-[selected=true]:text-gray-800
                                  ${languageId === language.id
                                    ? "bg-blue-50"
                                    : "data-[selected=true]:bg-gray-100"}
                                `}
                              >
                                <span className="flex min-w-0 flex-1 items-center gap-3">
                                  <Flag country={language.flag} />
                                  <span className="truncate">{language.label}</span>
                                </span>

                                {languageId === language.id && (
                                  <Check
                                    size={16}
                                    aria-hidden="true"
                                    className="!ml-auto shrink-0 text-blue-600"
                                  />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>

                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <section aria-labelledby={`${uid}-speakers`}>
                  <h2 id={`${uid}-speakers`} className="text-sm font-semibold">
                    Speakers
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                    Choose one voice for narration or two for a conversation.
                  </p>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {([0, 1] as const).map((slot) => {
                      const voice = selectedVoices[slot];

                      return (
                        <div key={slot} className="relative min-w-0 flex justify-between items-center">

                          <button
                            type="button"
                            disabled={busy}
                            onClick={(event) =>
                              openVoices(slot, event.currentTarget)
                            }

                            className={`flex min-h-[94px] w-full items-center gap-3
                              rounded-xl border-2 py-4 pl-4 text-left
                              transition-colors duration-150
                              disabled:cursor-not-allowed disabled:opacity-50
                              motion-reduce:transition-none
                              ${
                                dialog === slot
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                              }
                              ${focus}
                              ${slot === 1 && voice ? "pr-12" : "pr-4"}
                            `}
                          >

                            {slot === 1 && !voice ? (
                              <>
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-50 text-gray-500">
                                  <Plus size={18} />
                                </span>
                                <span className="text-sm font-medium text-gray-600">
                                  Add second speaker
                                  <span className="mt-1 block text-xs font-normal text-gray-500">
                                    Make it a conversation
                                  </span>
                                </span>
                              </>
                            ) : (
                              <>
                                <VoiceAvatar voice={voice} />

                                <span className="min-w-0 flex-1">
                                  <span className="block text-[11px] text-gray-500">
                                    Speaker {slot + 1}
                                  </span>
                                  <span className="mt-0.5 block text-sm font-medium">
                                    {voice?.name ?? "Choose a voice"}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-gray-500">

                                    {voice ? VOICE_TAGS[voice.voiceId].map((tag, index) => {
                                      if(index !== VOICE_TAGS[voice.voiceId].length - 1) {
                                        return <span>{tag}, </span>
                                      } else {
                                        return <span>{tag}</span>
                                      }
                                    })  :
                                      "Find a voice for your podcast"}
                                  </span>
                                </span>
                                
                                <ChevronDown
                                  size={15}
                                  className="shrink-0 text-gray-400"
                                />

                              </>
                            )}
                          </button>

                          {slot === 1 && voice && (
                            <button
                              type="button"
                              disabled={busy}
                              aria-label="Remove second speaker"
                              onClick={() => {
                                setSpeakerIds((ids) => ids.slice(0, 1));
                                setComplete(false);
                              }}
                              className={`absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-gray-400
                                hover:bg-gray-100 hover:text-gray-800 ${focus}`}
                            >
                              <X size={14} />
                            </button>
                          )}
                  

                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Dwie kompaktowe kontrolki w jednym wierszu. */}
                <div className="w-[65%] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-9 max-[480px]:grid-cols-1 max-[480px]:gap-4">
                  <div className="min-w-0">
                    <label
                      id={`${uid}-length-label`}
                      className="mb-3 flex h-5 items-center text-sm font-semibold"
                    >
                      Length
                    </label>
                    <Select
                      value={length}
                      disabled={busy}
                      onValueChange={(next) => {
                        const selected = LENGTHS.find((item) => item.id === next);
                        if (!selected) return;
                        setLength(selected.id);
                        setComplete(false);
                      }}
                    >
                      <SelectTrigger
                        aria-labelledby={`${uid}-length-label`}
                        aria-describedby={`${uid}-length-help`}
                        className="!h-11 w-full rounded-[10px] border-gray-200 bg-gray-50 px-3.5 text-sm shadow-none focus-visible:ring-blue-600"
                      >
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {currentLength.label}
                            </span>
                            <span className="text-gray-500">
                              {currentLength.time}
                            </span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-200 bg-white p-1 text-gray-800 shadow-md">
                        {LENGTHS.map((item) => (
                          <SelectItem
                            key={item.id}
                            value={item.id}
                            className="min-h-11 cursor-pointer rounded-lg text-sm focus:bg-gray-50"
                          >
                            <span className="flex items-center gap-3">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-gray-500">{item.time}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p id={`${uid}-length-help`} className="sr-only">
                      Approximate duration. The final length depends on your
                      material.
                    </p>
                  </div>


                  <PodcastProgressBar 
                    busy={busy} 
                    level={level} 
                    onSetLevel={setLevel}
                    currentLevel={currentLevel}
                    difficultyIndex={difficultyIndex}  
                  />
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label
                    htmlFor={`${uid}-instructions`}
                    className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      {/* <MessageSquare size={15} className="text-gray-400" /> */}
                      Additional instructions
                    </span>
                    <span className="text-xs font-normal text-gray-400">
                      Optional
                    </span>
                  </label>
                  <textarea
                    id={`${uid}-instructions`}
                    value={instructions}
                    onChange={(event) => {
                      setInstructions(event.target.value);
                      setComplete(false);
                    }}
                    rows={3}
                    placeholder="Focus on the most important concepts, explain unfamiliar terms, and use practical examples…"
                    className={`min-h-[104px] w-full resize-y rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 ${focus}`}
                  />
                </div>
              </fieldset>

              <footer className="mt-6 border-t border-gray-200 pt-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600">
                      Your podcast, your way
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                      {language?.label ?? "Choose a language"} ·{" "}
                      {selectedVoices
                        .filter(Boolean)
                        .map((voice) => voice!.name)
                        .join(" & ") || "Choose a speaker"}{" "}
                      · {currentLength.time} · {currentLevel.label}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={busy || !valid }
                    className="h-11 w-full shrink-0 gap-2 rounded-[12px] bg-blue-600 px-5 text-sm font-medium text-white shadow-none
                    hover:bg-blue-700 disabled:opacity-50 sm:w-auto cursor-pointer"
                  >
                    {busy ? (
                      <Loader2
                        size={16}
                        className="animate-spin motion-reduce:animate-none"
                      />
                    ) : (
                      <Headphones size={16} className="stroke-2"/>
                    )}
                    {busy
                      ? "Generating podcast…"
                      : error
                        ? "Try again"
                        : "Create podcast"
                    }
                  </Button>

                </div>
                {preview && (
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    Preview mode · Generation and voice samples are not connected.
                  </p>
                )}
                {!preview && (
                  <p className="mt-3 text-xs text-gray-600">
                    Add text to your Notes tab before generating.
                  </p>
                )}
                {busy && (
                  <p role="status" className="mt-3 text-sm text-gray-600">
                    Generating your podcast…
                  </p>
                )}
                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                {complete && (
                  <p role="status" className="mt-3 text-sm text-gray-600">
                    Your podcast is ready.
                  </p>
                )}
              </footer>
            </form>
          </main>



          <Dialog
            open={dialog !== null}
            onOpenChange={(open) => {
              if (!open) closeDialog();
            }}
          >
            <DialogContent className="flex flex-col max-h-[min(720px,90dvh)] w-[calc(100%_-_2rem)] rounded-2xl border-gray-200 bg-white p-6
            text-gray-800 shadow-lg sm:max-w-[600px]">
              
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Choose speaker {(dialog ?? 0) + 1}
                </DialogTitle>

                <DialogDescription className="pt-1 text-[13px] leading-relaxed text-gray-500">
                  Preview a voice, then select it for your podcast.
                </DialogDescription>
              </DialogHeader>
              
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-3 text-gray-400"
                />
                <Input
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search voices"
                  placeholder="Search voices…"
                  className="h-10 rounded-lg border-gray-200 bg-gray-50 pl-9 shadow-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Available in {language?.label ?? "this language"}</span>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1
                [&::-webkit-scrollbar]:w-[5px]
                [&::-webkit-scrollbar]:h-[5px]
                [&::-webkit-scrollbar-track]:bg-gray-100
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                [&::-webkit-scrollbar-thumb]:rounded-[4px]
              ">
                {voices
                  .filter((voice) =>
                    `${voice.name} ${voice.description}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((voice) => {
                    const selected =
                      dialog !== null && speakerIds[dialog] === voice.voiceId;

                    const otherSlot = dialog === 0 ? 1 : 0;
                    const used = speakerIds[otherSlot] === voice.voiceId;

                    return (
                      <div
                        key={voice.voiceId}
                        className={`flex items-center gap-1 rounded-xl border pr-2  hover:bg-gray-50
                          ${selected ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                      >
                        <button
                          type="button"
                          disabled={used || busy}
                          aria-pressed={selected}
                          onClick={() => {
                            if (dialog === null) return;
                            setSpeakerIds((ids) =>
                              dialog === 0
                                ? [voice.voiceId, ...ids.slice(1)]
                                : [ids[0], voice.voiceId],
                            );
                            setComplete(false);
                            closeDialog();
                          }}
                          className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 h-25 text-left disabled:cursor-not-allowed
                            disabled:opacity-[0.45] ${focus}`}
                        >
                          <VoiceAvatar voice={voice} large />

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-[16px] font-medium">
                              {voice.name}
                              {selected && (
                                <Check size={14} className="text-blue-600" />
                              )}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                              {voice ? VOICE_DIRECTIONS[voice.voiceId] :
                                "Find a voice for your podcast"}                          
                              {voice ? VOICE_TAGS[voice.voiceId].map((tag, index) => {
                                if(index !== VOICE_TAGS[voice.voiceId].length - 1) {
                                  return <span>{tag}, </span>
                                } else {
                                  return <span>{tag}</span>
                                }
                              })  :
                                "Find a voice for your podcast"}
                            </span>
                            {used && (
                              <span className="mt-1 block text-[11px] text-gray-500">
                                Selected as speaker {otherSlot + 1}
                              </span>
                            )}
                          </span>
                        </button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={`Preview ${voice.name}`}
                          aria-label={
                            sampleId === voice.voiceId
                              ? `Stop ${voice.name}'s sample`
                              : `Play ${voice.name}'s sample`
                          }
                          disabled={busy}
                          aria-busy={sampleId === voice.voiceId && sampleLoading}
                          onClick={() => void playSample(voice)}
                          className="h-10 w-10 shrink-0 rounded-full text-gray-800 hover:bg-gray-100"
                        >

                          <div className="p-[9px] rounded-full ring-inset ring-2 ring-gray-200">
                            {sampleId === voice.voiceId && sampleLoading ? (
                            <Loader2
                              size={17}
                              className="animate-spin motion-reduce:animate-none"
                            />
                            ) : sampleId === voice.voiceId ? (
                              <Pause size={16} fill="currentColor" />
                            ) : (
                              <Play size={16} fill="currentColor" />
                            )}                        
                          </div>
                        </Button>

                      </div>
                    );
                  })}
                  
                  {sampleError && (
                    <p role="alert" className="text-sm text-red-600">
                      {sampleError}
                    </p>
                  )}
              </div>


              {sampleError && (
                <p role="alert" className="text-sm text-red-700">
                  {sampleError}
                </p>
              )}
              {sampleLoading && (
                <span role="status" className="sr-only">
                  Loading voice sample
                </span>
              )}
              <p className="flex items-center gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
                <AudioLines size={14} />
                {preview
                  ? "Example voices · Connect your voice catalog for audio previews."
                  : "Listen first. Find the voice that works for you."}
              </p>
            </DialogContent>
          </Dialog>


          <Dialog>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Materials</DialogTitle>
                  <DialogDescription>Choose your material format</DialogDescription>  
                </DialogHeader>


                <div className="w-[500px] h-[500px] grid grid-cols-2 gap-2">
                  <div className="bg-black"></div>
                  <div className="bg-black"></div>
                  <div className="bg-black"></div>
                  <div className="bg-black"></div>                                          
                </div>
              </DialogContent>
          </Dialog>


        </div>

      )}    

    </>    
  )
  

}
