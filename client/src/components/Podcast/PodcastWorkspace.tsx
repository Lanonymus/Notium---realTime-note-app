import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import FlashcardsNavbar from "../Flashcards/FlashcardsNavbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Brain, BookOpen, Lightbulb, CalendarDays, Sprout, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Plus, Search, Headphones, ArrowDown, Loader2, X } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
  LayoutGroup,
} from "framer-motion";
import NumberFlow from "@number-flow/react";
import AnimatedVolume from "./AnimatedVolume";
import { h1 } from "framer-motion/client";
import PodcastGenerateScreen from "./PodcastGenerateScreen";


import type { Podcast, Utterance } from "./podcastTypes";
export type { Podcast, Utterance, Chapter } from "./podcastTypes";
import { TranscriptWords } from "./TranscriptWords";
import { VOICE_CATALOG } from "./podcastVoices";
import { LucideIcon } from "./LucideIcon";

type Tabs = "chapters" | "transcript"


const formatTime = (value: number) => {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const minutes = Math.floor(seconds / 60)
  
  // 00:00 
  return `${minutes.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
};


// Niestandardowy Switch zachowany w kolorystyce blue-600
const CustomSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
       transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200'}
    `}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);




const THUMB_COLORS = [
  "bg-[#eef2e6] text-[#758563]",
  "bg-[#edf2f7] text-[#6a8598]",
  "bg-[#e1ebfa] text-[#6687b0]",
  "bg-[#f5f0e7] text-[#a08b65]",
  "bg-[#edf1eb] text-[#7e9171]",
];



// Stable illustration of a waveform, used only in the labelled demo.
const DEMO_WAVE = Array.from(
  { length: 25 },
  (_, i) => 0.14 + Math.abs(Math.sin(i * 2.3) * Math.cos(i * 0.39)) * 0.86,
);


type PodcastWorkspaceProps = {
  podcast: Podcast,
  podcastState: string,
  projectId: string
}


