import { useEffect, useRef, useState } from "react";
import { Mascot } from "./LandingPageLayout";
import {
  Check,
  CheckCheck,
  X,
  Pencil,
  Star,
  Volume2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Pause,
  RotateCcw,
  RotateCw,
  BookOpen,
  ArrowRight,
} from "lucide-react";
// Główne ustawienia prezentacji. Czasy osi animacji są podane w sekundach,
// a czasy przejść CSS i całej pętli w milisekundach.
const TOUR_CONFIG = {
  playback: {
    speed: 1.25,
    durationMs: 33000,
    maxFrameDeltaMs: 80,
    repaintEveryMs: 32,
    reducedMotionTime: 7.8,
    visibilityThreshold: 0.15,
  },
  stage: {
    width: 560,
    height: 470,
    cardInsetX: 40,
    cardGap: 30,
    offscreenMargin: 30,
  },
  timeline: {
    // Początek kolejnych kart: notatka, podcast, fiszka i pytania.
    stops: [6.4, 8.8, 12.2, 14.6, 17.0, 20.6, 23.1, 25.7, 29.0],
    cardHeights: [158, 360, 270, 340, 406, 300, 406, 406, 300],
    defaultAnswerDelay: 0.9,
    fadeOutStart: 32,
    fadeOutEnd: 33,
  },
  upload: {
    filesAppearDuration: 0.25,
    dropStart: 1.4,
    dropDuration: 0.75,
    dropDistance: 210,
    filesConvergeAt: 1.55,
    filesConvergeDuration: 0.6,
    filesShrinkAt: 1.65,
    filesFadeAt: 1.8,
    filesFadeDuration: 0.35,
    dropZoneHighlightStart: 1.45,
    dropZoneHighlightEnd: 2.6,
    dropZonePressStart: 2,
    dropZonePressEnd: 2.25,
    listAppearsAt: 3.1,
    listItemDelay: 0.15,
    buttonPressStart: 4.7,
    buttonPressEnd: 4.9,
    generatingStartsAt: 4.85,
    cursorAppearsAt: 0.6,
    cursorHidesAt: 5.1,
    cursorDropAt: 1.5,
    cursorMoveToButtonAt: 2.5,
    cursorInvisibleStart: 2,
    cursorInvisibleEnd: 4.1,
  },
  transitions: {
    screenMs: 500,
    railMs: 850,
    cardMs: 700,
    flipMs: 700,
    optionMs: 300,
    cursorMs: 700,
  },
  answers: {
    typingStart: 0.4,
    typingCharactersPerSecond: 28,
    multipleChoiceFirst: 0.8,
    multipleChoiceSecond: 1.55,
    multiSelectFirst: 0.65,
    multiSelectStep: 0.35,
    podcastProgressPerSecond: 23,
    podcastClockMultiplier: 3,
  },
  appearance: {
    inactiveCardOpacity: 0.34,
    inactiveCardScale: 0.95,
    card: "rounded-2xl border border-gray-200 bg-white p-5 text-slate-800",
    option:
      "flex h-[31px] items-center justify-between rounded-[8px] border px-3 text-[11px] transition-colors",
    correctOption: "border-green-500 bg-green-50/50 text-slate-800",
    idleOption: "border-neutral-200 bg-white text-gray-400",
  },
  files: [
    { kind: "doc", name: "Syllabus.docx", color: "#2563eb" },
    { kind: "pdf", name: "Lecture 1 — Cells.pdf", color: "#ef4444" },
    {
      kind: "video",
      name: "Introduction to Cellular Biology",
      color: "#f01828",
    },
    { kind: "mic", name: "Lecture Recording", color: "#8b5cf6" },
  ],
} as const;
const TOUR_STOPS = TOUR_CONFIG.timeline.stops;
const TOUR_HEIGHTS = TOUR_CONFIG.timeline.cardHeights;
const TOUR_FILES = TOUR_CONFIG.files;
function TourFileIcon({ kind, color }: { kind: string; color: string }) {
  return (
    <svg
      viewBox="0 0 32 36"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      {kind === "mic" ? (
        <>
          <rect x="12" y="3" width="8" height="19" rx="4" fill={color} />
          <path
            d="M8 16v3a8 8 0 0 0 16 0v-3M16 27v6m-5 0h10"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : kind === "video" ? (
        <>
          <rect x="2" y="9" width="28" height="20" rx="6" fill={color} />
          <path d="m13 14 8 5-8 5Z" fill="white" />
        </>
      ) : (
        <>
          <path
            d="M7 2h13l7 7v24H7Z"
            fill="white"
            stroke={color}
            strokeWidth="2"
          />
          <path d="M20 2v8h7" stroke={color} strokeWidth="2" />
          <rect x="2" y="15" width="25" height="13" rx="2" fill={color} />
          <text
            x="14.5"
            y="24"
            textAnchor="middle"
            fill="white"
            fontSize={kind === "pdf" ? "8" : "10"}
            fontWeight="800"
          >
            {kind === "pdf" ? "PDF" : "W"}
          </text>
        </>
      )}
    </svg>
  );
}
// Visual-only miniatures: the showcase clock drives every state.
// No application providers, audio requests or quiz side effects are needed.
function QuizPreviewHeader({
  number,
  title,
}: {
  number: number;
  title: string;
}) {
  return (
    <>
      <div className="mb-4 flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full ${i === 0 ? "bg-red-400" : i < number - 1 ? "bg-green-500" : i === number - 1 ? "bg-neutral-800" : "bg-neutral-200"}`}
          />
        ))}
      </div>
      <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-gray-500">
        Question {number} of 10
      </p>
      <h4 className="text-[16px] font-medium leading-[1.35] tracking-tight text-neutral-900">
        {title}
      </h4>
    </>
  );
}


