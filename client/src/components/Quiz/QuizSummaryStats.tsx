import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { BookOpen, Clock3 } from "lucide-react";
import { animate, motion, useReducedMotion } from "framer-motion";
import StatCard from "./StatCard";



type QuizSummaryStatsProps = {
  reviewCount: number;
  experience: number;
  timeInSeconds: number | null;
  isAfterAnimation: boolean;
};

const SharpLightning = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M13 2L3 14h7v8l11-12h-7V2z" />
  </svg>
);



export default function QuizSummaryStats({
  reviewCount,
  experience,
  timeInSeconds,
  isAfterAnimation
}: QuizSummaryStatsProps) {
  
  const reviews = normalizeCount(reviewCount);
  const xp = normalizeCount(experience);
  const seconds = timeInSeconds === null ? null : normalizeCount(timeInSeconds);

  // New results restart the sequence; ordinary parent rerenders do not.
  return (
    <StatsSequence
      key={`${reviews}:${xp}:${seconds}`}
      reviewCount={reviews}
      experience={xp}
      timeInSeconds={seconds}
      isAfterAnimation={isAfterAnimation}
    />
  );
}




function StatsSequence({ 
  reviewCount, 
  experience, 
  timeInSeconds,
  isAfterAnimation
}: QuizSummaryStatsProps) {
  
  const reducedMotion = useReducedMotion() ?? false;
  const [activeCard, setActiveCard] = useState(0);
  const advance = useCallback(() => {
    setActiveCard((current) => Math.min(current + 1, 3));
  }, []);

  const cards = [
    {
      label: "To revisit",
      icon: <BookOpen aria-hidden="true" className="h-4 w-4 text-gray-500" />,
      target: reviewCount,
      kind: "number" as const,
    },
    {
      label: "Experience",
      icon: <SharpLightning className="h-4 w-4 text-blue-600" />,
      target: experience,
      kind: "experience" as const,
    },
    {
      label: "Study time",
      icon: <Clock3 aria-hidden="true" className="h-4 w-4 text-gray-500" />,
      target: timeInSeconds,
      kind: "time" as const,
    },
  ];

  return (
    <section aria-label="Session statistics">
      <dl className="flex min-h-[96px] w-full items-stretch gap-[var(--stat-gap)] [--stat-gap:8px] sm:[--stat-gap:12px]">
        {cards.map((card, index) =>
          isAfterAnimation || reducedMotion || index <= activeCard ? (
            <StatCard
              key={card.label}
              {...card}
              active={index === activeCard}
              reducedMotion={reducedMotion}
              isAfterAnimation={isAfterAnimation}
              onComplete={advance}
            />
          ) : null
        )}
      </dl>
    </section>
  );
}

const normalizeCount = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;