export default function PodcastWorkspace({
  podcast,
  podcastState,
  projectId
}: PodcastWorkspaceProps) {

  const hosts = podcast?.speakers?.map(s => s.name)
    ?? [...new Set(podcast?.transcript.map(t => t.speaker) ?? [])];
  const hostsIds = podcast?.speakers?.map((speaker) => speaker.id)
  const audio = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(podcast?.duration || 0);
  const [speed, setSpeed] = useState("1");
  const [volume, setVolume] = useState(0.8);
  const [buffering, setBuffering] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [tab, setTab] = useState<Tabs>("chapters");
  const [search, setSearch] = useState("");
  const [follow, setFollow] = useState(true);
  const [suspended, setSuspended] = useState(false);
  const activeText = useRef<HTMLDivElement>(null);

  const tabsAnimationId = useId();
  const allTabs: Tabs[] = ["chapters", "transcript"]


  const chapters = [...(podcast?.chapters ?? [])].sort(
    (a, b) => a.start - b.start,
  );
  const transcript = [...(podcast?.transcript ?? [])].sort(
    (a, b) => a.start - b.start,
  );
  const chapterIndex = chapters.reduce(
    (found, c, i) => (c.start <= time ? i : found),
    -1,
  );
  const chapter = chapters[chapterIndex];
  const utterance = transcript.reduce<Utterance | undefined>(
    (found, item) => (item.start <= time && (item.end === undefined || time < item.end) ? item : found),
    undefined,
  );
  const available = Boolean(podcast?.audioUrl);
  const bars = podcast?.waveform;
  const active =
    playing &&
    !buffering &&
    podcastState === "activeMode";


  // Read the real media clock; requestAnimationFrame improves word highlighting.
  useEffect(() => {
    if (!playing) return;
    let frame = 0, lastUpdate = 0;
    const tick = (now: number) => {
      if (audio.current && now - lastUpdate >= 50) {
        setTime(audio.current.currentTime);
        lastUpdate = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);

  }, [playing]);

  useEffect(() => {
    setTime(0);
    setDuration(podcast.duration);
    setPlaying(false);
    setBuffering(false);
    setAudioError("");
  }, [podcast.id, podcast.audioUrl]);

  // progress czasu
  useEffect(() => {
    if (!playing || podcastState !== "activeMode") return;

    let last = performance.now();

    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - last) / 1000;
      last = now;
      setTime((previous) =>
        Math.min(duration, previous + delta * Number(speed)),
      );
    }, 100);

    return () => window.clearInterval(interval);

  }, [playing, speed, duration, podcastState]);


  // przedłużenie streaku lub rozpoczęcie - uniwersalne
  const extendStreak = async () => {

      try {
          const response = await fetch("http://localhost:8000/api/extendStreak", {
              method: "POST",
              credentials: "include",
      });
      
      if (!response.ok) return console.log("Problem with extending streak");
          console.log("Succesfuly extended daily streak");
      } catch (error) {
          console.log("Problem with extending daily streak from quiz", error);
      }  
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


  const completePodcast = async () => {
    const attemptIdRef = crypto.randomUUID();

    await addCompletedActivity({
        attemptId: attemptIdRef,
        activityType: "podcast",
        projectId,
        resourceId: podcast.id,
      });
  }


  // koniec progressu = zatrzymanie audio
  useEffect(() => {
    if (duration > 0 && time >= duration) {
      completePodcast()
      extendStreak()
      setPlaying(false); 
    }

  }, [time, duration]);


  // ustawienia audio: 1 - głoścność, 2 - prędkość
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.playbackRate = Number(speed);
    }

  }, [volume, speed]);


  // zatrzymanie audio 
  useEffect(() => {
    if (podcastState !== "activeMode") {
      audio.current?.pause();
      setPlaying(false);
    }

  }, [podcastState]);


  // automatyczne scrollowanie do tekstu
  useEffect(() => {
    if (tab === "transcript" && follow && !suspended && !search && active) {
      activeText.current?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
  }, [utterance?.id, tab, follow, suspended, search, active]);


  // przeskakiwanie na inny czas - zmiana słuchanego tekstu
  const seek = (value: number) => {
    const next = Math.max(0, Math.min(duration, value));
    if (audio.current) audio.current.currentTime = next;

    setTime(next);
  };


  // Puszczenie podkastu - start
  const play = async () => {
    const element = audio.current;

    if (!available || !element) return;

    if (time >= duration) seek(0);

    setAudioError("");

    try {
      await element.play();
    } catch (error) {
      console.error("Audio play failed:", {
        error,
        src: element.currentSrc,
        readyState: element.readyState,
        networkState: element.networkState,
        mediaError: element.error
          ? {
              code: element.error.code,
              message: element.error.message,
            }
          : null,
      });

      setPlaying(false);
      setBuffering(false);
      setAudioError("Audio could not play. Please try again.");
    }
  };

  // zatrzymywanie audio
  const toggle = () => {
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
    } else void play();
  };

  // jeżeli wybierzemy aktualnie grający chapter to go zatrzymujemy inaczej puszczamy jakiś inny chapter
  const selectChapter = (index: number) => {
    if (index === chapterIndex && playing) toggle();
    else {
      seek(chapters[index].start);
      void play();
    }
  };

  // włączenie śledzenia tekstu
  const resumeFollow = () => {
    setSearch("");
    setFollow(true);
    setSuspended(false);
  };

  return (

    <>

        <main className="mx-auto max-w-[1300px] px-9 pt-[38px] pb-[60px] [font-family:inherit] text-[#242833] [&_*]:box-border
        [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-blue-600 [&_button:focus-visible]:outline-offset-4
          [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-blue-600 [&_input:focus-visible]:outline-offset-4
          [&_button:disabled]:cursor-not-allowed motion-reduce:[&_*]:animate-none motion-reduce:[&_*]:transition-none
            motion-reduce:[&_*]:scroll-auto min-[1600px]:pt-[50px] max-[1050px]:px-6 max-[1050px]:pt-7 max-[1050px]:pb-12
            max-[430px]:px-4 max-[430px]:pt-6 max-[430px]:pb-10">
          
          <header className="mb-8 flex items-center justify-between gap-6 [&_h1]:mb-2 [&_h1]:text-[28px] [&_h1]:leading-[1.25] 
          [&_h1]:font-semibold [&_h1]:tracking-[-0.8px] [&_p]:m-0 [&_p]:text-sm [&_p]:leading-[1.6] [&_p]:text-[#737780]
          max-[760px]:mb-[26px] max-[760px]:items-start max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:max-w-[230px]
            max-[430px]:flex-wrap max-[430px]:gap-4">
            
            <div>
              <h1>Podcast</h1>
              <p>Listen to your notes. Understand the bigger picture.</p>
            </div>


              {/* <Button
                variant="outline"
                onClick={onGenerate}
                disabled={podcastState === "generating"}
                className="gap-2 shadow-none"
              >
                <Plus size={16} />
                Create podcast
              </Button> */}
      

          </header>

            <div className="grid grid-cols-[minmax(0,1.27fr)_minmax(0,1fr)] items-start gap-[30px] 
            max-[1050px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] max-[1050px]:gap-[22px] 
            max-[760px]:flex max-[760px]:flex-col max-[760px]:gap-[30px]">

              <section
                className="min-w-0 max-[760px]:w-full"
                onWheel={() => setSuspended(true)}
                onTouchMove={() => setSuspended(true)}
                onKeyDown={(event) => {
                  if (["PageUp", "PageDown", "Home", "End"].includes(event.key))
                    setSuspended(true);
                }}
              >
                <Tabs value={tab} onValueChange={setTab}>

                  <LayoutGroup id={tabsAnimationId}>
                    <TabsList className="!h-10 gap-1 rounded-[12px] bg-gray-100/80 p-1">
                      {allTabs.map((tabFromList) => (
                        <TabsTrigger
                          key={tabFromList}
                          value={tabFromList}
                          className={`
                            relative isolate h-full cursor-pointer
                            rounded-md border-0 px-4 py-1.5
                            text-xs font-semibold
                            !bg-transparent !shadow-none
                            after:!hidden
                            transition-colors duration-200
                            ${
                              tab === tabFromList
                                ? "!text-neutral-900"
                                : "!text-neutral-500 hover:!text-neutral-800"
                            }
                          `}
                        >
                          {tab === tabFromList && (
                            <motion.span
                              layoutId="activePodcastTab"
                              aria-hidden="true"
                              className="
                                pointer-events-none absolute inset-0
                                rounded-md bg-white shadow-sm
                              "
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}

                          <span className="relative z-10 flex items-center gap-2">
                            {tabFromList === "chapters" ? (
                              <>
                                Chapters
                                <span className="text-xs text-gray-500">
                                  {chapters.length}
                                </span>
                              </>
                            ) : (
                              "Transcript"
                            )}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </LayoutGroup>

                  <TabsContent value="chapters" className="mt-5">
                    
                    <div className="mt-7 mb-3 flex items-center justify-between gap-3 px-[15px] text-xs text-[#858992] [&>span:first-child]:text-[11px] [&>span:first-child]:font-semibold [&>span:first-child]:tracking-[1.3px]">
                      <span>IN THIS PODCAST</span>
                      <span>{chapters.length} chapters</span>
                    </div>
                    
                    {chapters.length === 0 && (
                      <p className="py-4 text-[13px] leading-[1.7] text-[#87909e]">
                        No chapters available for this podcast.
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      {chapters.map((item, index) => {
                        // const Icon = ICONS[index % ICONS.length];
                        const selected = index === chapterIndex;

                        return (
                          <article
                            key={item.id}
                            style={{ animationDelay: `${0.1 + index * 0.1}s`}}
                            className={`flex items-start gap-[15px] border-2  rounded-[12px] px-[14px] py-[19px] transition-colors animate-face-down
                              duration-150 max-[1050px]:gap-2.5 max-[1050px]:px-2.5 max-[1050px]:py-4 max-[430px]:gap-[9px] max-[430px]:px-2 
                                ${selected ? "border-blue-600 bg-blue-50 hover:bg-blue-50" : "border-transparent hover:bg-gray-50"}
                                `}
                            aria-current={selected ? "true" : undefined}
                          >
                            <div className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[10px] max-[1050px]:h-11
                              max-[1050px]:w-11 max-[430px]:h-[42px] max-[430px]:w-[38px] ${THUMB_COLORS[index % THUMB_COLORS.length]}`}>
                              {/* <Icon size={25} strokeWidth={1.45} /> */}
                              <LucideIcon name={item.icon} size={25} strokeWidth={1.45}/>
                            </div>

                            <div className="min-w-0 flex-1 [&>p]:mt-[5px] [&>p]:mb-2.5 [&>p]:text-[13px] [&>p]:leading-[1.65] max-[760px]:[&>p]:text-sm">
                              
                              <div className="flex items-baseline gap-2 [&>h3]:m-0 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:leading-[1.5] max-[430px]:gap-[5px]">
                                <span className="text-[11px] tabular-nums text-[#959ba5]">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <h3>{item.title}</h3>
                              </div>

                              <p className={`${selected ? "text-blue-950/80" : "text-[#7c828d]"}`}>{item.description}</p>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] tabular-nums text-[#858b94] max-[760px]:text-xs">
                                <span>{formatTime(item.start)}</span>
                                
                                <div className="h-1 w-1 rounded-full bg-gray-400 mb-[2px]"/>

                                <span>
                                  {formatTime(
                                    item.end ?? chapters[index + 1]?.start ?? duration,
                                  )}{" "}
                                  min
                                </span>

                              </div>

                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`mt-[7px] !h-9 !w-9 shrink-0 !rounded-full max-[760px]:!h-11 max-[760px]:!w-11 group cursor-pointer
                                max-[430px]:!w-9 ${selected ? "bg-blue-100 text-blue-600 hover:bg-blue-100" : ""}`}
                              disabled={!available}
                              onClick={() => selectChapter(index)}
                              aria-label={`${selected && playing ? "Pause" : "Play"} ${item.title}`}
                            >
                              {selected && playing ? (
                                <Pause size={17} fill="currentColor" className={` ${selected ? "group-hover:text-blue-700" : ""}`} />
                              ) : (
                                <Play size={17} fill="currentColor" className={` ${selected ? "group-hover:text-blue-700" : ""}`} />
                              )}
                            </Button>

                          </article>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex items-center gap-2 border-t border-[#f0f1f3] px-[14px] py-5 text-xs text-[#9a9fa8]">
                      <Headphones size={15} />
                      <span>A little listening. A deeper understanding.</span>
                    </div>

                  </TabsContent>

                  <TabsContent value="transcript" className="mt-6">

                    <div className="mt-7 mb-5 flex items-center gap-4 max-[1050px]:flex-wrap max-[760px]:flex-nowrap max-[430px]:flex-wrap">
                      
                      <div className="relative min-w-0 flex-1 max-[1050px]:basis-full max-[760px]:basis-auto max-[430px]:basis-full">
                        
                        <Search size={16} className="absolute top-[50%] left-2 -translate-y-[50%] text-[#9aa0a9] pointer-events-none "/>
                        <Input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search transcript…"
                          aria-label="Search transcript"
                          className="pl-9 shadow-none !h-[37px]"
                        />
                      </div>

                      <label className="flex items-center gap-2 whitespace-nowrap text-xs text-[#767e89]">
                        {/* <Switch
                          checked={follow}
                          onCheckedChange={(v) => {
                            setFollow(v);
                            setSuspended(false);
                          }}
                        /> */}
                        <CustomSwitch
                          checked={follow}
                          onChange={() => {
                            setFollow(!follow)
                            setSuspended(false)
                          }}
                        />
                        
                        Follow audio
                      </label>
                    </div>

                    {follow && suspended && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resumeFollow}
                        className="my-3 gap-2 text-blue-600 cursor-pointer"
                      >
                        <ArrowDown size={14} />
                        Back to current
                      </Button>
                    )}

                    <div className="flex flex-col gap-[16px]">
                      {transcript
                        .filter((item) =>
                          `${item.speaker} ${item.text}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            ref={item.id === utterance?.id ? activeText : undefined}
                            className={`scroll-mt-6 rounded-lg px-[18px] py-[17px] [&>p]:mt-2 [&>p]:mb-0 [&>p]:text-[15px]
                              [&>p]:leading-[1.8] [&>p]:text-[#555f6e] max-[430px]:px-2.5 max-[430px]:py-[14px] border-2
                                ${item.id === utterance?.id ? "border-blue-600 bg-blue-50" 
                                : "border-transparent hover:bg-gray-50 bg-gray-50"}`}
                          >
                            <div className="flex items-center gap-3 text-[13px] font-semibold [&>button]:cursor-pointer [&>button]:border-0
                            [&>button]:bg-transparent [&>button]:p-[5px] [&>button]:text-[11px] [&>button]:font-normal [&>button]:tabular-nums
                              [&>button]:text-[#9199a5] max-[760px]:[&>button]:min-h-10">
                              <span
                                className={
                                  item.speaker === hosts[0] ? "text-[#4a74ad]" : "text-[#51857d]"
                                }
                              >
                                {item.speaker}
                              </span>
                              <button
                                disabled={!available}
                                onClick={() => seek(item.start)}
                                aria-label={`Seek to ${formatTime(item.start)}`}
                              >
                                {formatTime(item.start)}
                              </button>
                              {item.id === utterance?.id && active && (
                                <span className="ml-auto text-[10px] font-normal text-[#8b98a9]">Speaking</span>
                              )}
                            </div>
                            <p>
                              <TranscriptWords utterance={item} time={time} available={available}
                                onSeek={seek} highlight={active} />
                            </p>
                          </div>
                        ))}
                    </div>

                    {transcript.length === 0 ? (
                      <p className="py-4 text-[13px] leading-[1.7] text-[#87909e]">
                        A transcript isn't available for this podcast yet.
                      </p>
                    ) : (
                      !transcript.some((item) =>
                        `${item.speaker} ${item.text}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      ) && (
                        <p className="py-4 text-[13px] leading-[1.7] text-[#87909e]">
                          No matching fragments. Try a different phrase.
                        </p>
                      )
                    )}

                  </TabsContent>

                </Tabs>
              </section>

              <aside 
                className="sticky !top-[100px] transition-all duration-150 min-w-0 rounded-2xl border border-gray-200 bg-white [&>h2]:mt-0 [&>h2]:mb-3
              [&>h2]:text-[25px] [&>h2]:font-semibold [&>h2]:leading-[1.3] [&>h2]:tracking-[-0.65px] [&>h2]:[overflow-wrap:anywhere]
                max-[1050px]:p-[22px] max-[760px]:static max-[760px]:order-first max-[760px]:w-full max-[760px]:[&>h2]:text-2xl"
                aria-label="Podcast player" 
                >
                
                <div className="p-7">
                  <div className="mb-[22px] flex flex-wrap items-center justify-between gap-2 [&>span:first-child]:flex
                  [&>span:first-child]:items-center [&>span:first-child]:gap-[7px] [&>span:first-child]:text-[10px]
                    [&>span:first-child]:font-semibold [&>span:first-child]:tracking-[1.25px] [&>span:first-child]:text-[#9297a0]">

                    <span>
                      <Headphones size={14} /> YOUR STUDY PODCAST
                    </span>
                  </div>
                  
                  <h2>{podcast?.title}</h2>

                  <p className="m-0 line-clamp-2 text-[13px] leading-[1.8] text-[#838791] max-[760px]:max-w-[440px]">{podcast?.description}</p>
                  
                  <div className="mt-8 mb-[29px] flex justify-center gap-12 max-[760px]:my-6">
                    {hosts.map((host, index) => (
                      <div className="relative flex flex-col items-center gap-1.5 first:after:absolute first:after:-right-[29px]
                       first:after:top-[17px] first:after:text-[15px] first:after:text-[#c1c5cc] first:after:content-['×']
                        only:after:content-none [&>strong]:text-xs [&>strong]:font-medium [&>span]:text-[10px] [&>span]:text-[#979da6]" key={host}>
                        
                        {hostsIds ? (
                          <span
                            className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-gray-200
                               bg-gray-50 font-medium text-gray-600 h-13 w-13 text-sm ${utterance?.speaker === host && active ?
                                "ring-2 ring-offset-1 ring-blue-600": "ring-1 outline-gray-100"}`}
                          >
                            {VOICE_CATALOG.find((voice) => voice.voiceId === hostsIds[index])?.avatarUrl && (
                              <img
                                src={VOICE_CATALOG.find((voice) => voice.voiceId === hostsIds[index])?.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>
                        ) : (
                          <div
                            className={`mb-[3px] grid h-[50px] w-[50px] place-items-center rounded-full border-[3px]
                              border-white text-[19px] font-medium outline 
                              ${index ? "bg-[#e3eeea] text-[#497b74]" : "bg-[#e6edf7] text-[#49617e]"} 
                              ${utterance?.speaker === host && active ? (index 
                                ? "outline-2 outline-[#578e86]" : "outline-2 outline-blue-600") : "outline-1 outline-gray-200"}
                              `}
                            aria-hidden="true"
                          >
                            {host.slice(0, 1).toUpperCase()}
                          </div>
                        )}


                        <strong>{host}</strong>
                        <span>
                          {utterance?.speaker === host && active
                            ? "Speaking"
                            : hosts.length === 1 ? "Narrator" : "Co-host"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="relative isolate h-16 focus-within:rounded focus-within:outline-2 focus-within:outline-blue-600
                      focus-within:outline-offset-[5px] after:pointer-events-none after:absolute after:inset-y-0 after:left-[var(--np-progress)]
                      after:w-px after:bg-blue-600 after:opacity-[0.45] after:content-[''] [&>input]:absolute [&>input]:inset-0
                      [&>input]:m-0 [&>input]:h-full [&>input]:w-full [&>input]:cursor-pointer [&>input]:opacity-0"
                    style={
                      {
                        "--np-progress": `${duration ? (time / duration) * 100 : 0}%`,
                      } as CSSProperties
                    }
                  >
                    {bars?.length ? (
                      <div className="flex h-full items-center gap-[3px] overflow-hidden [&>span]:min-w-px [&>span]:flex-1 [&>span]:rounded-[5px]" aria-hidden="true">
                        {bars.map((amplitude, i) => (
                          <span
                            key={i}
                            className={`h-[var(--bar-height)] ${i / bars.length < time / duration ? "bg-blue-600" : "bg-gray-200"}`}
                            style={{
                              "--bar-height": `${Math.max(6, Math.min(1, Number.isFinite(amplitude) ? amplitude : 0) * 100)}%`,
                            } as CSSProperties}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-x-0 top-[30px] h-1 rounded bg-[linear-gradient(to_right,#2563eb_var(--np-progress),#e5e7eb_var(--np-progress))]" />
                    )}
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.1}
                      value={Math.min(time, duration)}
                      onChange={(event) => seek(Number(event.target.value))}
                      disabled={!available || duration <= 0}
                      aria-label="Playback position"
                      aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
                    />
                  </div>

                  <div className="mt-2.5 flex justify-between text-[11px] tabular-nums text-[#9399a2] [&>span:first-child]:text-[#5d6676]">
                    <span>{formatTime(time)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  <div className="my-6 flex items-center justify-center gap-[22px]">

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!available}
                      onClick={() => seek(time - 15)}
                      aria-label="Back 15 seconds"
                      className="relative !h-10 !w-10  p-5 text-neutral-500 cursor-pointer hover:text-neutral-900 hover:bg-neutral-100
                      !rounded-full active:scale-[0.97] transition-all duration-100"
                    >
                      {/* <RotateCcw className="!w-8 !h-8" /> */}
                    
                      <svg className="!h-6 !w-6" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="22" width="22" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 20h2a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-2v-3h3"></path>
                        <path d="M15 18a6 6 0 1 0 0 -12h-11"></path>
                        <path d="M5 14v6"></path><path d="M7 9l-3 -3l3 -3"></path>
                      </svg>                  
                    </Button>

                    <Button
                      size="icon"
                      disabled={!available}
                      onClick={toggle}
                      aria-label={playing ? "Pause podcast" : "Play podcast"}
                      className="!h-[52px] !w-[52px] !rounded-full !shadow-none cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {buffering ? (
                        <Loader2 className="animate-spin motion-reduce:animate-none" size={23} />
                      ) : playing ? (
                        <Pause size={23} fill="currentColor" />
                      ) : (
                        <Play size={23} fill="currentColor" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!available}
                      onClick={() => seek(time + 15)}
                      aria-label="Forward 15 seconds"
                      className="relative !h-10 !w-10  p-5 cursor-pointer text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100
                      !rounded-full active:scale-[0.97] transition-all duration-100"                  
                    >
                      <svg className="!h-6 !w-6" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="22" width="22" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 9l3 -3l-3 -3"></path>
                        <path d="M9 18a6 6 0 1 1 0 -12h11"></path>
                        <path d="M16 20h2a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-2v-3h3"></path><path d="M13 14v6"></path>
                      </svg>
                    </Button>

                  </div>

                  <div className="mb-[22px] flex items-center justify-between">
                    
                    <AnimatedVolume
                      volume={volume}
                      onVolumeChange={setVolume}
                    />

                    <Select value={speed} onValueChange={setSpeed}>
                      
                      <SelectTrigger
                        aria-label="Playback speed"
                        className="h-9 w-20 border-0 bg-gray-50 shadow-none"
                      >
                        <SelectValue>{speed}x</SelectValue>
                      </SelectTrigger>

                      <SelectContent className="p-1">
                        {["0.75", "1", "1.25", "1.5", "2"].map((v) => (
                          <SelectItem key={v} value={v} className="!py-2 !rounded-[8px]">
                            {v}x {v === "1" ? "(Normal)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>

                    </Select>
                  </div>              
                </div>

                
                <div className="border-t border-[#eef0f2] p-5 flex bg-gray-50 rounded-bl-2xl rounded-br-2xl items-center justify-center flex-col text-center [&>span]:text-[10px]
                [&>span]:font-medium [&>span]:tracking-[1.25px] [&>span]:text-[#9aa0a9] [&>p]:mt-[7px] [&>p]:mb-px [&>p]:text-xs [&>p]:leading-[1.6]
                  [&>p]:text-[#687386]">
                  <span>
                    {time >= duration && duration > 0
                      ? "FINISHED"
                      : "CURRENT CHAPTER"}
                  </span>
                  <p>
                    {chapter
                      ? `${String(chapterIndex + 1).padStart(2, "0")} · ${chapter.title}`
                      : "Full podcast"}
                  </p>
                </div>
                
                {!available && (
                  <p className="py-4 text-[13px] leading-[1.7] text-[#87909e]" role="podcastState">
                    Audio isn't available yet.
                  </p>
                )}
                {buffering && (
                  <p className="py-4 text-[13px] leading-[1.7] text-[#87909e]" role="podcastState">
                    Buffering audio…
                  </p>
                )}
                {audioError && (
                  <div role="alert" className="flex items-center gap-3 pt-4 text-[13px] leading-[1.6] text-red-700">
                    {audioError}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        audio.current?.load();
                        void play();
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                )}

              </aside>
            </div>
          


          {podcast?.audioUrl && (
            <audio
              ref={audio}
              src={podcast.audioUrl}
              preload="metadata"
              onLoadedMetadata={(event) => {
                const value = event.currentTarget.duration;
                if (Number.isFinite(value)) setDuration(value);
              }}
              onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onPlaying={() => {
                setPlaying(true);
                setBuffering(false);
              }}
              onWaiting={() => setBuffering(true)}
              onCanPlay={() => setBuffering(false)}
              onEnded={() => {
                setPlaying(false);
                setBuffering(false);
              }}
              onError={() => {
                setPlaying(false);
                setBuffering(false);
                setAudioError(
                  "Audio couldn't be loaded. Check your connection and try again.",
                );
              }}
              onSeeking={() => setBuffering(true)}
              onSeeked={(event) => {
                setTime(event.currentTarget.currentTime);
                setBuffering(false);
              }}              
            />
          )}
        </main>   
         
    </>

  );
}
