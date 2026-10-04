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


type Level = {
  id: string;
  label: string;
  description: string;
}

const LEVELS = [
  {
    id: "Easy",
    label: "Easy",
    description: "Simple keywords, short flashcard descriptions",
  },
  {
    id: "Medium",
    label: "Medium",
    description: "Simple sentences and simple answers",
  },
  {
    id: "Hard",
    label: "Hard",
    description: "Advanced sentences and more descriptive answers. ",
  },
  {
    id: "Extreme",
    label: "Extreme",
    description: "Proffesional terminology, very accurate descriptions, and more complex flashcards",
  },
] as const;

type levelTypes = "Easy" | "Medium" | "Hard" | "Extreme";

type DifficultyProgressBarProps = {
  level: string;
  onSetLevel: React.Dispatch<SetStateAction<levelTypes>>;
  currentLevel: Level;
  difficultyIndex: number;    
}


export default function FlashcardsProgressBar({
  level,
  onSetLevel,
  currentLevel,
  difficultyIndex     
}: DifficultyProgressBarProps) {

    // wartości zwiazane z levelem ciężkości
    const uid = useId();    
    const reducedMotion = useReducedMotion();
    const difficultyTransition = reducedMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 300, damping: 28 };
   
    const progress = difficultyIndex / (LEVELS.length - 1);
    const progressPercent = `${progress * 100}%`;

return (
  <div className="w-full min-w-0">
    <div className="mb-2.5 flex items-start justify-between gap-4">
      <div>
        <label
          htmlFor={`${uid}-difficulty`}
          className="text-sm font-semibold text-neutral-800"
        >
          Difficulty
        </label>

        <p className="mt-0.5 text-[11px] text-neutral-400">
          How complex should flashcards be ?
        </p>
      </div>


    </div>

    <div className="rounded-xl border border-neutral-200/80 bg-white px-3.5 py-3">
      <div className="relative h-9">
        <input
          id={`${uid}-difficulty`}
          type="range"
          min={0}
          max={LEVELS.length - 1}
          step={1}
          value={difficultyIndex}
          aria-label="Topic familiarity"
          aria-valuetext={`${currentLevel.label}, ${difficultyIndex + 1} of ${LEVELS.length}`}
          aria-describedby={`${uid}-difficulty-help`}
          onChange={(event) => {
            const selected = LEVELS[Number(event.currentTarget.value)];
            if (selected) onSetLevel(selected.id);
          }}
          className="
            peer absolute inset-0 z-20 m-0 h-full w-full cursor-pointer
            appearance-none bg-transparent outline-none
            focus-visible:outline-none
            [&::-webkit-slider-runnable-track]:h-9
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:h-9
            [&::-webkit-slider-thumb]:w-9
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:bg-transparent
            [&::-moz-range-track]:h-9
            [&::-moz-range-track]:bg-transparent
            [&::-moz-range-thumb]:h-9
            [&::-moz-range-thumb]:w-9
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:bg-transparent
          "
        />

        {/* Tor */}
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neutral-100">
          <motion.div
            initial={false}
            animate={{ width: progressPercent }}
            transition={difficultyTransition}
            className="h-full rounded-full bg-blue-600"
          />
        </div>

        {/* Punkty poziomów i gałka */}
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-0 -translate-y-1/2">
          {LEVELS.map((item, index) => (
            <motion.span
              key={item.id}
              initial={false}
              animate={{
                left: `${(index / (LEVELS.length - 1)) * 100}%`,
                scale: index === difficultyIndex ? 1.25 : 1,
              }}
              transition={difficultyTransition}
              className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                index <= difficultyIndex
                  ? "bg-white ring-2 ring-offset-1 ring-blue-600"
                  : "bg-neutral-300"
              }`}
            />
          ))}

          <motion.span
            initial={false}
            animate={{ left: progressPercent }}
            transition={difficultyTransition}
            className="
              absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2
              rounded-full border border-neutral-200 bg-white
              shadow-[0_2px_8px_rgba(15,23,42,0.12)]
              ring-4 ring-blue-500/10
            "
          />
        </div>
      </div>

        {/* Poprawiony kontener z napisami */}
        <div className="relative mx-2 mt-3 h-4 text-[11px] text-neutral-400">
            {LEVELS.map((item, index) => {

                const isLast = index / (LEVELS.length - 1) === 1
                const isFirst = index === 0

                
                return (
                    <span
                        key={item.id}
                        className={`absolute top-0 ${isLast ? "-translate-x-[90%]" : isFirst ? "-translate-x-[20%]" : "-translate-x-1/2"} whitespace-nowrap text-center transition-colors ${
                        index === difficultyIndex
                            ? "font-semibold text-blue-600"
                            : ""
                        }`}
                        style={{ left: `${(index / (LEVELS.length - 1)) * 100}%` }}
                    >
                        {item.label}
                    </span>                    
                )
            })}
        </div>
    </div>

  </div>
);
}