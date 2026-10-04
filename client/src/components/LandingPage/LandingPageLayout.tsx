"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import StudyShowcase from "./StudyShowcase";
import NotiumOnboarding from "../Onboarding/NotiumOnboarding";
import {
  startGoogleOAuth, consumeGoogleOAuthResult, getGoogleReturnState, clearGoogleReturnState,
  readOnboardingDraft, storeOnboardingDraft, clearOnboardingDraft, isStudyProfile,
} from "../Onboarding/GoogleOAuth";
import type { OnboardingResume, Registration } from "../Onboarding/GoogleOAuth";
import type {
  NotiumOnboardingProps,
  OnboardingServices,
} from "../Onboarding/NotiumOnboarding";
import {
  Play,
  Type,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  ImagePlus,
  Table as TableIcon,
  Link2,
  StickyNote,
  Sparkles,
  MessageSquarePlus,
  PencilSparkles,
  Smile,
  BookOpen,
  ListChecks,
  Lightbulb,
  Check as PreviewCheck,
  RotateCcw,
  Trash,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"


type Feature = "notes" | "quizzes" | "flashcards" | "podcasts";
type AuthStep = "choices" | "email";

type AuthUser = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
};

type AuthResponse = {
  token: string;
  user?: AuthUser;
};

class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

function getApiBaseUrl() {
  const environment = (
    import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }
  ).env;

  return (
    environment?.VITE_API_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:8000"
  );
}