function QuizPreviewFooter({
  done,
  explanation,
}: {
  done: boolean;
  explanation: string;
}) {
  return (
    <div className="mt-auto pt-3">
      <div
        className={`flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5 transition-opacity ${done ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDuration: `${TOUR_CONFIG.transitions.optionMs}ms` }}
      >
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />
        <div className="text-[10px] leading-4">
          <strong className="font-semibold text-green-800">Correct!</strong>
          <p className="text-slate-500">{explanation}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <span className="flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-[10px] font-medium text-white">
          {done ? "Next question" : "Check answer"}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}



function PreviewOption({
  label,
  selected,
}: {
  label: string;
  selected: boolean;
}) {
  return (
    <div
      className={`flex h-[33px] items-center gap-2.5 rounded-lg border px-3 text-[11px] transition-colors ${selected ? TOUR_CONFIG.appearance.correctOption : TOUR_CONFIG.appearance.idleOption}`}
      style={{ transitionDuration: `${TOUR_CONFIG.transitions.optionMs}ms` }}
    >
      <span
        className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${selected ? "border-green-600 bg-green-600 text-white" : "border-gray-200"}`}
      >
        {selected && <Check className="h-2.5 w-2.5" />}
      </span>
      {label}
    </div>
  );
}
function StudyPreview({
  index,
  seconds,
  answer,
}: {
  index: number;
  seconds: number;
  answer: (index: number, delay?: number) => boolean;
}) {
  if (index === 0)
    return (
      <>
        <p className="mb-3 text-[9px] font-medium uppercase tracking-[.12em] text-gray-400">
          Your study notes
        </p>
        <h4 className="text-[16px] font-semibold tracking-tight">
          The most important organelles of a cell
        </h4>
        <p className="mt-3 text-[12px] leading-5 text-gray-500">
          The nucleus stores genetic information, mitochondria release energy,
          and ribosomes build proteins. Together, these structures keep cells
          alive.
        </p>
      </>
    );
  if (index === 1)
    return (
      <div className="flex h-full flex-col">
        <p className="flex items-center gap-1.5 text-[9px] font-medium tracking-[.14em] text-gray-400">
          <Headphones className="h-3 w-3" /> YOUR STUDY PODCAST
        </p>
        <h4 className="mt-3 text-[16px] font-medium">
          Foundations of Biological Sciences
        </h4>
        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          Cellular chemistry, structure, and energy systems.
        </p>
        <div className="my-3 flex flex-col items-center gap-1">
          <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-blue-50 text-sm font-medium text-blue-600 ring-2 ring-blue-600">
            C
          </div>
          <span className="text-[10px]">Charlie</span>
          <span className="text-[8px] text-gray-400">Speaking</span>
        </div>
        <div className="flex h-10 items-center gap-[3px]">
          {Array.from({ length: 54 }, (_, i) => (
            <span
              key={i}
              className={`min-w-0 flex-1 rounded-full ${i / 54 < Math.min(1, 0.35 + (seconds * TOUR_CONFIG.answers.podcastProgressPerSecond) / 100) ? "bg-blue-600" : "bg-gray-200"}`}
              style={{ height: `${48 + ((i * 17 + (i % 3) * 11) % 50)}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[8px] tabular-nums text-slate-400">
          <span>
            02:
            {String(
              17 +
                Math.floor(
                  seconds * TOUR_CONFIG.answers.podcastClockMultiplier,
                ),
            ).padStart(2, "0")}
          </span>
          <span>03:52</span>
        </div>
        <div className="my-2 flex items-center justify-center gap-6 text-gray-500">
          <RotateCcw className="h-4 w-4" />
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
            <Pause className="h-3.5 w-3.5 fill-current" />
          </span>
          <RotateCw className="h-4 w-4" />
        </div>
        <div className="flex items-center justify-between text-gray-400">
          <span className="flex items-center gap-2">
            <Volume2 className="h-3 w-3" />
            <span className="h-0.5 w-10 rounded-full bg-gray-300" />
          </span>
          <span className="rounded bg-gray-50 px-2 py-1 text-[9px]">1x⌄</span>
        </div>
        <div className="-mx-5 -mb-5 mt-auto rounded-b-2xl border-t border-gray-100 bg-gray-50 px-3 py-2 text-center">
          <p className="text-[8px] tracking-widest text-slate-400">
            CURRENT CHAPTER
          </p>
          <p className="mt-1 text-[9px] text-slate-500">
            02 · Cellular Energy, Reproduction, and Genetics
          </p>
        </div>
      </div>
    );
  if (index === 2)
    return (
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1 [perspective:1000px]">
          <div
            className="absolute inset-0 transition-transform [transform-style:preserve-3d]"
            style={{
              transform: answer(2) ? "rotateX(180deg)" : "rotateX(0deg)",
              transitionDuration: `${TOUR_CONFIG.transitions.flipMs}ms`,
            }}
          >
            {[false, true].map((back) => (
              <div
                key={String(back)}
                className="absolute inset-0 flex flex-col rounded-xl border-2 border-gray-200 bg-white p-3 shadow-[0_2px_0_#e5e7eb] [backface-visibility:hidden]"
                style={{
                  transform: back ? "rotateX(180deg)" : "rotateX(0deg)",
                }}
              >
                <div className="flex justify-between text-gray-400">
                  <Pencil className="h-3.5 w-3.5" />
                  <Star className="h-3.5 w-3.5" />
                </div>
                <p className="m-auto px-3 text-center text-[22px] leading-[1.25] tracking-[-.035em] text-[#282e3e]">
                  {back
                    ? "Anabolism and catabolism"
                    : "What are the two main metabolic processes?"}
                </p>
                <div className="flex items-center text-[8px] text-slate-400">
                  <span className="flex-1 text-center">
                    {back ? "The answer" : "Click to reveal answer"}
                  </span>
                  <Volume2 className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[8px] text-slate-500">
          <span className="flex items-center gap-1">
            Track Progress{" "}
            <span className="h-3 w-5 rounded-full bg-slate-200 p-0.5">
              <span className="block h-2 w-2 rounded-full bg-white" />
            </span>
          </span>
          <span className="flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 rounded border border-gray-200 p-1" />
            01 / 10
            <ChevronRight className="h-5 w-5 rounded border border-gray-200 p-1" />
          </span>
          <Shuffle className="h-3 w-3" />
        </div>
      </div>
    );
  if (index === 3) {
    const text = "Mitochondria produce ATP.";
    const typed = text.slice(
      0,
      Math.max(
        0,
        Math.floor(
          (seconds - TOUR_CONFIG.answers.typingStart) *
            TOUR_CONFIG.answers.typingCharactersPerSecond,
        ),
      ),
    );
    const done = typed.length === text.length;
    return (
      <div className="flex h-full flex-col">
        <QuizPreviewHeader
          number={3}
          title="What is the main function of mitochondria?"
        />
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Explain the concept in your own words.
        </p>
        <p className="mb-1 mt-3 text-[9px] font-medium uppercase text-slate-600">
          Your answer
        </p>
        <div className="min-h-[54px] rounded-lg border-2 border-slate-200 p-2.5 text-[11px] shadow-[2px_2px_0_#e5e7eb]">
          {typed || <span className="text-gray-400">Write your answer…</span>}
        </div>
        <QuizPreviewFooter
          done={done}
          explanation="ATP provides energy for cellular processes."
        />
      </div>
    );
  }
  if (index === 4 || index === 7) {
    const first = index === 4;
    const labels = first
      ? ["Ribosomes", "Mitochondria", "Endoplasmic reticulum", "Lysosomes"]
      : ["Nucleus", "Mitochondria", "Ribosomes", "Golgi apparatus"];
    const selected = (i: number) =>
      first
        ? (i === 0 && answer(index, TOUR_CONFIG.answers.multipleChoiceFirst)) ||
          (i === 2 && answer(index, TOUR_CONFIG.answers.multipleChoiceSecond))
        : i !== 2 &&
          answer(
            index,
            TOUR_CONFIG.answers.multiSelectFirst +
              i * TOUR_CONFIG.answers.multiSelectStep,
          );
    const done = first ? selected(2) : selected(3);
    return (
      <div className="flex h-full flex-col">
        <QuizPreviewHeader
          number={first ? 3 : 5}
          title={
            first
              ? "Which organelles build and transport proteins?"
              : "Which structures are membrane-bound?"
          }
        />
        <div className="mt-4 space-y-2">
          {labels.map((label, i) => (
            <PreviewOption key={label} label={label} selected={selected(i)} />
          ))}
        </div>
        <QuizPreviewFooter
          done={done}
          explanation={
            first
              ? "Ribosomes build proteins; the ER helps transport them."
              : "The nucleus, mitochondria and Golgi have membranes."
          }
        />
      </div>
    );
  }
  if (index === 6)
    return (
      <div className="flex h-full flex-col">
        <QuizPreviewHeader
          number={4}
          title="The Golgi apparatus is responsible for energy production."
        />
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Is this statement true or false?
        </p>
        <div className="mt-5 flex justify-center gap-8">
          {[true, false].map((value) => (
            <div
              key={String(value)}
              className={`h-[122px] w-[98px] overflow-hidden rounded-xl border-2 bg-white transition-transform ${!value && answer(6) ? "border-red-500 shadow-[3px_3px_0_#fecaca]" : "border-slate-200 shadow-[3px_3px_0_#e5e7eb]"}`}
              style={{
                transform: `rotate(${value ? -5 : answer(6) ? 2 : 5}deg) translateY(${!value && answer(6) ? -3 : 0}px)`,
                transitionDuration: `${TOUR_CONFIG.transitions.optionMs}ms`,
              }}
            >
              <div
                className={`grid h-[50px] place-items-center ${value ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
              >
                {value ? (
                  <CheckCheck className="h-6 w-6" />
                ) : (
                  <X className="h-6 w-6" />
                )}
              </div>
              <div className="grid h-[68px] place-items-center text-lg font-semibold">
                {value ? "True" : "False"}
              </div>
            </div>
          ))}
        </div>
        <QuizPreviewFooter
          done={answer(6)}
          explanation="Mitochondria produce ATP; the Golgi packages proteins."
        />
      </div>
    );
  const done = answer(index);
  return (
    <div className="flex h-full flex-col">
      <QuizPreviewHeader
        number={index === 5 ? 4 : 6}
        title={
          index === 5
            ? "Complete the sentence about the nucleus."
            : "Complete the sentence about the cell membrane."
        }
      />
      <div className="mt-4 rounded-lg border-2 border-slate-200 p-3 text-[12px] leading-6 shadow-[2px_2px_0_#e5e7eb]">
        The{" "}
        <span
          className={`inline-block min-w-[90px] border-b px-2 text-center ${done ? "border-green-500 text-green-700" : "border-slate-300"}`}
        >
          {done ? (index === 5 ? "nucleus" : "cell membrane") : "\u00a0"}
        </span>{" "}
        {index === 5
          ? "stores genetic information."
          : "controls transport into and out of the cell."}
      </div>
      <QuizPreviewFooter
        done={done}
        explanation={
          index === 5
            ? "The nucleus contains the cell’s DNA."
            : "The cell membrane regulates what enters and leaves."
        }
      />
    </div>
  );
}
export default function StudyShowcase() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const visible = useRef(false);
  const elapsed = useRef(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const resize = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / TOUR_CONFIG.stage.width),
    );
    if (stage.current) resize.observe(stage.current);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
      },
      { threshold: TOUR_CONFIG.playback.visibilityThreshold },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      resize.disconnect();
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    let frame = 0;
    let previous = 0;
    let lastPaint = 0;
    // zegar działa co klatkę
    const tick = (now: number) => {
      if (previous && visible.current && !document.hidden) {
        elapsed.current =
          (elapsed.current +
            Math.min(now - previous, TOUR_CONFIG.playback.maxFrameDeltaMs) *
              TOUR_CONFIG.playback.speed) %
          TOUR_CONFIG.playback.durationMs;
      }
      previous = now;
      if (now - lastPaint > TOUR_CONFIG.playback.repaintEveryMs) {
        setTime(elapsed.current / 1000);
        lastPaint = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, reduced]);
  const t = reduced ? TOUR_CONFIG.playback.reducedMotionTime : time;
  const active = TOUR_STOPS.reduce(
    (value, stop, index) => (t >= stop ? index : value),
    0,
  );
  const local = t - TOUR_STOPS[active];
  const offset = TOUR_HEIGHTS.slice(0, active).reduce(
    (sum, h) => sum + h + TOUR_CONFIG.stage.cardGap,
    0,
  );
  const railY =
    TOUR_CONFIG.stage.height / 2 - TOUR_HEIGHTS[active] / 2 - offset;
  const learning = t >= TOUR_STOPS[0];
  const answer = (
    index: number,
    delay: number = TOUR_CONFIG.timeline.defaultAnswerDelay,
  ) => active > index || (active === index && local > delay);
  const card = TOUR_CONFIG.appearance.card;
  return (
    <div
      ref={root}
      className="mx-auto mt-14 max-w-[1280px] relative isolate"
      aria-label="Animated demonstration of Notium study materials"
    >
      <div className="absolute -top-[90px] left-8 w-[135px] !z-0">
        <Mascot expression="look" />
      </div>

      <div className="relative z-10 grid items-center gap-9 rounded-[24px] bg-[#f5f6fa] p-5 sm:p-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
        <div className="flex gap-5 lg:flex-col lg:gap-8">
          {[
            {
              title: "Upload anything",
              body: "Lectures, PDFs, YouTube videos, or your own notes — Notium understands it all.",
            },
            {
              title: "Learn it the fun way",
              body: "Generate activities, quizzes, and podcasts that make studying feel effortless.",
            },
          ].map((item, index) => (
            <div
              onClick={() => {
                if (index === 0) {
                  elapsed.current = 0;
                  setTime(0);
                  setPaused(false);
                  setReduced(false);
                } else {
                  const learningStart = TOUR_STOPS[0];
                  elapsed.current = learningStart * 1000;
                  setTime(learningStart);
                  setPaused(false);
                  setReduced(false);
                }
              }}
              key={item.title}
              className={`flex-1 border-l-[3px] pl-4 cursor-pointer
                    ${Number(learning) === index ? "border-gray-800 text-gray-800 transition-colors duration-500" : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"}`}
            >
              <h3 className="text-base font-semibold tracking-tight sm:text-[25px]">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed sm:text-[14px] sm:leading-6">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div
          ref={stage}
          className="relative w-full min-w-0"
          style={{ height: TOUR_CONFIG.stage.height * scale }}
        >
          <div
            className="absolute left-0 top-0 overflow-hidden rounded-[11px] border border-gray-200 bg-white font-sans text-[#303030] shadow-[0_16px_28px_-15px_#25253555]"
            style={{
              width: TOUR_CONFIG.stage.width,
              height: TOUR_CONFIG.stage.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                opacity:
                  t > TOUR_CONFIG.timeline.fadeOutStart
                    ? Math.max(
                        0,
                        (TOUR_CONFIG.timeline.fadeOutEnd - t) /
                          (TOUR_CONFIG.timeline.fadeOutEnd -
                            TOUR_CONFIG.timeline.fadeOutStart),
                      )
                    : 1,
              }}
            >
              <div
                className="absolute inset-0 transition-[opacity,transform]"
                style={{
                  opacity: learning ? 0 : 1,
                  transform: learning ? "translateY(-45px)" : "translateY(0)",
                  transitionDuration: `${TOUR_CONFIG.transitions.screenMs}ms`,
                }}
              >
                <div
                  className="absolute left-[60px] top-[122px] flex h-[226px] w-[440px] flex-col items-center justify-center rounded-[18px] border-2 border-dashed transition-all duration-300"
                  style={{
                    opacity: t < TOUR_CONFIG.upload.listAppearsAt ? 1 : 0,
                    borderColor:
                      t > TOUR_CONFIG.upload.dropZoneHighlightStart &&
                      t < TOUR_CONFIG.upload.dropZoneHighlightEnd
                        ? "#93b4ff"
                        : "#e5e7eb",
                    background:
                      t > TOUR_CONFIG.upload.dropZoneHighlightStart &&
                      t < TOUR_CONFIG.upload.dropZoneHighlightEnd
                        ? "#eff6ff"
                        : "#fafafa",
                    transform:
                      t > TOUR_CONFIG.upload.dropZonePressStart &&
                      t < TOUR_CONFIG.upload.dropZonePressEnd
                        ? "scale(.98)"
                        : "scale(1)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="mb-3 h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M12 16V3m-5 5 5-5 5 5M5 14v6h14v-6" />
                  </svg>
                  <p className="text-[14px] font-semibold">Drop files here</p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    PDFs, videos, recordings, and more
                  </p>
                </div>

                {TOUR_FILES.map((file, index) => (
                  <div
                    key={`${file.kind}-${Math.floor(time / (TOUR_CONFIG.playback.durationMs / 1000))}`}
                    className="absolute top-[47px] h-[60px] w-[58px] rounded-[10px] border border-gray-100 bg-white p-[13px] shadow-[0_5px_10px_#0000000c]"
                    style={{
                      left: 125 + index * 82,
                      opacity:
                        t < TOUR_CONFIG.upload.filesAppearDuration
                          ? t / TOUR_CONFIG.upload.filesAppearDuration
                          : t < TOUR_CONFIG.upload.filesConvergeAt
                            ? 1
                            : Math.max(
                                0,
                                1 -
                                  (t - TOUR_CONFIG.upload.filesFadeAt) /
                                    TOUR_CONFIG.upload.filesFadeDuration,
                              ),
                      transform: `translate(${
                        t > TOUR_CONFIG.upload.filesConvergeAt
                          ? (1.5 - index) *
                            Math.min(
                              1,
                              (t - TOUR_CONFIG.upload.filesConvergeAt) /
                                TOUR_CONFIG.upload.filesConvergeDuration,
                            ) *
                            13
                          : 0
                      }px, ${
                        t < TOUR_CONFIG.upload.dropStart
                          ? Math.sin(t * 3 + index) * 3
                          : Math.min(
                              1,
                              (t - TOUR_CONFIG.upload.dropStart) /
                                TOUR_CONFIG.upload.dropDuration,
                            ) **
                              2 *
                            TOUR_CONFIG.upload.dropDistance
                      }px) rotate(${[-9, -3, 5, 10][index]}deg) scale(${t < TOUR_CONFIG.upload.filesShrinkAt ? 1 : Math.max(0.45, 1 - (t - TOUR_CONFIG.upload.filesShrinkAt))})`,
                    }}
                  >
                    <TourFileIcon {...file} />
                  </div>
                ))}

                <div
                  className="absolute left-[60px] top-[90px] w-[440px] transition-opacity"
                  style={{
                    opacity: t >= TOUR_CONFIG.upload.listAppearsAt ? 1 : 0,
                    transitionDuration: `${TOUR_CONFIG.transitions.optionMs}ms`,
                  }}
                >
                  {TOUR_FILES.map((file, index) => (
                    <div
                      key={file.kind}
                      className="mb-[10px] flex h-[39px] items-center gap-3 rounded-[5px] border border-gray-200 px-3 transition-[transform,opacity]"
                      style={{
                        opacity:
                          t >
                          TOUR_CONFIG.upload.listAppearsAt +
                            index * TOUR_CONFIG.upload.listItemDelay
                            ? 1
                            : 0,
                        transform:
                          t >
                          TOUR_CONFIG.upload.listAppearsAt +
                            index * TOUR_CONFIG.upload.listItemDelay
                            ? "translateY(0)"
                            : "translateY(12px)",
                        transitionDuration: `${TOUR_CONFIG.transitions.optionMs}ms`,
                      }}
                    >
                      <span className="h-[21px] w-[19px]">
                        <TourFileIcon {...file} />
                      </span>
                      <span className="text-[11px]">{file.name}</span>
                      <span className="ml-auto text-gray-400">
                        <Check size={14} />
                      </span>
                    </div>
                  ))}
                  <div
                    className={`mt-5 flex h-[43px] items-center justify-center gap-2 rounded-[8px] bg-blue-100 text-[12px] font-medium
                         text-blue-900 transition-transform ${t > TOUR_CONFIG.upload.buttonPressStart && t < TOUR_CONFIG.upload.buttonPressEnd ? "scale-[.97]" : "scale-100"}`}
                  >
                    {t > TOUR_CONFIG.upload.generatingStartsAt ? (
                      <>
                        <span
                          className="nt-tour-spinner inline-block h-3 w-3 rounded-full border-2 border-blue-300 border-t-blue-700"
                          style={{
                            animationPlayState: paused ? "paused" : "running",
                          }}
                        />
                        Generating study materials…
                      </>
                    ) : (
                      "Generate study materials"
                    )}
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-0 transition-opacity"
                style={{
                  opacity: learning ? 1 : 0,
                  transitionDuration: `${TOUR_CONFIG.transitions.screenMs}ms`,
                }}
              >
                <div
                  className="absolute top-0 flex flex-col transition-transform ease-[cubic-bezier(.65,0,.25,1)] will-change-transform"
                  style={{
                    left: TOUR_CONFIG.stage.cardInsetX,
                    right: TOUR_CONFIG.stage.cardInsetX,
                    gap: TOUR_CONFIG.stage.cardGap,
                    transform: `translateY(${learning ? railY : TOUR_CONFIG.stage.height + TOUR_CONFIG.stage.offscreenMargin}px)`,
                    transitionDuration: `${TOUR_CONFIG.transitions.railMs}ms`,
                  }}
                >
                  {TOUR_HEIGHTS.map((height, index) => (
                    <div
                      key={index}
                      className={`${card} shrink-0 transition-[opacity,transform]`}
                      style={{
                        height,
                        opacity:
                          index === active
                            ? 1
                            : TOUR_CONFIG.appearance.inactiveCardOpacity,
                        transform:
                          index === active
                            ? "scale(1)"
                            : `scale(${TOUR_CONFIG.appearance.inactiveCardScale})`,
                        transitionDuration: `${TOUR_CONFIG.transitions.cardMs}ms`,
                      }}
                    >
                      <StudyPreview
                        index={index}
                        seconds={Math.max(
                          0,
                          (active > index ? (TOUR_STOPS[index + 1] ?? t) : t) -
                            TOUR_STOPS[index],
                        )}
                        answer={answer}
                      />
                    </div>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[65px] bg-gradient-to-b from-white to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[65px] bg-gradient-to-t from-white to-transparent" />
              </div>

              {!learning &&
                t > TOUR_CONFIG.upload.cursorAppearsAt &&
                t < TOUR_CONFIG.upload.cursorHidesAt && (
                  <svg
                    viewBox="0 0 24 28"
                    className="absolute h-[24px] w-[21px] drop-shadow-sm transition-[left,top,opacity]"
                    style={{
                      left:
                        t < TOUR_CONFIG.upload.cursorMoveToButtonAt ? 260 : 298,
                      top:
                        t < TOUR_CONFIG.upload.cursorDropAt
                          ? 90
                          : t < TOUR_CONFIG.upload.cursorMoveToButtonAt
                            ? 245
                            : 326,
                      opacity:
                        t > TOUR_CONFIG.upload.cursorInvisibleStart &&
                        t < TOUR_CONFIG.upload.cursorInvisibleEnd
                          ? 0
                          : 1,
                      transitionDuration: `${TOUR_CONFIG.transitions.cursorMs}ms`,
                    }}
                  >
                    <path
                      d="m3 2 2 21 5-7 8-1Z"
                      fill="white"
                      stroke="#374151"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-4 text-xs text-gray-500">
        <span className="mr-auto">
          {reduced ? "Study materials preview" : "Automatic product demo"}
        </span>

        {!reduced && (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="rounded px-2 py-1 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={paused ? "Play presentation" : "Pause presentation"}
          >
            {paused ? "Play" : "Pause"}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            elapsed.current = 0;
            setTime(0);
            setPaused(false);
            setReduced(false);
          }}
          className="rounded px-2 py-1 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Replay
        </button>
      </div>
    </div>
  );
}
