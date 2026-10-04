import { useEffect, useId, useState } from "react";
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

type Timeframe = "week" | "month" | "year" | "all";

type ActivityPoint = {
  bucket: string;
  activeSeconds: number;
  hours: number;
};

type ActivitySummaryResponse = {
  success: boolean;
  timeframe: Timeframe;
  totalSeconds: number;
  totalHours: number;
  points: ActivityPoint[];
  activitiesCompleted: number;
  quizAccuracy: number;
  skills: SkillFrequency[];
};

type SkillFrequency = {
  key: string;
  name: string;
  count: number;
};

type WeeklySummary = {
  activeDays: number;
  activitiesCompleted: number;
  topSkill: SkillFrequency | null;
};

type Skill = {
  name: string;
  change: number;
};

type ThinkingCategory = {
  id: "analytical" | "scientific" | "humanistic" | "strategic" | "creative";
  label: string;
  description: string;
  value: number;
  color: string;
};

export type YouAnalytics = {
  activitiesSolved: Record<Timeframe, number>;
  accuracy: Record<Timeframe, number>;
  skills: Skill[];
  thinking: ThinkingCategory[];
};

export type YouDashboardProps = {
  analytics?: YouAnalytics;
  activeDates?: string[];
  lessonsThisWeek?: number;
};



import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const activityChartConfig = {
  duration: {
    label: "Learning time",
    color: "#4f72ff",
  },
} satisfies ChartConfig;


const timeframes: Array<{ id: Timeframe; label: string }> = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "All time" },
];




// tydzień, miesiąc, rok, all-time
function getPeriodRange(timeframe: Timeframe, offset: number) {
  const now = new Date();

  if (timeframe === "week") {
    const from = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    from.setDate(
      from.getDate() - ((from.getDay() + 6) % 7) + offset * 7,
    );

    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    return { from, to };
  }

  if (timeframe === "month") {
    const from = new Date(
      now.getFullYear(),
      now.getMonth() + offset,
      1,
    );

    const to = new Date(
      now.getFullYear(),
      now.getMonth() + offset + 1,
      1,
    );

    return { from, to };
  }

  if (timeframe === "year") {
    const from = new Date(now.getFullYear() + offset, 0, 1);
    const to = new Date(now.getFullYear() + offset + 1, 0, 1);

    return { from, to };
  }

  return {
    from: new Date(0),
    to: new Date(),
  };
}

async function fetchActivitySummary(
  timeframe: Timeframe,
  from: Date,
  to: Date,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    timeframe,
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const response = await fetch(
    `http://localhost:8000/api/activity/summary?${params}`,
    {
      credentials: "include",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("Could not load activity data");
  }

  return (await response.json()) as ActivitySummaryResponse;
}

function dayBucket(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthBucket(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function fillMissingActivityPoints(
  points: ActivityPoint[],
  timeframe: Timeframe,
  from: Date,
  to: Date,
) {
  const pointsByBucket = new Map(
    points.map((point) => [point.bucket, point]),
  );
  const result: ActivityPoint[] = [];

  if (timeframe === "week" || timeframe === "month") {
    const cursor = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
    );

    while (cursor < to) {
      const bucket = dayBucket(cursor);

      result.push(
        pointsByBucket.get(bucket) ?? {
          bucket,
          activeSeconds: 0,
          hours: 0,
        },
      );

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  const firstAllTimeBucket = points
    .map((point) => point.bucket)
    .sort()[0];

  const firstMonth = timeframe === "all"
    ? firstAllTimeBucket
      ? new Date(`${firstAllTimeBucket}-01T12:00:00`)
      : new Date(to.getFullYear(), to.getMonth(), 1)
    : new Date(from.getFullYear(), from.getMonth(), 1);

  const cursor = new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1);
  const lastMonth = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor < lastMonth || (timeframe === "all" && cursor <= lastMonth)) {
    const bucket = monthBucket(cursor);

    result.push(
      pointsByBucket.get(bucket) ?? {
        bucket,
        activeSeconds: 0,
        hours: 0,
      },
    );

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}




function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(date);
}

function formatActivityBucket(value: unknown, timeframe: Timeframe) {
  const bucket = String(value ?? "");
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(bucket);

  if (!match) return bucket;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) return bucket;

  if (timeframe === "year" || timeframe === "all") {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
    }).format(new Date(year, month - 1, 1));
  }

  const day = Number(match[3]);

  if (!day) return bucket;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return bucket;
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: timeframe === "week" ? "short" : undefined,
    day: timeframe === "month" ? "numeric" : undefined,
  }).format(date);
}

