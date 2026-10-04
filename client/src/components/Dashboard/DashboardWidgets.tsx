import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import DashboardArt from "./DashboardArt";
import type { LearningStats } from "./dashboard.types";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function Modal({
  open,
  title,
  onClose,
  children,
  className = "",
  type
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  type?: string | null

}) {

  const ref = useRef<HTMLDialogElement>(null);

  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
    };

  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`nh-dialog m-auto max-h-[calc(100dvh-48px)] w-[min(520px,calc(100vw-32px))] overflow-y-auto rounded-[23px] border-2
         border-[#e5e5e5] bg-white p-7 text-[#151515] shadow-[0_24px_80px_#18235020] backdrop:bg-[#1d274533]
          backdrop:backdrop-blur-[5px] @max-[720px]/home:p-[22px]! ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}

      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className={`nh-dialog-heading ${type === "recordAudio" ? "mb-[0px]" : "mb-[25px]"}  flex items-center justify-between gap-[15px] [&_h2]:text-[24px] [&_h2]:font-bold
       [&_h2]:tracking-[-.8px]`}>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="nh-icon-button inline-flex size-[38px] items-center justify-center rounded-lg border-0 bg-transparent p-[7px] text-[#222] hover:bg-[#f4f4f4]"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={24} />
        </button>
      </div>
      {children}
    </dialog>
  );
}




function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}





export function WeekStreak({ stats }: { stats: LearningStats }) {
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  // Match the five-day reference, but also show the weekend when it is relevant.
  const count =
    today.getDay() === 0 || today.getDay() === 6 ||
    stats.activeDates.some((date) => {
      const parsed = new Date(`${date}T12:00:00`);
      return (
        parsed >= start && parsed <= today && [0, 6].includes(parsed.getDay())
      );
    })
      ? 7
      : 5;

  return (
    <div
      className={`nh-week grid gap-[10px] @max-[1250px]/home:gap-[6px] ${count === 7 ? "grid-cols-7" : "grid-cols-5"}`}
    >
      {Array.from({ length: count }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const active = stats.activeDates.includes(localDate(date));
        const isToday = localDate(date) === localDate(today);

        return (
          <div
            key={index}
            className={`nh-day flex min-w-0 flex-col items-center gap-[9px] text-[14px] text-[#777] [&.is-today]:font-bold
                [&.is-today]:text-[#111] ${active ? "is-active" : ""} ${isToday ? "is-today" : ""}`}
            aria-label={`${date.toLocaleDateString("en-GB", { weekday: "long" })}: ${active ? "goal reached" : "goal not reached"}`}
          >
            <span
              className={`
                nh-day-circle grid aspect-square w-full max-w-12 place-items-center
                rounded-full border-2 transition-colors duration-200
                ${
                  active
                    ? "bg-orange-500 border-transparent"
                    : "border-[#e5e5e5] bg-[#e5e5e5]"
                }
              `}
            >
              {active && (
                <Check
                  className="h-7 w-7 text-white"
                  strokeWidth={3.5}
                />
              )}
            </span>
            
            <span>{["M", "T", "W", "Th", "F", "Sa", "Su"][index]}</span>
          </div>
        );
      })}
    </div>
  );
}