function apiUrl(apiBaseUrl: string, path: string) {
  return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function postJson<TResponse>(
  apiBaseUrl: string,
  path: string,
  body: unknown,
  authenticated = false,
): Promise<TResponse> {
  const response = await fetch(apiUrl(apiBaseUrl, path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authenticated ? { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const rawBody = await response.text();
  let data: Record<string, unknown> = {};

  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      if (!response.ok) {
        throw new ApiRequestError(
          "The server returned an invalid response.",
          response.status,
        );
      }
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(
      typeof data.message === "string" ? data.message : "The request failed.",
      response.status,
      typeof data.code === "string" ? data.code : undefined,
    );
  }

  return data as unknown as TResponse;
}

function saveAuthSession(data: AuthResponse) {
  if (!data || typeof data.token !== "string" || !data.token) {
    throw new Error("The server did not return an authentication token.");
  }

  localStorage.setItem("token", data.token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
}

const container = "mx-auto w-full max-w-[1340px] px-5 sm:px-8 lg:px-12";

const secondaryButton = `
  box-border mt-0
  flex h-[50px] w-full shrink-0 items-center justify-center gap-3
  rounded-full border border-[#e1e2e5]
  bg-white text-[16px] font-medium text-gray-900
  shadow-[0_2px_0_#e1e2e5]
  cursor-pointer

  transition-[height,margin-top,box-shadow]
  duration-100 ease-out

  hover:border-gray-300
  hover:bg-gray-50
  hover:shadow-[0_2px_0_#d1d5dc]

  active:mt-[4px]
  active:h-[46px]
  active:shadow-none

  disabled:cursor-not-allowed
  disabled:border-gray-200
  disabled:bg-gray-100
  disabled:text-gray-400
  disabled:shadow-none
`;


// Fictional sample testimonials for the landing-page design.
const reviews: Array<[string, string, number, string]> = [
  ["ellie.m", "actually finished my flashcards instead of just making them 😭 love this", 184, "/LandingPage/profile/img_28.png"],
  ["Priya", "The quizzes really call you out when you don't know something lol. Needed that", 76, "/LandingPage/profile/img_2.png"],
  ["Baddia🫦", "MY NOTES AS A PODCAST?? listening on the bus now 🫶", 293, "/LandingPage/profile/img_3.png"],
  ["lucas.study", "Still tweak a few cards myself but this saves me sooo much typing", 48, "/LandingPage/profile/img_4.png"],
  ["Amelia R.", "all my biology notes in one place. my 20 open tabs can finally rest 😂", 127, "/LandingPage/profile/img_5.png"],
  ["noor_17", "the transcript following every word is SO nice!! I lose focus so easily", 362, "/LandingPage/profile/img_6.png"],
  ["Theo", "came here for one chapter and ended up uploading the whole folder lol", 91, "/LandingPage/profile/img_7.png"],
  ["sofia.k", "shared notes with my friend and we finally understand what the other is highlighting 🤝", 65, "/LandingPage/profile/img_8.png"],
  ["Hannah", "being able to edit both sides of the cards!! yes thank you", 208, "/LandingPage/profile/img_9.png"],
  ["sophie roll", "did 15 mins instead of nothing today. the little progress chart gets me 🥹", 54, "/LandingPage/profile/img_10.png"],
  ["leahwrites", "not staring at a blank page before every study session >>>", 419, "/LandingPage/profile/img_11.png"],
  ["Alex", "I read the summary first then quiz myself. Finally found a routine I like", 83, "/LandingPage/profile/img_12.png"],
  ["Rolland_poland", "wait why is making revision stuff actually kind of fun now 😭", 524, "/LandingPage/profile/img_13.png"],
  ["Emi_booktoky", "the clean layout + my daily streak... I'm a little obsessed ✨", 45, "/LandingPage/profile/img_14.png"],
  ["Nani56", "biology revision feels way less overwhelming when it's broken into cards 💙", 254, "/LandingPage/profile/img_15.png"],
  ["Herr", "Simple to use. Uploaded my notes and didn't need a tutorial for once", 254, "/LandingPage/profile/img_16.png"],
  ["Bruno", "the quiz found the exact bit I kept skipping. fair enough 💀", 721, "/LandingPage/profile/img_17.png"],
  ["Ale_xxxx", "me: just one more quiz. also me: still here 20 minutes later", 138, "/LandingPage/profile/img_18.png"],
  ["Maya_france2", "love that I can keep my own wording in the flashcards 🫶", 12, "/LandingPage/profile/img_19.png"],
  ["Tom clark", "Used the podcast on my walk. Much better than leaving my notes unopened", 1, "/LandingPage/profile/img_20.png"],
  ["Brit", "WHERE was this when I was copying every definition by hand 😭", 61, "/LandingPage/profile/img_21.png"],
  ["AnyaP", "tiny study sessions between classes actually feel doable now ✨", 23, "/LandingPage/profile/img_22.png"],
  ["dogLover_56", "reviewing flashcards with my dog asleep on my lap. ideal setup 🐶", 13, "/LandingPage/profile/img_23.png"],
  ["Adam korp", "The notes give me somewhere to start. That's honestly the hardest part for me", 2, "/LandingPage/profile/img_24.png"],
  ["Angelica R.", "I like that the AI text is a draft and I can change it before keeping it", 18, "/LandingPage/profile/img_25.png"],
  ["jUSTwater", "opened this to avoid studying and accidentally started studying. incredible 😂", 191, "/LandingPage/profile/img_26.png"],
  ["doggo22", "one chapter at a time. we are getting through this 📚💪", 222, "/LandingPage/profile/img_27.png"],
];

// A single shuffled pool is split into disjoint rows: every review appears once.
function createReviewRows(randomize = false) {
  const pool = [...reviews];
  if (randomize) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  return Array.from({ length: 3 }, (_, row) =>
    pool.filter((_, index) => index % 3 === row),
  );
}


function Arrow({
  direction = "right",
  className = "",
}: {
  direction?: "right" | "down";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={direction === "right" ? "M5 12h13m-5-5 5 5-5 5" : "m6 9 6 6 6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 21S3 16.2 3 9.5A4.5 4.5 0 0 1 11 6.7a4.5 4.5 0 0 1 8 2.8C19 16.2 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m5 12 4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#top"
      className={`text-[30px] font-black tracking-[-1.8px] ${light ? "text-white" : "text-gray-700"}`}
      aria-label="Notium home"
    >
      Notium
    </a>
  );
}

export function Mascot({
  className = "",
  expression = "happy",
}: {
  className?: string;
  expression?: "happy" | "look";
}) {
  return (
    <svg
      viewBox="0 0 170 170"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="22" y="20" width="126" height="128" rx="24" fill="#ff6c1c" />
      <path
        d="M22 118v8a22 22 0 0 0 22 22h82a22 22 0 0 0 22-22v-8c-31 15-90 17-126 0Z"
        fill="#ed5812"
      />
      <ellipse cx="67" cy="79" rx="18" ry="28" fill="white" />
      <ellipse cx="106" cy="79" rx="18" ry="28" fill="white" />
      <ellipse
        cx={expression === "look" ? 73 : 70}
        cy="85"
        rx="8"
        ry="15"
        fill="#17181b"
      />
      <ellipse
        cx={expression === "look" ? 112 : 102}
        cy="85"
        rx="8"
        ry="15"
        fill="#17181b"
      />
      <path
        d="M58 124q29 24 57-2"
        stroke="#17181b"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}





function AuthModal({
  open,
  setOpen,
  onStartOnboarding,
  apiBaseUrl,
  dashboardHref,
  googleError,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onStartOnboarding: () => void;
  apiBaseUrl: string;
  dashboardHref: string;
  googleError?: string;
}) {
  const [step, setStep] = useState<AuthStep>("choices");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStep("choices");
      setNotice("");
      setEmail("");
      setPassword("");

    }
    else if (googleError) setNotice(googleError);
  }, [open, googleError]);

  const startOnboarding = () => {
    setOpen(false);
    onStartOnboarding();
  };

  const finishAuthentication = (data: AuthResponse) => {
    saveAuthSession(data);
    setOpen(false);
    window.location.assign(dashboardHref);
  };

  const authenticateWithGoogle = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice("");
    try { await startGoogleOAuth(apiBaseUrl, { mode: "sign_in" }); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : "Google Sign-In failed. Please try again."); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setNotice("");

    try {
      const data = await postJson<AuthResponse>(apiBaseUrl, "/api/login", {
        email: email.trim(),
        password,
      });
      finishAuthentication(data);
    } catch (caught) {
      setNotice(
        caught instanceof Error
          ? caught.message
          : "Sign-in failed. Check your details and try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busyRef.current) setOpen(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[92dvh] overflow-y-auto rounded-[20px] border-0 bg-white px-8
         shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:max-w-[500px] sm:px-10 sm:pb-10"
      >
        <img src="/LandingPage/login/login_2.png" alt="login doodle" className="w-[180px] h-auto mx-auto" />

        <DialogTitle className="mt-1 text-center text-[31px] font-extrabold tracking-[-.8px]">
          Sign in
        </DialogTitle>
        
        <DialogDescription className="sr-only">
          Sign in to Notium
        </DialogDescription>

        {step === "choices" ? (
          <div className="mt-4 space-y-3">
            <div className="h-[52px] w-full">
              <button type="button" onClick={authenticateWithGoogle} disabled={busy}
                className="box-border flex h-[50px] w-full items-center justify-center gap-3 rounded-full
                  border-2 border-[#e1e2e5] bg-white text-[16px] font-medium text-gray-900
                  shadow-[0_3px_0_#e1e2e5] cursor-pointer hover:bg-gray-50 hover:border-gray-300
                  transition-[height,margin-top,box-shadow] duration-100 ease-out
                  active:mt-[3px] active:h-[47px] active:shadow-none disabled:cursor-wait disabled:opacity-60">
                <GoogleLogo className="h-[21px] w-[21px] shrink-0" />
                {busy ? "Please wait…" : "Sign in with Google"}
              </button>
            </div>

              <button
                type="button"
                onClick={() => setNotice("Apple Sign-In is coming soon.")}
                className="relative flex gap-3 h-[50px] w-full items-center justify-center rounded-full border-2 border-[#e1e2e5]
                 bg-white text-[16px] font-medium shadow-[0_3px_0_#e1e2e5] hover:bg-gray-50 active:translate-y-[2px]
                  active:shadow-none hover:border-gray-300 hover:shadow-[0_2px_0_#d1d5dc] cursor-pointer"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center `}
                >
                  <img src="/LandingPage/login/apple.png" alt="" className="w-[40px] h-auto"/>
                </span>
                Sign in with Apple
              </button>                 

              <button
                type="button"
                onClick={() => setNotice("Facebook Sign-In is coming soon.")}
                className="relative flex gap-3 h-[50px] w-full items-center justify-center rounded-full border-2 border-[#e1e2e5]
                 bg-white text-[16px] font-medium shadow-[0_3px_0_#e1e2e5] hover:bg-gray-50 active:translate-y-[2px]
                  active:shadow-none hover:border-gray-300 hover:shadow-[0_2px_0_#d1d5dc] cursor-pointer"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center `}
                >
                  <img src="/LandingPage/login/facebook.png" alt="" className="w-[40px] h-auto"/>
                </span>
                Sign in with Facebook
              </button>                           

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setNotice("");
              }}
              className="h-[52px] w-full rounded-full border-b-4 border-black bg-[#383838] text-[15px] font-bold text-white active:translate-y-[2px] active:border-b-2"
            >
              Sign in with email
            </button>

            {notice && (
              <p role="status" className="text-center text-xs text-gray-500">
                {notice}
              </p>
            )}

            <p className="pt-4 text-center text-[15px] text-gray-500">
              New user?{" "}
              <button
                type="button"
                onClick={startOnboarding}
                className="font-bold text-black underline underline-offset-2"
              >
                Sign up
              </button>
            </p>
          </div>

        ) : (
          // inaczej tworzenie konta
          <form
            className="mt-3 space-y-3 px-8"
            onSubmit={signInWithEmail}
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
                className="h-[52px] w-full rounded-[10px] border-2 border-[#dcdcdc] bg-white px-4 text-[16px] text-[#111] outline-none
                transition-[border,box-shadow] placeholder:text-[#999] focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]/15"
              placeholder="Email"
              required
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="h-[52px] w-full rounded-[10px] border-2 border-[#dcdcdc] bg-white px-4 text-[16px] text-[#111] outline-none
                transition-[border,box-shadow] placeholder:text-[#999] focus:border-[#155dfc] focus:ring-1 focus:ring-[#155dfc]/15"
              placeholder="Password"
              required
            />
            <button
              disabled={busy}
              className="h-[52px] w-full rounded-full border-b-4 border-black bg-[#383838] text-[15px] font-bold text-white
             active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            {notice && (
              <p
                role="status"
                className="rounded-lg bg-gray-100 p-3 text-sm text-gray-600"
              >
                {notice}
              </p>
            )}
            <p className="pt-4 text-center text-[15px]">
              New user?{" "}
              <button
                type="button"
                onClick={startOnboarding}
                className="font-bold underline underline-offset-2"
              >
                Sign up
              </button>
            </p>
            <button
              type="button"
              onClick={() =>
                setNotice("Password reset will be available soon.")
              }
              className="block w-full text-center text-[15px] underline underline-offset-2"
            >
              Reset password
            </button>
            <button
              type="button"
              onClick={() => setStep("choices")}
              className="block w-full text-center text-sm text-[#4255ff]"
            >
              Back to sign-in options
            </button>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}


// Each preview has its own visibility clock. Offscreen/hidden tabs stop work;
// reduced motion shows the completed preview without a timer.
function useFeaturePreview(duration = 8200) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    const node = ref.current;
    if (!node) return () => media.removeEventListener("change", syncMotion);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.55);
      },
      { threshold: [0, 0.55] },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    if (!visible || reduced) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(now - previous, 150);
      previous = now;
      if (!document.hidden) setElapsed((value) => (value + delta) % duration);
    }, 80);
    return () => window.clearInterval(timer);
  }, [visible, reduced, duration]);
  return { ref, time: reduced ? duration - 1 : elapsed };
}

const miniSurface =
  "overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-700";
const miniLabel =
  "text-[9px] font-medium uppercase tracking-[.14em] text-gray-400";

// Presentational counterparts of FlashcardToolbar, BubbleMenuText and AiBlockView.
// No editor instance, focusable controls, portals or editor commands are needed.
function PreviewTool({ icon: Icon }: { icon: typeof Bold }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-gray-600">
      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
    </span>
  );
}

function PreviewDivider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-gray-200" />;
}

function PreviewHighlighter() {
  return (
    <span className="flex h-7 w-7 shrink-0 flex-col items-center justify-center rounded-[8px] text-gray-700">
      <Highlighter className="h-3.5 w-3.5" />
      <span className="mt-0.5 h-[3px] w-4 rounded-full bg-yellow-200" />
    </span>
  );
}


function MiniEditorToolbar() {
  return (
    <div className="pointer-events-none w-full select-none border-b border-gray-200 bg-gray-50/80 px-3 py-2">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
        <span className="flex h-8 items-center gap-1.5 rounded-[8px] border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-700 shadow-2xs">
          <Type size={14} />
          Inter
          <ChevronDown size={10} />
        </span>
        <span className="flex h-8 overflow-hidden rounded-[8px] border border-gray-200 bg-white text-[11px] text-gray-700 shadow-2xs">
          <span className="flex items-center px-2.5">16px</span>
          <span className="flex w-4 flex-col items-center justify-center border-l border-gray-200">
            <ChevronDown size={9} className="rotate-180" />
            <span className="my-0.5 w-full border-t border-gray-200" />
            <ChevronDown size={9} />
          </span>
        </span>
        <PreviewDivider />
        <span className="mx-1 h-5 w-5 rounded-full border border-black/20 bg-gray-900 ring-2 ring-inset ring-white" />
        <PreviewDivider />
        <div className="flex items-center">
          <PreviewTool icon={Bold} />
          <PreviewTool icon={Italic} />
          <PreviewTool icon={Strikethrough} />
          <PreviewHighlighter />
        </div>
        <PreviewDivider />
        <div className="flex items-center">
          <PreviewTool icon={AlignLeft} />
          <PreviewTool icon={AlignCenter} />
          <PreviewTool icon={AlignRight} />
        </div>
        <PreviewDivider />
        <PreviewTool icon={ImagePlus} />
      </div>
    </div>
  );
}


function PreviewBubbleMenu({
  open,
  choosing,
}: {
  open: boolean;
  choosing: boolean;
}) {
  const actions = [
    { icon: PencilSparkles, label: "Simplify" },
    { icon: Smile, label: "Emojify text" },
    { icon: BookOpen, label: "Explain better" },
    { icon: ListChecks, label: "Summarize" },
    { icon: Lightbulb, label: "Real-World Example" },
  ];
  return (
    <div className="absolute  w-fit left-[50%] -translate-x-[50%] top-full z-10 mt-2">
      <div className="flex  items-center justify-center gap-0.5 rounded-[8px] border border-gray-200 bg-white p-1
       shadow-[1px_1px_1px_rgba(0,0,0,0.1)]">
        <span className="flex items-center gap-0.5 px-1">
          <Type size={15} />
          <ChevronDown size={10} />
        </span>
        <PreviewTool icon={Bold} />
        <PreviewTool icon={Italic} />
        <PreviewTool icon={Underline} />
        <PreviewTool icon={Link2} />
        <PreviewHighlighter />
        <PreviewDivider />
        <div
          className={`flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-gray-700 ${open ? "bg-gray-100" : ""}`}
        >
          <Sparkles size={14} className="text-blue-500" />
          Notium
          <ChevronDown size={10} />
        </div>
      </div>

      {open && (
        <div className="ml-auto mt-1.5 w-[204px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg shadow-gray-200/60">
          <div
            className={`flex items-center gap-2 rounded-md px-2 py-2 text-[11px] font-medium ${choosing ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
          >
            <Sparkles size={14} className="text-blue-500" />
            Generate with Notium
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-2 text-[11px] font-medium text-gray-700">
            <MessageSquarePlus size={14} className="text-blue-500" />
            Ask Notium
          </div>
          <div className="mx-2 my-1.5 h-px bg-gray-100" />
          <div className="mb-1 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            Quick Actions
          </div>
          {actions.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-gray-600"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function PreviewAiDraft({
  text,
  count,
  complete,
}: {
  text: string;
  count: number;
  complete: boolean;
}) {
  return (
    <div className="rounded-xl border-2 border-blue-400 bg-blue-50/30 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold text-blue-700">
        {complete ? (
          <Sparkles size={13} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 motion-safe:animate-pulse" />
        )}
        {complete ? "Your draft is ready" : "Notium is writing…"}
      </div>

      <h5 className="mb-2 text-[15px] font-semibold text-gray-900">
        The building blocks of proteins
      </h5>
      <p className="min-h-[96px] text-[12px] leading-6 text-gray-600">
        {text.slice(0, count)}
        {!complete && (
          <span className="ml-0.5 inline-block h-3 w-0.5 bg-blue-600 align-middle" />
        )}
      </p>
      <div
        className={`mt-4 flex min-h-10 flex-wrap items-center justify-between gap-2 border-t border-purple-200 pt-3 ${complete ? "opacity-100" : "invisible"}`}
      >
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-[10px] font-medium text-white">
            <PreviewCheck size={13} />
            Accept
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[10px] text-gray-700">
            <RotateCcw size={12} />
            Retry
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-[10px] text-red-600">
            <Trash size={12} />
            Decline
          </span>
        </div>
        <span className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1.5 text-[10px] text-gray-700">
          <Sparkles size={12} />
          Modify
        </span>
      </div>
    </div>
  );
}

function EditorGenerationPreview() {
  // Idle → drag-select → formatting bubble → Notium menu → stream → review.
  // Hold the completed draft so all four choices remain easy to read.
  const { ref, time } = useFeaturePreview(12000);
  const text =
    "Proteins are built from amino acids linked by peptide bonds. They act as enzymes, transport molecules, and provide structural support.";
  const generatingStart = 4400;
  const showDraft = time >= generatingStart;
  const selection = showDraft
    ? 0
    : Math.min(1, Math.max(0, (time - 600) / 800));
  const bubble = time >= 1550 && !showDraft;
  const count = Math.max(
    0,
    Math.min(text.length, Math.floor((time - generatingStart) / 20)),
  );

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Animated demo: select text, open Notium's formatting and AI menu, generate a draft, then review Accept, Retry, Decline or Modify options."
      className="min-w-0 p-5 sm:p-7 md:pl-0"
    >
      <div
        aria-hidden="true"
        className={`${miniSurface} pointer-events-none select-none`}
      >
        <MiniEditorToolbar />

        <div className="relative min-h-[375px] p-4 sm:p-6">
          <div className={miniLabel}>BIOLOGY / YOUR NOTES</div>
          <h4 className="mt-3 text-[18px] font-semibold tracking-tight text-gray-800">
            The Chemistry of Life
          </h4>
          <div className="relative mt-3">
            <p className="text-[12px] leading-6">
              Life is built upon{" "}
              <span className="relative inline-block">
                <span
                  className="absolute inset-0 origin-left bg-blue-200/80"
                  style={{ transform: `scaleX(${selection})` }}
                />
                <span className="relative">carbon-based molecules.</span>
                {selection > 0 && selection < 1 && (
                  <span
                    className="absolute inset-y-0 w-px bg-blue-600"
                    style={{ left: `${selection * 100}%` }}
                  />
                )}
              </span>
            </p>
            {bubble && (
              <PreviewBubbleMenu open={time >= 2100} choosing={time >= 3750} />
            )}
          </div>
          <div className="mt-5">
            {showDraft && (
              <PreviewAiDraft
                text={text}
                count={count}
                complete={count === text.length}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const studyPreviewData = [
  { day: "Mon", minutes: 0 },
  { day: "Tue", minutes: 0 },
  { day: "Wed", minutes: 0 },
  { day: "Thu", minutes: 0 },
  { day: "Fri", minutes: 0 },
  { day: "Sat", minutes: 4 },
  { day: "Sun", minutes: 19 },
];

function StudyStatsPreview() {
  const { ref, time } = useFeaturePreview();
  const progress = Math.min(1, Math.max(0, (time - 350) / 1800));
  return (
    <div
      ref={ref}
      role="img"
      aria-label="Demo study statistics: two activities, 47 percent accuracy and 23 minutes of study this week."
      className="px-5 pb-6 sm:px-7"
    >
      <div aria-hidden="true">
        <div className="mb-3 grid grid-cols-2 gap-3">
          {[
            ["Activities completed", String(Math.round(2 * progress))],
            ["Average quiz accuracy", `${Math.round(47 * progress)}%`],
          ].map(([label, value]) => (
            <div key={label} className={`${miniSurface} px-4 py-3`}>
              <div className="text-[10px] text-gray-500">{label}</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className={`${miniSurface} p-4`}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold">Study Time</h4>
              <p className="mt-1 text-[10px] text-gray-400">
                21 Sept – 27 Sept
              </p>
            </div>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] text-blue-600">
              ◷ {Math.round(23 * progress)} min
            </span>
          </div>
          <div className="mt-4 h-[126px] w-full min-w-0">
            {/* SVG is used only by Recharts for the actual chart, never for UI. */}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={studyPreviewData.map((point) => ({
                  ...point,
                  minutes: point.minutes * progress,
                }))}
                margin={{ top: 5, right: 8, left: -26, bottom: 0 }}
                accessibilityLayer={false}
              >
                <CartesianGrid vertical={false} stroke="#f0f1f3" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                />
                <YAxis
                  domain={[0, 20]}
                  ticks={[0, 10, 20]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                />
                <Area
                  type="linear"
                  dataKey="minutes"
                  stroke="#5167ff"
                  strokeWidth={2}
                  fill="#eef2ff"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-gray-500">
            ↗ Your focus time is trending upward
          </p>
        </div>
      </div>
    </div>
  );
}

function LiveTranscriptPreview() {
  const { ref, time } = useFeaturePreview();
  const words =
    "All living things are made of cells. Cells are the basic functional units of life, and every cell comes from a pre-existing cell.".split(
      " ",
    );
  const active = Math.min(
    words.length - 1,
    Math.floor(Math.max(0, time - 400) / 230),
  );
  const progress = time < 400 ? 0 : (active + 1) / words.length;
  return (
    <div
      ref={ref}
      role="img"
      aria-label="Demo: follow Charlie's podcast with a synchronized transcript and playback progress."
      className="px-5 pb-6 sm:px-7"
    >
      <div aria-hidden="true" className={`${miniSurface} p-4 sm:p-5`}>
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-medium text-gray-600 ring-1 ring-gray-200">
              C
            </span>
            <span className="font-medium text-gray-700">Charlie</span>
            <span className="text-gray-400">01:12</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[9px] text-gray-500">
              <span className="h-1 w-1 rounded-full bg-blue-600" />
              Speaking
            </span>
          </div>
          <p className="min-h-[100px] text-left text-[12px] leading-[26px] text-gray-500">
            {words.map((word, i) => (
              <span key={i}>
                <span
                  className={`rounded px-0.5 py-1 ${i === active ? "bg-blue-600 text-white" : i < active ? "text-gray-800" : ""}`}
                >
                  {word}
                </span>{" "}
              </span>
            ))}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center gap-[3px] rounded-full bg-blue-600">
            <span className="h-2.5 w-[3px] rounded-sm bg-white" />
            <span className="h-2.5 w-[3px] rounded-sm bg-white" />
          </span>
          <div className="flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 motion-safe:transition-[width] motion-safe:duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[9px] tabular-nums text-gray-400">
              <span>
                1:{String(12 + Math.floor(active * 0.23)).padStart(2, "0")}
              </span>
              <span>1:18</span>
            </div>
          </div>
          <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
            1×
          </span>
        </div>
      </div>
    </div>
  );
}


function FlashcardEditorPreview() {
  const { ref, time } = useFeaturePreview(10500);
  const question = "What type of bonds link amino acids together?";
  const answer = "Peptide bonds";
  const appeared = time >= 1500;
  const frontCount = Math.min(
    question.length,
    Math.max(0, Math.floor((time - 2100) / 48)),
  );
  const backCount = Math.min(
    answer.length,
    Math.max(0, Math.floor((time - 4750) / 85)),
  );
  const pressingSave = time >= 6900 && time < 7200;
  const saved = time >= 7200;
  const typingFront = time >= 2100 && frontCount < question.length;
  const typingBack = time >= 4750 && backCount < answer.length;
  return (
    <div
      ref={ref}
      role="img"
      aria-label="Demo: start with zero cards, add a card, type its front and back, then save changes."
      className="p-5 sm:p-7 md:pl-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none min-h-[285px] select-none"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] text-gray-500">
            {appeared ? "1 card" : "0 cards"}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="mb-4 flex justify-center">
          <span
            className={`rounded-lg border border-gray-200 px-4 py-2 text-[11px] text-gray-600 motion-safe:transition-transform 
              ${time >= 1150 && time < 1500 ? "translate-y-0.5 scale-95 bg-gray-100" : "bg-gray-50"}`}
          >
            + Add New Card
          </span>
        </div>

        <style>{`
          @keyframes notiumFlashcardEnter {
            from { opacity: 0; transform: translate3d(0, 6px, 0); }
            to { opacity: 1; transform: translate3d(0, 0, 0); }
          }
          @media (prefers-reduced-motion: no-preference) {
            .notium-flashcard-enter {
              animation: notiumFlashcardEnter 220ms cubic-bezier(.22, 1, .36, 1) both;
            }
          }
        `}</style>
        {/* Reserve the card's space; CSS runs the entrance independently of the demo clock. */}
          <div className={appeared ? "notium-flashcard-enter" : "invisible"}>
            <div className={miniSurface}>
              <MiniEditorToolbar />

              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div
                  className={`min-h-[148px] p-4 ${typingFront ? "ring-2 ring-inset ring-blue-500 rounded-bl-[16px]" : ""}`}
                >
                  <div className={miniLabel}>Front</div>
                  <p className="mt-4 text-[12px] leading-6">
                    {question.slice(0, frontCount)}
                    {typingFront && (
                      <span className="ml-0.5 inline-block h-3 w-px bg-blue-600" />
                    )}
                  </p>
                </div>

                <div
                  className={`min-h-[148px] p-4 ${typingBack ? "ring-2 ring-inset ring-blue-500 rounded-br-[16px]" : ""}`}
                >
                  <div className={miniLabel}>Back</div>
                  <p className="mt-4 text-[12px] leading-6">
                    {answer.slice(0, backCount)}
                    {typingBack && (
                      <span className="ml-0.5 inline-block h-3 w-px bg-blue-600" />
                    )}
                  </p>
                </div>
              </div>

            </div>
            <div className="mt-4 flex justify-end">
              <span
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium motion-safe:transition-all ${saved ? "bg-blue-50 text-blue-600" : backCount === answer.length ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"} ${pressingSave ? "translate-y-0.5 scale-95" : ""}`}
              >
                {saved && <PreviewCheck size={13} />}
                {saved ? "Changes saved" : "Save changes"}
              </span>
            </div>
          </div>
      </div>
    </div>
  );
}

// The caret lives at the last selected character, so it follows the selection
// even when a passage wraps to another line on a narrow screen.
function PreviewRemoteSelection({ text, progress, name, color }: {
  text: string; progress: number; name: string; color: string;
}) {
  const selected = Math.floor(Math.max(0, Math.min(1, progress)) * text.length);
  return <span>{text.split("").map((character, index) => <span key={index} className="relative" style={{ backgroundColor: index < selected ? `${color}26` : undefined }}>{character}{selected > 0 && index === selected - 1 && <span className="pointer-events-none absolute -right-px top-0 h-[1.15em] border-r-2" style={{ borderColor: color }}><span className="absolute bottom-full right-[-2px] whitespace-nowrap rounded-t px-1 text-[9px] font-medium leading-[15px] tracking-normal text-white" style={{ backgroundColor: color }}>{name}</span></span>}</span>)}</span>;
}

function CollaborationPreview() {
  const { ref, time } = useFeaturePreview(9000);
  const first = Math.min(1, Math.max(0, (time - 450) / 1600));
  const second = Math.min(1, Math.max(0, (time - 2700) / 2400));
  return (
    <div
      ref={ref}
      role="img"
      aria-label="Demo: Maya and Alex select passages together; their name labels follow the moving selection edges."
      className="p-5 sm:p-7 md:pl-0"
    >
      <div aria-hidden="true" className={miniSurface}>
        <div className="p-5 text-[12px] leading-[23px] text-gray-600 sm:p-6 ">
          
          <h4 className="pb-2 pt-3 text-[17px] font-semibold tracking-tight text-gray-800 ">
            <PreviewRemoteSelection
              text="The Chemistry of Life"
              progress={first}
              name="Maya"
              color="#155dfc"
            />
          </h4>

          <p className="mb-2">
            Life is built upon carbon-based molecules. Small units called
            monomers join together to form larger polymers.
          </p>
          <p className="mb-2">
            <b className="font-medium text-gray-800">Carbohydrates:</b> provide
            quick energy and structural support. Simple sugars are their
            building blocks.
          </p>
          <p className="mb-2">
            <b className="font-medium text-gray-800">Lipids:</b> store energy
            and form cell membranes. They include fats, oils, and phospholipids.
          </p>
          <p className="mb-2">
            <b className="font-medium text-gray-800">Proteins:</b> amino acid
            chains linked by peptide bonds. They function as enzymes and
            transport molecules.
          </p>
          <p className="pt-1">
            <b className="font-medium text-gray-800">Nucleic acids: </b>
            <PreviewRemoteSelection
              text="DNA and RNA store genetic information using sequences of nucleotide monomers."
              progress={second}
              name="Alex"
              color="#F59E0B"
            />
          </p>
        </div>
      </div>
    </div>
  );
}


function AdditionalStudyFeatures() {
  const panel =
    "relative overflow-hidden rounded-[28px] bg-white sm:rounded-[32px]";
  const heading =
    "text-[24px] font-medium leading-tight tracking-[-.035em] text-gray-800 sm:text-[28px]";
  const copy =
    "mt-3 max-w-[370px] text-[14px] leading-6 text-gray-500 sm:text-[15px]";

  return (
    <div className="mx-auto max-w-[1160px]">
      <div className="mx-auto mb-12 max-w-[620px] text-center sm:mb-16">
        <h2 className="mt-5 text-[clamp(2.2rem,4vw,3.3rem)] font-medium leading-[1.08] tracking-[-.045em] text-gray-800">
          But wait, there's <span className="bg-blue-200">more</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[450px] text-[15px] leading-6 text-gray-500">
          From your first lecture to your next breakthrough.
          <br className="hidden sm:block" /> Everything you need to keep
          learning, together.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">

        <article
          className={`${panel} grid items-center md:col-span-2 md:grid-cols-[.85fr_1.15fr]`}
        >
          <div className="p-7 sm:p-10 lg:p-12">
            <h3 className={heading}>Supercharge your notes with ai</h3>
            <p className={copy}>
              Generate, explain, or summarize text right inside your notes. Let
              Notium handle the first draft, and make it your own.
            </p>
          </div>
          <EditorGenerationPreview />
        </article>

        <article className={`${panel} flex flex-col`}>
          <div className="p-7 pb-5 sm:p-9 sm:pb-6">
            <h3 className={heading}>See your progress.</h3>
            <p className={copy}>
              Track your study time, completed activities, and quiz accuracy.
              Every session adds up.
            </p>
          </div>
          <div className="mt-auto">
            <StudyStatsPreview />
          </div>
        </article>

        <article className={`${panel} flex flex-col`}>
          <div className="p-7 pb-5 sm:p-9 sm:pb-6">
            <h3 className={heading}>Live transcript</h3>
            <p className={copy}>
              Listen and read along with a live transcript that keeps pace with
              your study podcast.
            </p>
          </div>
          <div className="mt-auto">
            <LiveTranscriptPreview />
          </div>
        </article>

        <article
          className={`${panel} grid items-center md:col-span-2 md:grid-cols-[.85fr_1.15fr]`}
        >
          <div className="p-7 sm:p-10 lg:p-12">
            <h3 className={heading}>Customize your flashcards</h3>
            <p className={copy}>
              Create your own flashcards or fine-tune an existing set. Edit both
              sides to study exactly what matters to you.
            </p>
          </div>
          <FlashcardEditorPreview />
        </article>

        <article
          className={`${panel} grid items-center md:col-span-2 md:grid-cols-[.8fr_1.2fr]`}
        >
          <div className="p-7 sm:p-10 lg:p-12">
            <h3 className={heading}>
              Better notes.
              <br />
              Made together.
            </h3>
            <p className={copy}>
              See what your study partners are highlighting in real time.
              Different colors and names keep everyone on the same page.
            </p>
          </div>
          <CollaborationPreview />
        </article>

      </div>
    </div>
  );
}

const ToolIcon = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => {
  return (
    <span className="relative isolate grid size-11 shrink-0 place-items-center">
      {/* Szara poświata pod ikoną */}
      <span
        aria-hidden
        className="
          absolute inset-[4px] -z-10 rounded-full
          bg-[radial-gradient(circle,rgba(100,116,139,0.24)_0%,rgba(203,213,225,0.14)_48%,transparent_74%)]
          blur-[4px]
        "
      />

      <img
        src={src}
        alt={alt}
        className="
          relative z-10 max-h-[38px] w-[38px] object-contain
          drop-shadow-[0_3px_3px_rgba(15,23,42,0.16)]
        "
      />
    </span>
  );
};


const studyTools = [
  {
    label: "Notes",
    src: "/LandingPage/header/header_notes.png",
    alt: "Notes doodle",
  },
  {
    label: "Quizzes",
    src: "/LandingPage/header/header_quiz.png",
    alt: "Quiz doodle",
  },
  {
    label: "Flashcards",
    src: "/LandingPage/header/header_flashcards.png",
    alt: "Flashcards doodle",
  },
  {
    label: "Podcast",
    src: "/LandingPage/header/header_headphones.png",
    alt: "Podcast doodle",
  },
];




export default function LandingPageLayout({ onboarding = {} }: { onboarding?: Omit<NotiumOnboardingProps, "onClose"> } = {}) {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const apiBaseUrl = getApiBaseUrl();
  const [googleReturnState] = useState(getGoogleReturnState);
  const [googleReturning, setGoogleReturning] = useState(Boolean(googleReturnState));
  const [googleError, setGoogleError] = useState("");
  const [oauthResume, setOAuthResume] = useState<OnboardingResume | undefined>(undefined);
  const dashboardHref = onboarding.dashboardHref ?? "/dashboard";
  const providedServices = onboarding.services;
  // Shuffle once after mount, never during renders or an active animation loop.
  // The deterministic initial state also keeps server/client hydration consistent.
  const [reviewRows, setReviewRows] = useState(() => createReviewRows());
  useEffect(() => { setReviewRows(createReviewRows(true)); }, []);

  const [authOpen, setAuthOpen] = useState(false);
  // const [videoPlaying, setVideoPlaying] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const reduceFaqMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  const services: OnboardingServices = {
    register:
      providedServices?.register ??
      (async (registration: Registration) => {
        const data = await postJson<AuthResponse>(
          apiBaseUrl,
          "/api/auth/register",
          {
            ...registration,
            username:
              [registration.firstName, registration.lastName]
                .filter(Boolean)
                .join(" ") || registration.email.split("@")[0],
          },
        );
        saveAuthSession(data);
      }),
    startGoogleRegistration:
      providedServices?.startGoogleRegistration ??
      (async ({ profile, consentRequestId }) => {
        await startGoogleOAuth(apiBaseUrl, { mode: "sign_up", profile, consentRequestId });
      }),
    saveGoogleProfile:
      providedServices?.saveGoogleProfile ??
      (async (names) => {
        const data = await postJson<{ user: AuthUser }>(apiBaseUrl, "/api/auth/google/profile", names, true);
        localStorage.setItem("user", JSON.stringify(data.user));
      }),
    requestParentalConsent:
      providedServices?.requestParentalConsent ??
      (async () => {
        throw new Error(
          "Parental consent is not connected yet. Please ask a parent or guardian to try again later.",
        );
      }),
    checkParentalConsent:
      providedServices?.checkParentalConsent ?? (async () => false),
    checkout: providedServices?.checkout ?? (async () => {}),
    complete: providedServices?.complete ?? (async (profile, consentRequestId) => {
      const data = await postJson<{ user: AuthUser }>(apiBaseUrl, "/api/auth/onboarding/complete", { profile, consentRequestId }, true);
      localStorage.setItem("user", JSON.stringify(data.user));
    }),
  };

  useEffect(() => {
    if (!googleReturnState) return;
    let active = true;
    clearGoogleReturnState();
    const draft = readOnboardingDraft();
    void consumeGoogleOAuthResult(apiBaseUrl, googleReturnState).then(result => {
      if (!active) return;
      if (!result.ok) {
        if (result.mode === "sign_up") {
          const restored = draft ?? (isStudyProfile(result.profile)
            ? { profile: result.profile, step: "account" as const, registered: false } : undefined);
          setOAuthResume(restored ? { ...restored, error: result.message } : undefined);
          setOnboardingOpen(true);
        } else {
          setGoogleError(result.message);
          setAuthOpen(true);
        }
        return;
      }
      saveAuthSession(result);
      if (result.next === "dashboard") {
        clearOnboardingDraft();
        window.location.assign(dashboardHref);
        return;
      }
      const profile = isStudyProfile(result.profile) ? result.profile : {
        goal: "", age: "", level: "", familiarity: "", subject: "", minutes: "", source: "", exam: "", streak: "",
      };
      const hasPreferences = Boolean(profile.goal && profile.age && profile.level && profile.subject && profile.minutes && profile.source && profile.exam);
      const restored: OnboardingResume = {
        profile, step: hasPreferences ? "google-profile" : "welcome", registered: true, confirmGoogleProfile: true,
        firstName: result.firstName, lastName: result.lastName,
        consentRequestId: draft?.consentRequestId, consentVerified: draft?.consentVerified,
      };
      storeOnboardingDraft(restored);
      setOAuthResume(restored);
      setOnboardingOpen(true);
    }).catch(error => {
      if (!active) return;
      const message = error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
      if (draft) {
        setOAuthResume({ ...draft, step: "account", registered: false, error: message });
        setOnboardingOpen(true);
      } else { setGoogleError(message); setAuthOpen(true); }
    }).finally(() => { if (active) setGoogleReturning(false); });
    return () => { active = false; };
  }, [apiBaseUrl, dashboardHref, googleReturnState]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="top"
      className="min-h-screen bg-[#f6f7fb] font-[Inter,Arial,sans-serif] text-[#17181b] relative"
    >
      <style>{`@keyframes reviewLeft{to{transform:translateX(-50%)}}@keyframes reviewRight{from{transform:translateX(-50%)}to{transform:translateX(0)}}@media(prefers-reduced-motion:no-preference){.review-left{animation:reviewLeft 58s linear infinite}.review-right{animation:reviewRight 64s linear infinite}.review-row:hover{animation-play-state:paused}}`}</style>

      <header className="fixed inset-x-0 top-3 z-50 mx-auto flex h-[68px] w-full max-w-[1200px] items-center px-3">
        <div
          className={`
            mx-auto mt-5 flex w-fit items-center
            gap-8 sm:gap-5 lg:gap-12 xl:gap-15
            rounded-full border px-3 py-3 lg:px-5 lg:py-5
            transition-[background-color,border-color,box-shadow,backdrop-filter]
            duration-300 ease-out
            ${
              isScrolled
                ? "border-white/60 bg-white/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(15,23,42,0.08)]"
                : "border-transparent bg-white"
            }
          `}
        >
          <Logo />

          <nav className="ml-7 text-[12px] items-center gap-0 lg:text-[14px] font-semibold sm:flex hidden">
            <NavigationMenu className="!border-0">

              <NavigationMenuList className="!border-0">
                <NavigationMenuItem className="!border-0">
                  <NavigationMenuTrigger className="mr-2 text-[12px] font-semibold lg:text-[14px]">
                    Study tools
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="!border-0 p-2">
                    {studyTools.map((tool) => (
                      <NavigationMenuLink
                        key={tool.label}
                        render={
                          <a
                            href="#progress"
                            className="
                              group flex min-w-[180px] items-center gap-2.5
                              rounded-xl px-2 py-1.5
                              transition-colors hover:bg-gray-50
                            "
                          />
                        }
                      >
                        <ToolIcon src={tool.src} alt={tool.alt} />

                        <span className="text-sm font-medium text-gray-700">
                          {tool.label}
                        </span>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>

            </NavigationMenu>            
            {/* <a href="#features">Study tools</a> */}
            <a href="#progress">Progress</a>
            <a href="#reviews" className="ml-5">Students</a>
          </nav>

          <div className="flex">
            <button
              onClick={() => setAuthOpen(true)}
              className="ml-auto items-center gap-2 text-sm font-[550] hover:bg-gray-100 hover:border-gray-300
            text-gray-900 px-4 py-2 rounded-full
              border-2 border-gray-200 sm:flex lg:text-[17px] text-[13px]"
            >
              Sign in
            </button>

            <button
              onClick={() => setOnboardingOpen(true)}
              className="ml-3 px-4 py-2 rounded-full  text-sm font-[550] hover:bg-gray-800 text-white bg-gray-900 lg:text-[17px] text-[13px]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          id="features"
          className="bg-[#f6f7fb] pb-20 sm:pb-24  h-[120vh] relative flex justify-start items-start"
        >
          <div className="h-[100vh] w-full">
            <div className="mx-auto h-full w-full  flex justify-center items-center text-center">
              {/* Left side of the section */}
              <div className="relative flex h-full w-full items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-0 hidden xl:block"
                  aria-hidden="true"
                >
                  <img
                    src="/LandingPage/duck.png"
                    alt=""
                    className="absolute left-[7%] top-[18%] w-[145px] -rotate-[12deg] drop-shadow-[0_14px_18px_rgba(23,24,27,0.08)] 2xl:left-[12%] 2xl:w-[180px]"
                  />
                  <img
                    src="/LandingPage/LandingPencil.png"
                    alt=""
                    className="absolute bottom-[10%] left-[18%] w-[145px] rotate-[19deg] drop-shadow-[0_14px_18px_rgba(23,24,27,0.08)] 2xl:left-[25%] 2xl:w-[175px]"
                  />
                </div>
              </div>

              <div className="flex flex-col w-full justify-center items-center text-center">
                <img
                  src="/LandingPage/laptop.png"
                  alt=""
                  className="mb-5 w-[250px] h-auto"
                />

                <h1 className="text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-[-.04em]">
                  Your <span className="bg-blue-600/25 px-[2px]">last</span>{" "}
                  study tool
                </h1>

                <p className="mx-auto mt-5 max-w-[660px] font-[350] text-[17px] leading-7">
                  Discover, create, and master your study material — all in one
                  place. Take control of your learning and reach your goals with
                  Notium.
                </p>

                <Button
                  onClick={() => setOnboardingOpen(true)}
                  className="mt-7 px-9 py-9 rounded-full bg-blue-600  text-[18px] font-[500] text-white
                    hover:bg-blue-600/90"
                >
                  Try for free
                </Button>
              </div>

              {/* Right side of the section */}
              <div className="relative flex h-full w-full items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-0 hidden xl:block"
                  aria-hidden="true"
                >
                  <img
                    src="/LandingPage/landingCoffee.png"
                    alt=""
                    className="absolute right-[7%] top-[17%] w-[155px] rotate-[11deg] drop-shadow-[0_14px_18px_rgba(23,24,27,0.08)] 2xl:right-[13%] 2xl:w-[190px]"
                  />
                  <img
                    src="/LandingPage/paperClip.png"
                    alt=""
                    className="absolute bottom-[15%] right-[16%] w-[135px] rotate-[13deg] drop-shadow-[0_14px_18px_rgba(23,24,27,0.08)] 2xl:right-[25%] 2xl:w-[165px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-tl-[20%] rounded-tr-[20%] pb-24 pt-20 sm:pb-42 rounded-bl-[20%] rounded-br-[20%]">
          <div className={container}>
            <h2 className="text-center text-[clamp(2.5rem,5vw,4.1rem)] leading-[1.05] tracking-[-.035em]">
              See how it{" "}
              <span className="underline underline-offset-4">works</span>
            </h2>

            <p className="mx-auto mt-5 max-w-[470px] text-center text-[15px] leading-6 text-[#7f766d]">
              You drop your files, we make you study materials. You get better
              grades.
            </p>

            <StudyShowcase />

          </div>
        </section>

        {/* Progress Section */}
        <section
          id="progress"
          className="scroll-mt-24 bg-[#f5f5f7] py-20 sm:py-28"
        >
          <div className={container}>
            <AdditionalStudyFeatures />
          </div>
        </section>

        <section id="reviews" className="overflow-hidden pb-0 pt-20">
          <div className="text-center flex flex-col justify-center items-center">
            <div className="mx-auto flex justify-center items-center -translate-x-[30px]">  
              <Heart className="h-25 w-25  text-[#ff418b] mr-3" />
              <h2 className="inline-block -rotate-3 text-[clamp(3.5rem,8vw,6.3rem)] font-black tracking-[-.075em] text-[#11182b]">
                Loved
              </h2>              
            </div>


            <div className="mx-auto flex justify-center items-center">
              <p className="mt-1 text-[20px] font-semibold">
                By students around the world
              </p>     

              <svg viewBox="0 0 70 70" className="ml-2 h-16 w-16 rotate-6" aria-hidden="true">
                <circle cx="35" cy="35" r="28" fill="#155dfc" />
                <path d="M14 18 23 11 33 8 36 16 30 20 32 26 25 31 20 29 18 23 12 25Z" fill="#75dc83" />
                <path d="m24 33 10 2 7 8-5 8-3 10-5-3-1-10-6-7Z" fill="#75dc83" />
                <path d="m44 13 10 6 6 9-7 3-6-4-5 4-5-6 3-6Z" fill="#75dc83" />
                <path d="m45 33 11 2 4 9-7 7-6-3-3-8Z" fill="#75dc83" />
                <path d="m49 54 6-3 4 4-7 4Z" fill="#75dc83" />
                <path d="M17 17a25 25 0 0 1 15-7" fill="none" stroke="#8bc5ff" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>


            <p className="mt-2 text-xs text-gray-400">
              Let us know what u think #Notium on ig!
            </p>
          </div>
          <div className="relative isolate mt-14 overflow-hidden pb-14">
            {/* <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-8" style={{ background: spectrum }} /> */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-8 z-[1] h-20 bg-gradient-to-b from-[#f6f7fb] to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[#f6f7fb] to-transparent sm:w-24" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#f6f7fb] to-transparent sm:w-24" />
            
            {reviewRows.map((rowReviews, row) => {
              // Duplicate only within the same track for a seamless marquee.
              const doubled = [...rowReviews, ...rowReviews];
              return (
                <div
                  key={row}
                  className={`review-row relative z-10 mb-4 flex w-max gap-4 pr-4 ${row % 2 ? "review-right" : "review-left"}`}
                >
                  {doubled.map((r, i) => (
                    <article
                      key={`${r[3]}-${i >= rowReviews.length ? "copy" : "original"}`}
                      aria-hidden={i >= rowReviews.length ? true : undefined}
                      className="flex min-h-[224px] w-[325px] shrink-0 flex-col justify-between rounded-[18px] border border-[#e1e3e8]
                       bg-white p-5 shadow-xl"
                    >
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          
                          <span className="flex rounded-full overflow-hidden h-8 w-8 items-center justify-center bg-[#f0f1f4] text-xs font-black">
                            <img src={r[3]} alt="" className="w-full h-full"/>
                          </span>
                          <span className="text-xs font-bold text-[#71809b]">
                            {r[0]}
                          </span>
                        </div>

                        <p className="text-[16px] font-semibold leading-6 text-[#343b4c]">
                          {r[1]}
                        </p>

                      </div>

                      <div className="flex justify-between text-[15px] font-semibold text-[#71809b]">
                        <span>{Math.floor(Math.random() * 25) + 1}d&nbsp;&nbsp; <span className="text-gray-800 font-[500]">Reply</span> </span>
                        <span className="flex items-center gap-1 text-[#ff3e98]">
                          <Heart className="h-6 w-6" />
                          {r[2]}
                        </span>
                      </div>

                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <section id="faq" className="py-24 sm:py-32">
          <div className={`${container} grid gap-12 lg:grid-cols-[1fr_1.15fr]`}>
            
          
            <div className="">
              <p className="text-gray-600 text-[15px] font-[600]">Still have questions ?</p>
              <h2 className="text-[clamp(1.75rem,3vw,2.3rem)] font-semibold tracking-[-.035em]">
                Frequently asked questions, answered.
              </h2>

              <img src="/LandingPage/faq/doodle_2.png" className="w-[220px] h-auto mx-auto mt-2"/>
            </div>

            <div className="">
              {[
                [
                  "Is Notium really free?",
                  "Yes! Notium offers a generous free tier that includes note generation, flashcards, and quizzes. You can upgrade to unlock unlimited features and advanced AI capabilities.",
                ],
                [
                  "Can I use my own materials?",
                  "Yes. Build projects from PDFs, YouTube videos, images, audio, pasted text, and your own notes.",
                ],
                [
                  "Can I edit the notes after they're generated?",
                  "Absolutely! We have a full Google Docs style editor you can use to add and customize your notes.",
                ],
                [
                  "Does Notium actually improve learning?",
                  "Notium helps you practice retrieving information from memory, tracking progress, and motivating by daily streak but your results still depend on the quality of your materials and how you use them.",
                ],
                [
                  "Does it work on mobile devices?",
                  "Yes, Notium works seamlessly across all types of devices - web, tablet, and mobile. Your notes sync automatically so you can study anywhere, anytime."
                ]
              ].map(([q, a], i) => (
                <div key={q} className="relative border-b border-[#cfd1d5] px-4 sm:px-5">
                  {faq === i && (
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 border-2 border-blue-600" />
                  )}
                  <button
                    type="button"
                    id={`faq-question-${i}`}
                    onClick={() => setFaq(current => current === i ? null : i)}
                    aria-expanded={faq === i}
                    aria-controls={`faq-answer-${i}`}
                    className="flex w-full items-center justify-between gap-5 py-7 text-left text-[17px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                  >
                    <span>{q}</span>
                    <motion.span
                      aria-hidden="true"
                      className="flex shrink-0"
                      animate={{ rotate: faq === i ? 180 : 0 }}
                      transition={{ duration: reduceFaqMotion ? 0 : 0.22 }}
                    >
                      <Arrow direction="down" className="h-5 w-5" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {faq === i && (
                      <motion.div
                        key={`faq-answer-${i}`}
                        id={`faq-answer-${i}`}
                        role="region"
                        aria-labelledby={`faq-question-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: reduceFaqMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: reduceFaqMotion ? 0 : 0.18 },
                        }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[650px] pb-7 pr-5 text-[15px] leading-7 text-gray-600 sm:pr-10">
                          {a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate pb-[300px] pt-50 text-center sm:pb-[370px] lg:pb-[320px]">
          <h1 className="text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-[-.04em]">
            Start <span className="bg-blue-600/25 px-[2px]">enjoying</span> learning
          </h1>
          <Button
            onClick={() => setOnboardingOpen(true)}
            className="mt-10 px-9 py-9 rounded-full bg-blue-600  text-[18px] font-[500] text-white
              hover:bg-blue-600/90"
          >
            Try for free
          </Button>
          <img src="/LandingPage/footer/footer_2.png" alt="footer doodle" className="w-[250px] h-auto absolute bottom-[30px] left-1/2 -translate-x-1/2" /> 
        </section>
        
      </main>

      <footer className="relative bg-white pb-14 pt-20 text-gray-800 sm:pt-28 lg:pt-36">
        {/* Reference contour: flat shoulders, two smooth descents, broad central basin.
            1900 × 290 matches the visible cutout proportions in the supplied image. */}
        <svg
          viewBox="0 0 1900 290"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[calc(100%-1px)] h-[clamp(110px,15.2632vw,290px)] w-full overflow-visible text-white"
        >
          <path
            fill="currentColor"
            d="M0 0H370
               C438 0 473 34 510 79
               C546 124 579 153 625 155
               C688 157 727 168 759 204
               C797 248 823 290 950 290
               C1077 290 1103 248 1141 204
               C1173 168 1212 157 1275 155
               C1321 153 1354 124 1390 79
               C1427 34 1462 0 1530 0
               H1900V291H0Z"
          />
        </svg>
        <div className={container}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Logo />
              <p className="mt-5 text-sm leading-6 text-gray-500">
                Learn in the way that makes ideas stick.
              </p>
            </div>
            {[
              ["Product", ["Notes", "Quizzes", "Flashcards", "Podcasts"]],
              ["Resources", ["How it works", "Progress", "FAQ", "Study tips"]],
              ["Company", ["About", "Contact"]],
              ["Privacy & terms", ["Guidelines", "Terms", "Privacy"]],
            ].map(([h, links]) => (
              <div key={h as string}>
                <h3 className="mb-5 text-base font-bold">{h as string}</h3>
                <div className="space-y-3">
                  {(links as string[]).map((link) => (
                    <a
                      key={link}
                      href={link === "FAQ" ? "#faq" : "#top"}
                      className="block text-sm font-semibold text-gray-500 hover:text-blue-600"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 border-t border-gray-200 pt-6 text-xs text-gray-500">
            © {new Date().getFullYear()} Notium. All rights reserved.
          </div>
        </div>
      </footer>
      
      {googleReturning && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-5 bg-white text-gray-900">
          <img src="/LandingPage/login/login_2.png" alt="" className="h-[110px] w-[130px] object-contain" />
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 motion-reduce:animate-none" />
          <p className="text-[16px] font-medium">Finishing your Google sign-in…</p>
        </div>
      )}

      <AuthModal
        open={authOpen}
        setOpen={setAuthOpen}
        onStartOnboarding={() => setOnboardingOpen(true)}
        apiBaseUrl={apiBaseUrl}
        dashboardHref={dashboardHref}
        googleError={googleError}
      />

      {onboardingOpen && (
        <NotiumOnboarding
          {...onboarding}
          services={services}
          resume={oauthResume ?? onboarding.resume}
          dashboardHref={dashboardHref}
          onClose={() => { 
            setOnboardingOpen(false); 
            setOAuthResume(undefined); 
            clearOnboardingDraft(); 
          }}
        />
      )}

    </div>
  );
}
