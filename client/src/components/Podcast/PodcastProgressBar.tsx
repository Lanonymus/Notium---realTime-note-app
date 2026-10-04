import { SetStateAction, useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PodcastGenerationSettings } from "./PodcastGenerateScreen";


type Level = {
  id: string;
  label: string;
  description: string;
}

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

type levelTypes = "beginner" | "intermediate" | "advanced" | "expert";

type DifficultyProgressBarProps = {
  busy?: boolean;
  level: string;
  onSetLevel: React.Dispatch<SetStateAction<levelTypes>>;
  currentLevel: Level;
  difficultyIndex: number;    
}


export default function PodcastProgressBar({
  busy,
  level,
  onSetLevel,
  currentLevel,
  difficultyIndex     
}: DifficultyProgressBarProps) {

    // wartości zwiazane z levelem ciężkości
    const uid = useId();    
    const [complete, setComplete] = useState(false);    
    const reducedMotion = useReducedMotion();
    const difficultyProgress = (difficultyIndex / (LEVELS.length - 1)) * 100;
    const difficultyTransition = reducedMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 300, damping: 28 };

    const [hoveredCheckpoint, setHoveredCheckpoint] = useState<number | null>(
      null,
    );

    const [isThumbHovered, setIsThumbHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    
    return (
        <>
          <div className="min-w-0">
            <div className="mb-3 flex h-5 items-center justify-between gap-2">
              <label
                htmlFor={`${uid}-difficulty`}
                className="text-sm font-semibold"
              >
                Topic familiarity
              </label>

              <span
                className="relative flex h-5 w-[108px] shrink-0 items-center justify-end overflow-hidden"
                aria-hidden="true"
              >
                {/* animatePresence pozwala starym komponentem wyjść z DOMU i bezpiecznie wprowadzić animacje nowego */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={level}
                    initial={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
                    transition={{ duration: reducedMotion ? 0 : 0.12 }}
                    className="text-xs font-medium text-gray-500"
                  >
                    {currentLevel.label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>

            {/* 28 px tor i biała gałka; 44 px obszaru dotykowego. */}
            <div
              className={`relative flex h-11 w-full items-center rounded-full ${busy ? "opacity-60" : ""}`}
            >
              <input
                id={`${uid}-difficulty`}
                type="range"
                min={0}
                max={LEVELS.length - 1}
                step={1}
                value={difficultyIndex}
                disabled={busy}
                aria-valuetext={`${currentLevel.label}, ${difficultyIndex + 1} of ${LEVELS.length}`}
                aria-describedby={`${uid}-difficulty-help`}
                onChange={(event) => {
                  const selected = LEVELS[Number(event.target.value)];

                  if (!selected) return;

                  onSetLevel(selected.id);
                  setComplete(false);
                }}
                onPointerMove={(event) => {
                  if (event.pointerType === "touch") return;

                  const rect = event.currentTarget.getBoundingClientRect();

                  // Gałka ma 32 px, więc jej środek startuje 16 px od brzegu.
                  const inset = 16;
                  const travel = Math.max(1, rect.width - inset * 2);
                  const x = event.clientX - rect.left;

                  const nearestIndex = Math.max(
                    0,
                    Math.min(
                      LEVELS.length - 1,
                      Math.round(
                        ((x - inset) / travel) * (LEVELS.length - 1),
                      ),
                    ),
                  );

                  const checkpointX =
                    inset + (nearestIndex / (LEVELS.length - 1)) * travel;

                  // Wygodniejszy obszar trafienia niż sama kropka.
                  setHoveredCheckpoint(
                    Math.abs(x - checkpointX) <= 10 ? nearestIndex : null,
                  );

                  const thumbX =
                    inset + (difficultyProgress / 100) * travel;
                  setIsThumbHovered(Math.abs(x - thumbX) <= 16);
                }}
                onPointerLeave={() => {
                  setHoveredCheckpoint(null);
                  setIsThumbHovered(false);
                }}
                onPointerDown={(event) => {
                  if (!event.isPrimary || event.button !== 0) return;

                  event.currentTarget.setPointerCapture(event.pointerId);
                  setIsDragging(true);
                }}
                onPointerUp={() => setIsDragging(false)}
                onPointerCancel={() => {
                  setIsDragging(false);
                  setIsThumbHovered(false);
                  setHoveredCheckpoint(null);
                }}
                onLostPointerCapture={() => setIsDragging(false)}
                onBlur={() => {
                  setIsDragging(false);
                  setIsThumbHovered(false);
                  setHoveredCheckpoint(null);
                }}
                className="peer absolute inset-0 z-20 m-0 h-full w-full cursor-pointer appearance-none rounded-full bg-transparent
                  outline-none disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-7 [&::-webkit-slider-runnable-track]:rounded-full
                  [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-0 [&::-webkit-slider-thumb]:h-7
                  [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:h-7
                  [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-progress]:bg-transparent
                  [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:bg-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-2 h-7 overflow-hidden rounded-full
                  bg-gray-200 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-4"
              >
                <motion.div
                  initial={false}
                  // Środek gałki: 14 px + postęp * (szerokość toru - 28 px).
                  animate={{
                    width: `calc(${difficultyProgress}% + ${- difficultyProgress * 0.28}px + ${difficultyProgress > 0 ? 20 : 0}px)`,
                  }}
                  transition={difficultyTransition}
                  className="h-full rounded-full bg-blue-600"
                />
              </div>

              {/* STYLOWANIE MAŁYCH SZARYCH KROPECZEK - CHECKPOINTÓW */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[14px] top-1/2 flex -translate-y-1/2 items-center justify-between"
              >
                {LEVELS.map((item, index) => (
                  <motion.span
                    key={item.id}
                    initial={false}
                    animate={{
                      scale: hoveredCheckpoint === index ? 1.75 : 1,
                    }}
                    transition={{ duration: reducedMotion ? 0 : 0.15 }}
                    className={`block h-1 w-1 rounded-full ${
                      index <= difficultyIndex
                        ? "bg-white/40"
                        : "bg-gray-400/60"
                    }`}
                  />
                ))}
              </div>

              {/*  STYLOWANIE GAŁY */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[16px] top-1/2 h-0"
              >
                <motion.span
                  initial={false}
                  animate={{
                    left: `${difficultyProgress}%`,
                    height: "36px",
                    width: "36px",
                  }}
                  transition={difficultyTransition}
                  className="absolute top-0 h-0 w-0"
                >
                  {/* Ten element tylko centruje gałkę */}
                  <span className="absolute -translate-x-1/2 -translate-y-1/2">
                    {/* Ten element faktycznie się powiększa */}
                    <motion.span
                      initial={false}
                      animate={{
                        scale: isThumbHovered || isDragging ? 1.125 : 1,
                      }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.15,
                      }}
                      className="
                        block h-8 w-8 rounded-full
                        border border-gray-200 bg-white shadow-sm
                      "
                    />
                  </span>
                </motion.span>
              </div>
            </div>
            
            <p id={`${uid}-difficulty-help`} className="sr-only">
              {currentLevel.description} Use the arrow keys to change the
              level.
            </p>
          </div>     
        </>
    )
}