export function StreakCard({
  stats,
  onOpen,
}: {
  stats: LearningStats;
  onOpen: () => void;
}) {

  const today = localDate(new Date());

  const finished = stats.activeDates.includes(today);

  return (
    <button
      type="button"
      className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white p-[22px] @max-[1250px]/home:p-[17px] @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-streak-card text-left text-[#111] transition-colors duration-150 hover:border-[#c9c9c9] [&>p]:mt-[17px] [&>p]:mb-[21px] [&>p]:text-[15px] [&>p]:leading-normal @max-[1250px]/home:[&>p]:text-[13px] @max-[1050px]/home:[&>p]:text-[15px]"
      onClick={onOpen}
      aria-label="Open your daily streak"
    >
      <div className="nh-streak-top flex items-center justify-between gap-3 @max-[720px]/home:gap-[15px]">
        <span className="nh-streak-number inline-flex items-center gap-[3px] text-[54px] leading-[1.1] font-[750] tracking-[-2px] [&>.nh-art]:h-[49px] [&>.nh-art]:w-10 @max-[1250px]/home:text-[46px]">
          {stats.dailyStreak}
          <DashboardArt kind="fire" />
          {/* <img src="/Dashboard/fire.png" alt="fire" className="w-[65px] h-auto"/> */}
        </span>
        <div
          className="nh-freezes flex items-center [&>.nh-art]:h-[49px] [&>.nh-art]:w-[42px] [&>.is-unavailable]:opacity-30 [&>.is-unavailable]:grayscale-[.7] @max-[1250px]/home:[&>.nh-art]:h-[42px] @max-[1250px]/home:[&>.nh-art]:w-[33px] @max-[720px]/home:[&>.nh-art]:h-[47px] @max-[720px]/home:[&>.nh-art]:w-[41px]"
          aria-label={`${stats.streakFreezes} streak freezes`}
        >
          {[0, 1].map((index) => (
            <DashboardArt
              kind="ice"
              key={index}
              className={index >= stats.streakFreezes ? "is-unavailable" : ""}
            />
            // <img src="/Dashboard/freeze.png" alt="freeze" className="w-[40px] h-auto"/>
          ))}
        </div>
      </div>
      <p>
        {!finished
          ? `Solve a quiz or do flashcards to ${stats.dailyStreak > 0 ? "keep your streak" : "start a streak"}`
          : "Daily goal complete. Nicely done!"}
      </p>
      <WeekStreak stats={stats} />
    </button>
  );
}



export function PremiumCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <section
      className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white p-[19px] @max-[1250px]/home:p-[17px]
       @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-premium-card "
      aria-label="Notium Premium"
    >

      <div className="nh-premium-copy mb-[17px] flex items-center gap-3 [&>.nh-art]:size-[60px] [&_p]:text-[13px] [&_p]:leading-[1.65] [&_strong]:block [&_strong]:font-[650] [&_span]:text-[#333] @max-[1250px]/home:gap-2 @max-[1250px]/home:[&>.nh-art]:h-[50px] @max-[1250px]/home:[&>.nh-art]:w-[46px] @max-[1250px]/home:[&_p]:text-[12px] @max-[1050px]/home:[&_p]:text-[14px]">
        {/* <DashboardArt kind="premium" /> */}
        <img src="/Dashboard/chestWithKeys.png" alt="" className="w-[50px] h-auto"/>
        <p>
          <strong>Unlimited learning</strong>
          <span>Generate without key limits</span>
        </p>
      </div>
      
      <button
        type="button"
        className="mt-6 flex gap-2 justify-center items-center min-h-[52px] w-full rounded-full border-b-[4px] border-black active:border-b-0 select-none
          bg-[linear-gradient(110deg,#363636,#292929)] px-6 py-3 text-[16px]  text-white transition-[transform,filter]
          hover:brightness-110 active:translate-y-[3px] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2
          focus-visible:outline-offset-4 focus-visible:outline-blue-600 font-[500]"
        onClick={onUpgrade}
      >
        {/* Obszar przycinający blask */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        >
          <motion.span
            className="absolute inset-y-[-40%] w-[28%] -skew-x-[20deg]
              bg-gradient-to-r from-transparent via-white/35 to-transparent
              blur-[1px]"
            initial={{ left: "-45%" }}
            animate={{ left: "120%" }}
            transition={{
              duration: 0.85,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 4.15,
            }}
          />
        </span>

        <span className="relative z-10">Explore Premium</span>
      </button>

    </section>
  );
}



export function RankCard({ stats }: { stats: LearningStats }) {
  const testRankThreshld = 130  
  const unlocked = stats.xp >= testRankThreshld;
  return (
    <section
      className="nh-card rounded-[17px] border-2 border-[#e5e5e5] bg-white p-[18px] @max-[1250px]/home:p-[17px]
       @max-[1050px]/home:p-[22px] @max-[720px]/home:p-5 nh-rank-card flex items-center gap-[17px] [&>.nh-art]:h-[67px]
        [&>.nh-art]:w-16 [&_h2]:text-[13px] [&_h2]:font-[650] [&_p]:mt-[5px] [&_p]:text-[15px] [&_p]:text-[#777]"
      aria-label="Rank progress"
    >
      {/* <DashboardArt kind="rank" /> */}
      <img src="/Dashboard/target.png" alt="" className="w-[50px] h-auto" />
      <div>
        <h2>{unlocked ? "RANK UNLOCKED" : "UNLOCK RANK"}</h2>
        <p>
          {stats.xp.toLocaleString("en-US")} of{" "}
          {testRankThreshld.toLocaleString("en-US")} XP
        </p>
      </div>
    </section>
  );
}



export function StreakDetails({ stats }: { stats: LearningStats }) {
  return (
    <>
      <div className="nh-streak-top flex items-center justify-between gap-3 @max-[720px]/home:gap-[15px]">
        
        <span className="nh-streak-number inline-flex items-center gap-[3px] text-[54px] leading-[1.1] font-[750] tracking-[-2px] [&>.nh-art]:h-[49px] [&>.nh-art]:w-10 @max-[1250px]/home:text-[46px]">
          {stats.dailyStreak}
          <DashboardArt kind="fire" />
          {/* <img src="/Dashboard/fire.png" alt="fire" className="w-[100px] h-auto"/> */}
        </span>

        <div className="nh-freezes flex items-center [&>.nh-art]:h-[49px] [&>.nh-art]:w-[42px] [&>.is-unavailable]:opacity-30 [&>.is-unavailable]:grayscale-[.7] @max-[1250px]/home:[&>.nh-art]:h-[42px] @max-[1250px]/home:[&>.nh-art]:w-[33px] @max-[720px]/home:[&>.nh-art]:h-[47px] @max-[720px]/home:[&>.nh-art]:w-[41px]">
          {[0, 1].map((index) => (

            <DashboardArt
              kind="ice"
              key={index}
              className={index >= stats.streakFreezes ? "is-unavailable" : ""}
            />
            // <img src="/Dashboard/freeze.png" alt="freeze" className="w-[80px] h-auto"/>

          ))}
        </div>
      </div>

      <p className="nh-streak-message mt-[15px]! mb-[30px]! text-[20px] text-[#777]">
        {stats.dailyStreak > 0
          ? `You’re on a ${stats.dailyStreak}-day streak!`
          : "A little learning starts a great habit."}
      </p>

      <WeekStreak stats={stats} />

      <div className="nh-streak-stats mt-8 grid grid-cols-2 rounded-2xl bg-[#f6f6f8] px-[10px] py-[21px] [&>div]:flex [&>div]:flex-col [&>div]:items-center [&>div]:gap-[5px] [&>div+div]:border-l [&>div+div]:border-[#ddd] [&_strong]:text-[28px] [&_span]:text-[15px] [&_span]:text-[#888] @max-[720px]/home:[&_span]:text-[12px]">
        <div>
          <strong>{stats.maxStreak}</strong>
          <span>Max streak</span>
        </div>
        <div>
          <strong>{stats.lessonsCompleted}</strong>
          <span>Lessons complete</span>
        </div>
      </div>
    </>
  );
}
