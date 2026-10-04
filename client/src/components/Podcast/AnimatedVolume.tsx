import NumberFlow from "@number-flow/react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
} from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";



type AnimatedVolumeProps = {
  volume: number;
  onVolumeChange: (value: number) => void;
};

export default function AnimatedVolume({
  volume,
  onVolumeChange,
}: AnimatedVolumeProps) {
  const reduceMotion = useReducedMotion();

  const value = Math.max(0, Math.min(1, volume));
  const percentage = Math.round(value * 100);
  const [isDragging, setIsDragging] = useState(false);

  // Suwak ma 64 px szerokości, a uchwyt 12 px.
  // Środek uchwytu porusza się więc na odcinku 52 px.
  const thumbX = useMotionValue(value * 52);

  // Dymek podąża za uchwytem z niewielką bezwładnością.
  const bubbleX = useSpring(thumbX, {
    stiffness: 500,
    damping: 28,
    mass: 0.45,
  });

  // Prędkość ruchu dymka, a nie sama wartość głośności.
  const velocity = useVelocity(bubbleX);

  const targetRotation = useTransform(
    velocity,
    [-350, 0, 350],
    [14, 0, -14],
    { clamp: true },
  );

  // Sprężyna wygładza przechył oraz powrót do pionu.
  const rotation = useSpring(targetRotation, {
    stiffness: 350,
    damping: 22,
    mass: 0.5,
  });

  // aktualizacja z innego miejsca głościoności   
  useEffect(() => {
    thumbX.set(value * 52);
  }, [value, thumbX]);

  // zmiana głośności
  const updateVolume = (next: number) => {
    thumbX.set(next * 52);
    onVolumeChange(next);
  };

  return (
    <div className="flex items-center gap-[3px] text-gray-500/90">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onVolumeChange(value ? 0 : 0.8)}
        aria-label={value ? "Mute" : "Unmute"}
      >
        {value ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </Button>

      <div className="relative h-10 w-16 shrink-0">
        {/* Tło i wypełnienie toru */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-x-[6px]
            top-1/2 h-[3px] -translate-y-1/2
            overflow-hidden rounded-full bg-gray-200
          "
        >
          <div
            className="h-full rounded-full bg-gray-400"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Uchwyt reaguje natychmiast */}
        <motion.div
          aria-hidden="true"
          className="
            pointer-events-none absolute left-[6px]
            top-1/2 h-0 w-0
          "
          style={{ x: thumbX }}
        >
            {/* Gała */}
            <span
                className="
                absolute left-0 top-0 h-3 w-3
                -translate-x-1/2 -translate-y-1/2
                rounded-full bg-gray-400
                "
            />
        </motion.div>

        {/* Dymek podąża z opóźnieniem */}
        <motion.div
          aria-hidden="true"
          className="
            pointer-events-none absolute
            left-[6px] top-[-18px] w-0
          "
          style={{ x: reduceMotion ? thumbX : bubbleX }}
          initial={false}
          animate={{
            opacity: isDragging ? 1 : 0,
            y: reduceMotion ? 0 : isDragging ? 0 : 5,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.15,
            ease: "easeOut"
          }}
        >
          {/* Centrowanie oddzielone od obrotu */}
          <div className="flex w-0 justify-center">
            <motion.div
              className="
                relative flex h-7 min-w-8 shrink-0
                items-center justify-center rounded-md
                bg-gray-400 px-1.5
                text-xs font-semibold tabular-nums text-white
                shadow-sm
              "
              style={{
                rotate: reduceMotion ? 0 : rotation,
                transformOrigin: "50% 38px",
              }}
            >
              <NumberFlow
                value={percentage}
                animated={!reduceMotion}
                format={{
                  useGrouping: false,
                  maximumFractionDigits: 0,
                }}
                transformTiming={{
                  duration: 250,
                  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                spinTiming={{
                  duration: 350,
                  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                opacityTiming={{
                  duration: 150,
                  easing: "ease-out",
                }}
                className="text-xs font-semibold tabular-nums"
              />

              <span
                className="
                  absolute -bottom-[3px] left-1/2
                  h-1.5 w-1.5 -translate-x-1/2
                  rotate-45 bg-gray-400
                "
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Natywny input obsługuje mysz, dotyk i klawiaturę */}
        <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) =>
            updateVolume(Number(event.target.value))
        }
        aria-label="Volume"
        aria-valuetext={`${percentage}%`}

        // jak trzyma za gałe to wyświetlamy dymek
        onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;

        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onLostPointerCapture={() => setIsDragging(false)}
        onBlur={() => setIsDragging(false)}   

        className="
            absolute inset-0 z-10 m-0 h-full w-full
            cursor-pointer appearance-none rounded-md bg-transparent
            focus-visible:outline-2
            focus-visible:outline-offset-4
            focus-visible:outline-blue-600

            [&::-webkit-slider-runnable-track]:h-[3px]
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:mt-[-4.5px]
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-0
            [&::-webkit-slider-thumb]:bg-transparent

            [&::-moz-range-track]:h-[3px]
            [&::-moz-range-track]:bg-transparent
            [&::-moz-range-progress]:bg-transparent
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:bg-transparent
        "
        />
      </div>
    </div>
  );
}