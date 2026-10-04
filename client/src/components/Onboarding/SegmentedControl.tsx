import { motion } from "framer-motion";
import { useEffect, useRef } from "react";



export default function SegmentedProgress({
  value,
  reducedMotion,
}: {
  value: number;
  reducedMotion: boolean;
}) {
  const segmentCount = 3;
  const previousValue = useRef(value);
  const previousUnits = previousValue.current * segmentCount;
  const nextUnits = value * segmentCount;
  const distance = Math.abs(nextUnits - previousUnits);
  const movingForward = nextUnits >= previousUnits;
  // Early steps move quickly and later steps settle more calmly.
  const totalDuration = reducedMotion ? 0 : 0.42 + value * 0.18;

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return (
    <div
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="grid h-2 w-full grid-cols-3 gap-1"
    >
      {Array.from({ length: segmentCount }, (_, segmentIndex) => {
        const previousFill = Math.min(
          1,
          Math.max(0, previousUnits - segmentIndex),
        );
        const nextFill = Math.min(1, Math.max(0, nextUnits - segmentIndex));
        const changedDistance = Math.abs(nextFill - previousFill);

        let delay = 0;
        if (distance > 0 && changedDistance > 0) {
          const distanceBeforeSegment = movingForward
            ? Math.max(0, segmentIndex - previousUnits)
            : Math.max(0, previousUnits - (segmentIndex + 1));
          delay = (distanceBeforeSegment / distance) * totalDuration;
        }

        const duration =
          distance > 0
            ? (changedDistance / distance) * totalDuration
            : 0;

        return (
          <div
            key={segmentIndex}
            className="overflow-hidden rounded-full bg-[#E5E5E5]"
          >
            <motion.div
              className="h-full rounded-full bg-blue-600"
              initial={false}
              animate={{ width: `${nextFill * 100}%` }}
              transition={{
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        );
      })}
    </div>
  );
}