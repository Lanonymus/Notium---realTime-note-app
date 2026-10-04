import { animate, motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { ReactNode, useEffect, useState } from "react";

// Each card finishes before the next one mounts.
const COUNT_DURATION_SECONDS = 0.3;
const CARD_ENTER_SECONDS = 0.18;
const DIGIT_DURATION_MS = 500;
const BETWEEN_CARDS_MS = 140;

type StatCardProps = {
  label: string;
  icon: ReactNode;
  target: number | null;
  kind?: "number" | "experience" | "time";
  active: boolean;
  reducedMotion: boolean;
  onComplete: () => void;
  isAfterAnimation: boolean
};

export default function StatCard({
  label,
  icon,
  target,
  kind = "number",
  active,
  reducedMotion,
  onComplete,
  isAfterAnimation
}: StatCardProps) {
  const [value, setValue] = useState(0);
  const skipAnimation = reducedMotion || isAfterAnimation;


  useEffect(() => {
    if (skipAnimation) return;

    let cancelled = false;
    let nextCardTimer: ReturnType<typeof setTimeout> | undefined;
    const animation = animate(0, 1, {
      // Missing time and a zero result still get a brief highlighted moment.
      duration: target === null || target === 0 ? 0.25 : COUNT_DURATION_SECONDS,
      delay: CARD_ENTER_SECONDS,
      ease: [0.25, 0.1, 0.25, 1],

      onUpdate: (progress) => {
        if (!cancelled) setValue(Math.floor((target ?? 0) * progress));
      },

      onComplete: () => {
        if (cancelled) return;
        setValue(target ?? 0);
        // Let the last NumberFlow transition settle before revealing another card.
        nextCardTimer = setTimeout(() => {
          if (!cancelled) onComplete();
        }, DIGIT_DURATION_MS + BETWEEN_CARDS_MS);
      },
    });

    return () => {
      cancelled = true;
      animation.stop();
      clearTimeout(nextCardTimer);
    };
  }, [target, skipAnimation , onComplete]);

  const displayedValue = skipAnimation ? (target ?? 0) : value;

  const numberProps = {
    animated: !skipAnimation,
    spinTiming: { duration: DIGIT_DURATION_MS, easing: "linear" },
    transformTiming: { duration: DIGIT_DURATION_MS, easing: "linear" },
    opacityTiming: { duration: 50, easing: "linear" },
  };

  const finalText =
    target === null
      ? "Not available"
      : kind === "time"
      ? `${Math.floor(target / 60)} minutes ${target % 60} seconds`
      : kind === "experience"
      ? `+${target} XP`
      : String(target);

  return (
    <motion.div
      initial={skipAnimation ? false : { opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: skipAnimation ? 0 : CARD_ENTER_SECONDS,
        ease: "easeOut",
      }}
      className={`flex min-h-[96px] min-w-0 flex-col justify-between rounded-[10px] border-2 bg-white px-2.5 py-3 transition-colors duration-150 sm:px-5 lg:px-7 ${
        active && !skipAnimation
          ? "border-blue-600 ring-2 ring-blue-600/10"
          : "border-gray-200 hover:bg-neutral-50"
      }`}
      style={{ flex: "0 0 calc((100% - 2 * var(--stat-gap)) / 3)" }}
    >
      <dt className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.06em] text-gray-400 sm:gap-2 sm:text-[11px]">
        <span className="shrink-0">{icon}</span>
        {label}
      </dt>

      <dd className="mt-2 text-xl font-semibold tabular-nums text-[#202532] sm:text-2xl">
        <span className="sr-only">{finalText}</span>
        <span aria-hidden="true" className="flex flex-wrap items-baseline gap-x-1">
          {target === null ? (
            "—"
          ) : kind === "time" ? (
            <>
              <span className="whitespace-nowrap">
                <NumberFlow value={Math.floor(displayedValue / 60)} {...numberProps} />
                <span className="ml-0.5 text-sm font-medium sm:text-lg">m</span>
              </span>

              <span className="whitespace-nowrap">
                <NumberFlow
                  value={Math.floor(displayedValue % 60)}
                  format={{ minimumIntegerDigits: 2 }}
                  {...numberProps}
                />
                <span className="ml-0.5 text-sm font-medium sm:text-lg">s</span>
              </span>
            </>
          ) : (
            <>
              <NumberFlow
                value={displayedValue}
                prefix={kind === "experience" ? "+" : undefined}
                {...numberProps}
              />
              {kind === "experience" && (
                <span className="text-sm font-medium text-gray-400">XP</span>
              )}
              {kind === "number" && (
                <span className="text-sm font-medium text-gray-400">Questions</span>
              )}
            </>
          )}
        </span>
      </dd>
    </motion.div>
  );
}