function getPeriodLabel(timeframe: Timeframe, offset: number) {
  const now = new Date();

  if (timeframe === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatShortDate(start)} – ${formatShortDate(end)}, ${end.getFullYear()}`;
  }

  if (timeframe === "month") {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (timeframe === "year") return String(now.getFullYear() + offset);
  return "Since you joined Notium";
}






function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-[18px] border-2 border-[#e5e5e5] bg-white px-6 py-5">
      <div className="flex items-center justify-between gap-4 text-[14px] text-[#6f6f6f]">
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="grid size-6 place-items-center rounded-full text-[#aaa] hover:bg-[#f3f3f3] hover:text-[#555]">
                <Info size={15} />
              </span>
            }
          />
          <TooltipContent
            sideOffset={8}
            className="bg-white text-gray-800 [&_div]:bg-white shadow-xl shadow-gray-200 max-w-[150px]"
          >
            <p>{hint}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <strong className="mt-2 block text-[32px] leading-none font-[720] tracking-[-1px] text-[#080808]">
        {value}
      </strong>
    </article>
  );
}

function MetricCardSkeleton() {
  return (
    <article className="rounded-[18px] border-2 border-[#e5e5e5] bg-white px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-36 bg-[#eeeeee]" />
        <Skeleton className="size-6 rounded-full bg-[#eeeeee]" />
      </div>
      <Skeleton className="mt-3 h-8 w-20 bg-[#eeeeee]" />
    </article>
  );
}


export default function YouDashboard({
  activeDates = [],
  lessonsThisWeek,
}: YouDashboardProps) {

  const [completedActivities, setCompletedActivities] = useState(0);
  const [averageQuizAccuracy, setAverageQuizAccuracy] = useState(0);
  const [skills, setSkills] = useState<SkillFrequency[]>([]);
  const [weeklySummaryLoading, setWeeklySummaryLoading] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>(() => {
    const currentWeek = getPeriodRange("week", 0);
    const fallbackActiveDays = new Set(
      activeDates.filter((value) => {
        const date = new Date(`${value}T12:00:00`);
        return date >= currentWeek.from && date < currentWeek.to;
      }),
    ).size;

    return {
      activeDays: fallbackActiveDays,
      activitiesCompleted: lessonsThisWeek ?? 0,
      topSkill: null,
    };
  });

  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [activityLoading, setActivityLoading] = useState(true);  

  const gradientId = useId().replace(/:/g, "");
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [periodOffset, setPeriodOffset] = useState(0);

  const periodLabel = getPeriodLabel(timeframe, periodOffset);
  const maxActivitySeconds = Math.max(
    0,
    ...activityData.map((point) => point.activeSeconds),
  );
  const showActivityInMinutes = maxActivitySeconds <= 60 * 60;
  const chartActivityData = activityData.map((point) => ({
    ...point,
    duration: showActivityInMinutes
      ? Math.round(point.activeSeconds / 60)
      : point.hours,
  }));


  function selectTimeframe(next: Timeframe) {
    if (next === timeframe) return;

    setActivityLoading(true);
    setTimeframe(next);
    setPeriodOffset(0);
    setActivityData([]);
    setTotalHours(0);
  }

  // Weekly Summary zawsze pokazuje bieżący tydzień i nie zależy od
  // timeframe wybranego dla wykresu oraz pozostałych statystyk.
  useEffect(() => {
    const controller = new AbortController();
    const { from, to } = getPeriodRange("week", 0);

    const loadWeeklySummary = async () => {
      try {
        const result = await fetchActivitySummary(
          "week",
          from,
          to,
          controller.signal,
        );

        const activeDays = new Set(
          result.points
            .filter((point) => point.activeSeconds > 0)
            .map((point) => point.bucket),
        ).size;

        setWeeklySummary({
          activeDays,
          activitiesCompleted: result.activitiesCompleted,
          topSkill: result.skills?.[0] ?? null,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Loading weekly summary failed", error);
      } finally {
        if (!controller.signal.aborted) {
          setWeeklySummaryLoading(false);
        }
      }
    };

    void loadWeeklySummary();

    return () => controller.abort();
  }, []);


  // pobieranie danych
  useEffect(() => {
    const controller = new AbortController();
    const { from, to } = getPeriodRange(timeframe, periodOffset);

    
    const loadActivity = async () => {
      setActivityLoading(true);

      try {
        const result = await fetchActivitySummary(
          timeframe,
          from,
          to,
          controller.signal,
        );

        setCompletedActivities(result.activitiesCompleted);
        setAverageQuizAccuracy(result.quizAccuracy);
        setSkills(result.skills ?? []);

        setActivityData(
          fillMissingActivityPoints(result.points, timeframe, from, to),
        );
        setTotalHours(result.totalHours);

      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Loading activity chart failed", error);
        setActivityData([]);
        setTotalHours(0);
        setSkills([]);
      } finally {
        if (!controller.signal.aborted) {
          setActivityLoading(false);
        }
      }
    };

    void loadActivity();

    return () => controller.abort();
  }, [timeframe, periodOffset]); 

  return (
    
    <main
      className="mx-auto w-full max-w-[1220px] px-6 pt-[46px] pb-24 text-[#111] @max-[720px]/home:px-[18px] @max-[720px]/home:pt-7"
      aria-label="Your learning analytics"
    >
      <h1 className="text-[22px] font-[700] tracking-[-.5px]">
        Your learning activity
      </h1>

      {/*  border-[#cfe2d5] , #eaf9ef, #f5fcf7*/}
      <section className="relative mt-6 min-h-[255px] overflow-hidden rounded-[20px] border-2 border-[#cfe2d5] 
      bg-[linear-gradient(120deg,#eaf9ef_0%,#f5fcf7_100%)] px-9 py-8 @max-[720px]/home:min-h-[310px] @max-[720px]/home:px-5
       @max-[720px]/home:py-6">
        <div className="grid grid-cols-[220px_1fr] gap-8 @max-[720px]/home:grid-cols-1 @max-[720px]/home:gap-4">
          
          <div>
            <h2 className="text-[27px] font-[720] tracking-[-.7px]">
              Weekly summary
            </h2>
            <p className="mt-1 text-[14px] text-[#667069]">
              {getPeriodLabel("week", 0)}
            </p>
          </div>

          {weeklySummaryLoading ? (
            <div
              className="space-y-4 pt-1"
              aria-label="Loading weekly summary"
              aria-busy="true"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="mt-2 size-2 shrink-0 rounded-full bg-[#dfeee4]" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-[92%] bg-[#dfeee4]" />
                  <Skeleton className="h-4 w-[58%] bg-[#dfeee4]" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Skeleton className="mt-2 size-2 shrink-0 rounded-full bg-[#dfeee4]" />
                <Skeleton className="h-4 w-[64%] bg-[#dfeee4]" />
              </div>
            </div>
          ) : (
          <ul className="space-y-3 pt-1 text-[15px] leading-6 text-[#252525]">
            <li className="flex gap-3">
              <span aria-hidden="true">•</span>
              <span>
                Keep it up! You learned on{" "}
                <strong>
                  {weeklySummary.activeDays} day
                  {weeklySummary.activeDays === 1 ? "" : "s"}
                </strong>{" "}
                this week and completed{" "}
                <strong>
                  {weeklySummary.activitiesCompleted}{" "}
                  {weeklySummary.activitiesCompleted === 1
                    ? "activity"
                    : "activities"}
                </strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true">•</span>
              <span>
                Your strongest skill is {" "}
                <strong>
                  {weeklySummary.topSkill?.name.toLowerCase() ??
                    "your recent topics"}
                </strong>
               
              </span>
            </li>
          </ul>
          )}
        </div>
        <div className="absolute -bottom-4 -left-3 @max-[720px]/home:left-auto @max-[720px]/home:right-0">
          {/* <SummaryIllustration /> */}
          <img src="/Paywall/paywall_doodle_4.png" alt="statistics_doodle" className="w-[100px] h-auto rotate-[20deg]"/>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-5 @max-[720px]/home:flex-col @max-[720px]/home:items-stretch">
          <div
            className="inline-flex w-fit rounded-full bg-[#f5f5f5] p-1"
            role="tablist"
            aria-label="Analytics timeframe"
          >
            {timeframes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={timeframe === item.id}
                onClick={() => selectTimeframe(item.id)}
                className={`rounded-full px-4 py-2 text-[14px] transition-[background,color,box-shadow] ${
                  timeframe === item.id
                    ? "bg-white font-[600] text-[#111] shadow-[0_2px_10px_#0000000e]"
                    : "text-[#929292] hover:text-[#555]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 text-[15px] text-[#666] @max-[720px]/home:justify-between">
            <button
              type="button"
              disabled={timeframe === "all"}
              onClick={() => {
                setActivityLoading(true);
                setPeriodOffset((value) => value - 1);
              }}
              className="grid size-9 place-items-center rounded-full hover:bg-[#f1f1f1]"
              aria-label="Previous period"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[190px] text-center">{periodLabel}</span>
            <button
              type="button"
              disabled={timeframe === "all" || periodOffset >= 0}
              onClick={() => {
                setActivityLoading(true);
                setPeriodOffset((value) => value + 1);
              }}
              className="grid size-9 place-items-center rounded-full hover:bg-[#f1f1f1]"
              aria-label="Next period"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 @max-[720px]/home:grid-cols-1">
          {activityLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                label="Activities completed"
                value={String(completedActivities)}
                hint="Completed quizzes, flashcard sessions, podcasts and learning activities."
              />

              <MetricCard
                label="Average quiz accuracy"
                value={`${averageQuizAccuracy}%`}
                hint="Correct answers across quizzes completed in this period."
              />
            </>
          )}
        </div>

        <article className="mt-4 rounded-[20px] border-2 border-[#e5e5e5] bg-white px-8 pt-7 pb-6 @max-[720px]/home:px-4">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-[21px] font-[700] tracking-[-.4px]">
                Study Time
              </h2>
              <p className="mt-1 text-[14px] text-[#777]">{periodLabel}</p>
            </div>
            {activityLoading ? (
              <Skeleton className="h-9 w-20 rounded-[12px] bg-[#eef1fb]" />
            ) : (
              <div className="flex items-center gap-2 rounded-[12px] bg-[#f4f6ff] px-3 py-2 text-[14px] font-[600] text-[#4565df]">
                <Clock3 size={16} />
                {showActivityInMinutes
                  ? `${Math.round(totalHours * 60)} min`
                  : `${totalHours.toFixed(1)} h`}
              </div>
            )}
          </div>

          {activityLoading ? (
            <Skeleton
              className="mt-6 h-[300px] w-full rounded-[14px] bg-[#eeeeee]"
              aria-label="Loading study time chart"
            />
          ) : (
          <ChartContainer
            config={activityChartConfig}
            className="mt-6 h-[300px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={chartActivityData}
              margin={{
                left: showActivityInMinutes ? 12 : 4,
                right: 8,
                top: 12,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6388ff" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#6388ff" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ececec" />
              <XAxis
                dataKey="bucket"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={(value) =>
                  formatActivityBucket(value, timeframe)
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={showActivityInMinutes ? 48 : 34}
                allowDecimals={!showActivityInMinutes}
                tick={{ fill: "#777", fontSize: 12 }}
                tickFormatter={(value) =>
                  `${value}${showActivityInMinutes ? "m" : "h"}`
                }
              />
              <ChartTooltip
                cursor={{ stroke: "#b8c7ff", strokeDasharray: "4 4" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) =>
                      showActivityInMinutes
                        ? `${Math.round(Number(value))} min`
                        : `${Number(value).toFixed(1)} h`
                    }
                  />
                }
              />
              <Area
                dataKey="duration"
                type="linear"
                fill={`url(#${gradientId})`}
                stroke="#4f72ff"
                strokeWidth={2.4}
                activeDot={{
                  r: 5,
                  fill: "#4f72ff",
                  stroke: "white",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ChartContainer>
          )}

          {activityLoading ? (
            <Skeleton className="mt-6 h-4 w-56 bg-[#eeeeee]" />
          ) : (
            <div className="mt-6 flex items-center gap-2 text-[14px] text-gray-800 font-[500]">
              <TrendingUp size={17} /> Your focus time is trending upward
            </div>
          )}
        </article>
      </section>

      <section className="bg-white border-gray-200 border-2 mt-3 rounded-[18px] p-5">

        <div className="ml-1 text-neutral-500 text-[15px] font-[450]">
          Learning skills
        </div>

        <div className="mt-1">
          {activityLoading ? (
            <div
              className="flex flex-wrap gap-2"
              aria-label="Loading learning skills"
              aria-busy="true"
            >
              {[112, 94, 128, 104, 120].map((width) => (
                <Skeleton
                  key={width}
                  className="h-10 rounded-full bg-[#eeeeee]"
                  style={{ width }}
                />
              ))}
            </div>
          ) : (
          skills.map((skill) => (

            <div
              key={skill.key}
              className="w-fit inline-block rounded-full border-1 border-[#e5e5e5] bg-white px-3 py-2 transition-colors mr-2 mt-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] text-gray-700 font-[450]">{skill.name}</h3>
                </div>
                <Tooltip>
                  <TooltipTrigger render={
                        <span className="rounded-full bg-[#eaf9ef] px-2 py-1 text-[12px] font-[750] text-green-700 cursor-default">
                      +{skill.count}
                    </span>
                  }/>
                  <TooltipContent
                    sideOffset={15} 
                    className="bg-white text-gray-800 [&_div]:bg-white shadow-xl shadow-gray-200 max-w-[150px]">
                    <p>This indicator shows in how many of your <span className="font-[600] text-[13px]">projects</span> this skill appeared</p>
                  </TooltipContent>
                </Tooltip>                
              </div>

            </div>
          ))
          )}

          {!activityLoading && skills.length === 0 && (
            <p className="py-2 text-[14px] text-[#929292]">
              No skills learned in this time period.
            </p>
          )}
        </div>
      </section>

    </main>
  );
}
