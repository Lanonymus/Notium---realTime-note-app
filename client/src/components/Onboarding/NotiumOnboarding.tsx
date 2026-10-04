"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import OtherAnswerInput from "./OtherAnswerInput";
import Choices from "./Choices";
import SegmentedProgress from "./SegmentedControl";

import { clearOnboardingDraft, storeOnboardingDraft } from "./GoogleOAuth";
import type { OnboardingResume, Registration, StudyProfile } from "./GoogleOAuth";





export type OnboardingServices = {
  // Implement these on your server. Never trust age / consent status from this UI.
  register: (data: Registration) => Promise<void>;
  startGoogleRegistration?: (data: {
    profile: StudyProfile;
    consentRequestId?: string;
  }) => Promise<void>;
  saveGoogleProfile?: (data: { firstName: string; lastName: string }) => Promise<void>;
  requestParentalConsent: (email: string) => Promise<{ requestId: string }>;
  checkParentalConsent: (requestId: string) => Promise<boolean>;
  checkout: (planId: string) => Promise<void>; // Resolve only after confirmed payment.
  complete: (profile: StudyProfile, consentRequestId?: string) => Promise<void>;
};

export type NotiumOnboardingProps = {
  onClose: () => void;
  onComplete?: (profile: StudyProfile) => void;
  services?: OnboardingServices;
  previewMode?: boolean;
  // Keep this threshold aligned with PARENTAL_CONSENT_AGE on the backend.
  // Production must enforce its consent policy using server-side records.
  parentalConsentAge?: number;
  dashboardHref?: string;
  termsHref?: string;
  privacyHref?: string;
  /** Restored by the landing page after a server-side Google OAuth redirect. */
  resume?: OnboardingResume;
};

const initialProfile: StudyProfile = {
  goal: "",
  age: "",
  level: "",
  familiarity: "",
  subject: "",
  minutes: "",
  source: "",
  exam: "",
  streak: "",
};

const baseSteps = [
  "welcome",
  "goal",
  "age",
  "level",
  "subject",
  "minutes",
  "source",
  "exam",
  "account",
  "streak",
  "journey",
] as const;

type Step = (typeof baseSteps)[number] | "parent" | "google-profile";
type OtherAnswerKey = "level" | "subject" | "source";
type Art =
  | "wave"
  | "target"
  | "book"
  | "science"
  | "clock"
  | "megaphone"
  | "calendar"
  | "shield"
  | "flag"
  | "fire"
  | "crown"
  | "rocket"
  | "cards"
  | "audio"
  | "check";


const headings: Record<Step, [string, string?, Art?]> = {
  welcome: [
    "Welcome on board",
    "Let's customize your experience"
  ],
  goal: [
    "What brings you to Notium?",
    "There’s no wrong reason to learn something new.",
    "target",
  ],
  age: [
    "How old are you?",
    "This helps us provide the right experience for your age.",
    "shield",
  ],
  parent: [
    "Let’s bring a grown-up on board.",
    "Ask a parent or guardian to help. We need their verified permission before you create an account.",
    "shield",
  ],
  level: [
    "Where are you in your learning journey?",
    "We’ll use this as a starting point. You can always change it.",
    "book",
  ],
  subject: [
    "What are you studying most?",
    "Pick one to start. Your other subjects can join later.",
    "science",
  ],
  minutes: [
    "How much time feels right?",
    "A small, consistent session is a great place to start.",
    "clock",
  ],
  source: [
    "How did you hear about us?",
    "Help us find more curious people like you.",
    "megaphone",
  ],
  exam: [
    "When is your next exam?",
    "We’ll keep your timeline in mind.",
    "calendar",
  ],
  account: [
    "Create a free profile to discover your learning plan",
    undefined,
    "wave",
  ],
  journey: [
    "You’re all set.",
    "Your next chapter starts here. We’ve shaped a learning plan around your choices.",
    "flag",
  ],
  "google-profile": ["Complete your profile to get started", ""],
  streak: [
    "Build a long-term habit.",
    "Setting a streak goal helps you stay consistent",
    "fire",
  ],
};

const levelImages: Record<string, string> = {
  "Middle school": "/Onboarding/level/level_middleSchool.png",
  "High school": "/Onboarding/level/level_highSchool.png",
  Undergraduate: "/Onboarding/level/level_undergraduate.png",
  "Graduate student": "/Onboarding/level/level_graduate.png",
  Professional: "/Onboarding/level/level_professional.png",
  Other: "/Onboarding/level/level_graduate.png",
};

const defaultLevelImage = "/Onboarding/level/level_graduate.png";

const subjectImages: Record<string, string> = {
  Biology: "/Onboarding/subject/subject_biology.png",
  Chemistry: "/Onboarding/subject/subject_chemistry.png",
  Mathematics: "/Onboarding/subject/subject_math.png",
  "Computer science": "/Onboarding/subject/subject_cs.png",
  Physics: "/Onboarding/subject/subject_physics.png",
  Psychology: "/Onboarding/subject/subject_psychology.png",
  Languages: "/Onboarding/subject/subject_languages.png",
  History: "/Onboarding/subject/subject_history.png",
  Economics: "/Onboarding/subject/subject_economics.png",
};

const defaultSubjectImage = "/Onboarding/subject/subject_biology.png";

const primary = `
  box-border mt-0 h-[52px] w-[285px] shrink-0 cursor-pointer rounded-full
  border-0 border-b-4 border-black bg-[#383838]
  text-[16px] font-[500] text-white

  transition-[height,margin-top,border-width,transform]
  duration-100 ease-out

  hover:bg-black/75

  active:mt-[4px]
  active:h-[48px]
  active:border-b-0

  disabled:cursor-not-allowed
  disabled:border-gray-100
  disabled:bg-gray-100
  disabled:text-gray-400
`;

const field =
  "min-h-13 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-600";


function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
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
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}












//  <------------ MAIN FUNCTION ------------>
//  <------------ MAIN FUNCTION ------------>
//  <------------ MAIN FUNCTION ------------>


export default function NotiumOnboarding({
  onClose,
  onComplete,
  services,
  previewMode = false,
  parentalConsentAge = 13,
  dashboardHref = "/dashboard",
  termsHref = "/terms",
  privacyHref = "/privacy",
  resume,

}: NotiumOnboardingProps) {

  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>(resume?.step ?? "welcome");
  const [profile, setProfile] = useState<StudyProfile>(resume?.profile ?? initialProfile);
  const [otherAnswers, setOtherAnswers] = useState<
    Record<OtherAnswerKey, string>
  >(resume?.otherAnswers ?? { level: "", subject: "", source: "" });
  const [direction, setDirection] = useState(1);
  
  // user data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(resume?.firstName ?? "");
  const [lastName, setLastName] = useState(resume?.lastName ?? "");

  // user data states
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(resume?.registered ?? false);
  const [parentEmail, setParentEmail] = useState("");


  const [requestId, setRequestId] = useState(resume?.consentRequestId ?? "");
  const [consentVerified, setConsentVerified] = useState(resume?.consentVerified ?? false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(resume?.error ?? "");
  const [closePrompt, setClosePrompt] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const imagesToPreload = new Set([
      ...Object.values(levelImages),
      ...Object.values(subjectImages),
    ]);

    imagesToPreload.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  const threshold = Math.max(13, Math.min(16, parentalConsentAge));


  const needsParent = profile.age !== "" && Number(profile.age) < threshold;
  const steps: Step[] = [...baseSteps];
  if (resume?.confirmGoogleProfile) steps.splice(steps.indexOf("account") + 1, 0, "google-profile");
  if (needsParent) steps.splice(3, 0, "parent");
  
  const index = steps.indexOf(step);
  const [title, subtitle] = headings[step];
  const levelImage = levelImages[profile.level] ?? defaultLevelImage;
  const subjectImage = subjectImages[profile.subject] ?? defaultSubjectImage;
  const choiceImage = step === "subject" ? subjectImage : levelImage;
  const choiceImageLabel =
    step === "subject" ? profile.subject : profile.level;

  const isSplitStep =
    step === "welcome" ||
    step === "age" ||
    step === "parent" ||
    step === "level" ||
    step === "subject" || 
    step === "streak" ||
    step === "journey";
  const parentEmailSent = step === "parent" && Boolean(requestId);
  const linearProgressRatio = Math.min(
    1,
    Math.max(0, index / Math.max(1, steps.length - 1)),
  );
  // Ease-out progress: completed screens add more at the beginning and
  // progressively less near the end, while the final screen still reaches 100%.
  const progressRatio = 1 - Math.pow(1 - linearProgressRatio, 1.5);
  const modalOpen = closePrompt;

  const update = (key: keyof StudyProfile) => (value: string) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setError("");

    if (key === "age") {
      setConsentVerified(false);
      setRequestId("");
      setParentEmail("");
    }
  };

  const updateOtherAnswer = (key: OtherAnswerKey) => (value: string) => {
    setOtherAnswers((answers) => ({ ...answers, [key]: value }));
    setError("");
  };

  const go = (next: Step, dir = 1) => {
    setDirection(dir);
    setError("");
    setStep(next);
  };

  const next = () => {
    const target = steps[index + 1];
    if (target) go(target);
  };

  const backLocked = registered && index <= steps.indexOf("account");
  const back = () => {
    if (!busyRef.current && index > 0 && !backLocked) go(steps[index - 1], -1);
  };

  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.trim()
          ? caught.message
          : "Something went wrong. Please try again. Your choices are still here.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      headingRef.current?.focus({ preventScroll: true });
      rootRef.current?.scrollTo({ top: 0 });
    }
  }, [step, modalOpen]);

  useEffect(() => {
    if (modalOpen)
      (modalRef.current?.querySelector("input,button") as HTMLElement)?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (busyRef.current) return;
        if (closePrompt) {
          setClosePrompt(false);
          closeButtonRef.current?.focus();
        } else setClosePrompt(true);
      }
      if (e.key !== "Tab") return;
      const scope = modalOpen ? modalRef.current : rootRef.current;
      const elements = Array.from(
        scope?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ) || [],
      ).filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !elements.includes(document.activeElement as HTMLElement))
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !elements.includes(document.activeElement as HTMLElement))
      ) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [modalOpen, closePrompt]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const parentValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim());
  const ageValid =
    /^\d{1,3}$/.test(profile.age) &&
    Number(profile.age) >= 1 &&
    Number(profile.age) <= 120;

  const selectionKey: Partial<Record<Step, keyof StudyProfile>> = {
    goal: "goal",
    subject: "subject",
    minutes: "minutes",
    source: "source",
    exam: "exam",
    streak: "streak",
  };
  const hasRequiredSelection =
    step === "age"
      ? ageValid
      : step === "level"
        ? !!profile.level
        : selectionKey[step]
          ? !!profile[selectionKey[step]!]
          : true;

  const otherAnswerRequired =
    (step === "level" && profile.level === "Other") ||
    (step === "subject" && profile.subject === "Other") ||
    (step === "source" && profile.source === "Other");
  const activeOtherAnswer =
    step === "level"
      ? otherAnswers.level
      : step === "subject"
        ? otherAnswers.subject
        : step === "source"
          ? otherAnswers.source
          : "";
  const canContinue =
    hasRequiredSelection &&
    (!otherAnswerRequired || Boolean(activeOtherAnswer.trim()));

  const resolvedProfile: StudyProfile = {
    ...profile,
    level:
      profile.level === "Other" && otherAnswers.level.trim()
        ? otherAnswers.level.trim()
        : profile.level,
    subject:
      profile.subject === "Other" && otherAnswers.subject.trim()
        ? otherAnswers.subject.trim()
        : profile.subject,
    source:
      profile.source === "Other" && otherAnswers.source.trim()
        ? otherAnswers.source.trim()
        : profile.source,
  };
          
  const register = (e: FormEvent) => {
    e.preventDefault();
    if (!emailValid || !firstName.trim() || password.length < 8)
      return;
    void run(async () => {
      if (needsParent && !consentVerified) {
        setError("A parent or guardian needs to approve first.");
        return;
      }
      if (!previewMode) {
        if (!services) {
          setError("Sign-up is currently unavailable. Please try again later.");
          return;
        }
        await services.register({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          profile: resolvedProfile,
          consentRequestId: requestId || undefined,
        });
      }
      setPassword("");
      setRegistered(true);
      go("streak");
    });
  };



  const startGoogleRegistration = () => void run(async () => {
    if (needsParent && !consentVerified) {
      setError("A parent or guardian needs to approve first.");
      return;
    }
    if (previewMode) {
      setRegistered(true);
      go("streak");
      return;
    }
    if (!services?.startGoogleRegistration) throw new Error("Google sign-up is currently unavailable.");
    storeOnboardingDraft({
      profile, otherAnswers, step: "account", registered: false,
      consentRequestId: requestId || undefined, consentVerified,
    });
    await services.startGoogleRegistration({ profile: resolvedProfile, consentRequestId: requestId || undefined });
  });

  const saveGoogleProfile = () => void run(async () => {
    if (!firstName.trim() || firstName.length > 80 || lastName.length > 80) return;
    if (!previewMode) {
      if (!services?.saveGoogleProfile) throw new Error("Profile updates are currently unavailable.");
      await services.saveGoogleProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
    }
    storeOnboardingDraft({ profile: resolvedProfile, step: "streak", registered: true, firstName, lastName,
      consentRequestId: requestId || undefined, consentVerified });
    go("streak");
  });

  const parentAction = () =>
    void run(async () => {
      if (previewMode) {
        if (!requestId) setRequestId("preview-only");
        else {
          setConsentVerified(true);
          next();
        }
        return;
      }
      if (!services) {
        setError(
          "Parental approval is currently unavailable. Please try again later.",
        );
        return;
      }
      if (!requestId) {
        const result = await services.requestParentalConsent(
          parentEmail.trim(),
        );
        setRequestId(result.requestId);
      } else if (await services.checkParentalConsent(requestId)) {
        setConsentVerified(true);
        next();
      } else
        setError(
          "Approval is still pending. Ask your parent to complete the steps in their email.",
        );
    });

  const resendParentEmail = () =>
    void run(async () => {
      if (previewMode) {
        setRequestId(`preview-${Date.now()}`);
        return;
      }
      if (!services) {
        setError(
          "Parental approval is currently unavailable. Please try again later.",
        );
        return;
      }
      const result = await services.requestParentalConsent(parentEmail.trim());
      setRequestId(result.requestId);
    });

  const useAnotherParentEmail = () => {
    if (busyRef.current) return;
    setRequestId("");
    setConsentVerified(false);
    setParentEmail("");
    setError("");
  };

  const completeOnboarding = () =>
    void run(async () => {
      if (!previewMode) {
        if (!services || !registered) {
          setError("Please finish creating your account first.");
          return;
        }
        await services.complete(resolvedProfile, requestId || undefined);
      }
      clearOnboardingDraft();
      if (onComplete) onComplete(resolvedProfile);
      else window.location.assign(dashboardHref);
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || !canContinue) return;
    if (step === "account") {
      if (registered) go(resume?.confirmGoogleProfile ? "google-profile" : "streak");
      else register(e);
      return;
    }
    if (step === "google-profile") { saveGoogleProfile(); return; }
    if (step === "parent") {
      if (requestId || parentValid) parentAction();
      return;
    }
    if (step === "journey") return;
    next();
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notium-step-title"
      className="fixed inset-0 z-[100] overflow-y-auto bg-white font-[Inter,Arial,sans-serif]
       text-gray-900 selection:bg-blue-100"
    >
      <div
        className="flex min-h-[100dvh] flex-col"
        {...(modalOpen ? { inert: true } : {})}
      >
        {step !== "welcome" && (
          <header className="mx-auto flex w-full max-w-[800px] items-center gap-3 px-5 py-6 sm:gap-3 sm:px-10
           sm:py-4">
            
            
            <button
              type="button"
              onClick={back}
              disabled={index === 0 || busy || backLocked}
              aria-label="Previous step"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
              hover:bg-gray-100 disabled:opacity-0 focus-visible:outline-blue-600"
            >

              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="m14 5-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </button>

            <div className="flex-1 px-1 sm:px-2">
              <SegmentedProgress
                value={progressRatio}
                reducedMotion={Boolean(reduced)}
              />
            </div>
        </header>          
        )}

        <form
          onSubmit={submit}
          className="mx-auto flex w-full max-w-[880px] flex-1 flex-col px-6 pb-6 sm:px-10 sm:pb-8"
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            
            <motion.main
              key={step}
              custom={direction}
              initial={reduced ? false : "enter"}
              animate="center"
              exit="exit"
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 16 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * -12 }),
              }}
              transition={{ duration: reduced ? 0 : 0.18 }}
              className={`flex min-h-0 flex-1 items-center ${
                isSplitStep
                  ? "justify-center py-8"
                  : step === "account" || step === "google-profile"
                    ? "flex-col py-4"
                    : "flex-col pt-10 pb-4"
              }`}
            >
              {isSplitStep ? (
                <div
                  className="grid w-full max-w-[720px] items-center justify-center
                    md:grid-cols-[1fr] "
                >
                  <motion.div
                    className="flex items-center justify-center"
                    animate={
                      !reduced && step === "welcome"
                        ? { y: [0, -5, 0] }
                        : { y: 0 }
                    }
                    transition={{
                      repeat: Infinity,
                      duration: 3.2,
                      ease: "easeInOut",
                    }}
                  >

                    {step === "welcome" && (
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="h-auto w-[220px] object-contain"
                      >
                        <source
                          src="/Onboarding/animations/sailing.mp4"
                          type="video/mp4"
                        />
                      </video>
                    )}

                    {(step === "parent" || step === "age") && (
                      <img
                        src="/Onboarding/age/age_2.png"
                        alt="Parental control doodle"
                        className="h-auto w-[220px] object-contain"
                      />
                    )}
                     



                    {(step === "level" || step === "subject") && (
                      <div
                        className={`relative aspect-square ${
                          step === "level" ? "w-[220px]" : "w-[140px]"
                        }`}
                      >
                        <AnimatePresence initial={false}>
                          <motion.img
                            key={`${step}-${choiceImage}`}
                            src={choiceImage}
                            alt={
                              choiceImageLabel
                                ? `${choiceImageLabel} ${step === "subject" ? "subject" : "learning level"} doodle`
                                : step === "subject"
                                  ? "Study subject doodle"
                                  : "Learning level doodle"
                            }
                            draggable={false}
                            decoding="async"
                            className="absolute inset-0 h-full w-full select-none object-contain"
                            initial={
                              reduced
                                ? false
                                : { opacity: 0, scale: 0.94, y: 8 }
                            }
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={
                              reduced
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 1.04, y: -6 }
                            }
                            transition={{
                              duration: reduced ? 0 : 0.28,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        </AnimatePresence>
                      </div>
                    )} 


                    {(step === "streak") && (
                      <img
                        src="/Onboarding/Goal/goal_fire.png"
                        alt="streak doodle"
                        className="h-auto w-[140px] object-contain"
                      />
                    )}

                    {(step === "journey") && (
                      <img
                        src="/Onboarding/finish/finish_jump.png"
                        alt="streak doodle"
                        className="h-auto w-[140px] object-contain"
                      />
                    )}                    
                     

                  {/* KONIEC ZAKŁADKI Z ZDJĘCIAMI TOPOWYMI */}
                  </motion.div>

                  <div className="flex w-full flex-col items-center justify-center text-center">
                    <h1
                      id="notium-step-title"
                      ref={headingRef}
                      tabIndex={-1}
                      className={`text-[26px] font-bold leading-[1.2]
                        tracking-[-.035em] outline-none ${step === "subject" || step === "streak"  ? "sm:text-[30px] max-w-[400px]" : "sm:text-[34px] max-w-[340px]"}`}
                    >
                      {parentEmailSent ? "Email sent!" : title}
                    </h1>

                    <p className="mt-3 max-w-[400px] text-sm leading-6 text-gray-500">
                      {parentEmailSent ? (
                        <>
                          We sent an email to{" "}
                          <strong className="font-semibold text-gray-900">
                            {parentEmail.trim()}
                          </strong>
                          . Ask your parent or guardian to open the email and
                          follow the steps inside to get you set up.
                        </>
                      ) : (
                        subtitle
                      )}
                    </p>

                    {step === "age" && (
                      <div className="mt-8 w-full max-w-[300px] text-left">
                        <label
                          htmlFor="notium-age"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Your age
                        </label>
                        <input
                          id="notium-age"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={120}
                          step={1}
                          value={profile.age}
                          onChange={(e) => update("age")(e.target.value)}
                          className={field}
                          placeholder="Age in years"
                          autoComplete="off"
                          required
                        />
                        <p className="mt-3 text-xs leading-5 text-gray-400">
                          Your age won’t appear on your public profile.
                        </p>
                      </div>
                    )}

                    {step === "parent" && (
                      requestId ? (
                        <div className="mt-7 flex w-full max-w-[400px] flex-col items-center gap-5 text-center">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={resendParentEmail}
                            className="text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Don’t see it?{" "}
                            <span className="font-medium underline underline-offset-4">
                              Resend email
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={useAnotherParentEmail}
                            className="text-sm text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Try another email
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={parentAction}
                            className="mt-1 text-sm font-semibold text-blue-600 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy
                              ? "Checking…"
                              : previewMode
                                ? "Continue preview"
                                : "Check approval"}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-8 w-full max-w-[400px] text-left">
                          <div className="space-y-4">
                            <input
                              id="notium-parent"
                              type="email"
                              value={parentEmail}
                              onChange={(e) => setParentEmail(e.target.value)}
                              className={field}
                              placeholder="parent@example.com"
                              autoComplete="email"
                            />

                            <button
                              type="button"
                              disabled={busy || !parentValid}
                              onClick={parentAction}
                              className={`${primary} mx-auto block !w-full`}
                            >
                              {busy
                                ? "Please wait…"
                                : previewMode
                                  ? "Continue"
                                  : "Request permission"}
                            </button>

                            <p className="text-xs leading-5 text-gray-500">
                              By clicking Submit, I agree to Notium's
                              <span className="mx-[3px] underline underline-offset-1">
                                Terms
                              </span>
                              and
                              <span className="ml-1 underline underline-offset-1">
                                Privacy Policy
                              </span>
                            </p>
                          </div>
                        </div>
                      )
                    )}

                    {step === "streak" && (
                      <>

                        <div className="w-full max-w-[330px] h-full mt-7">
                          <Choices
                            label="Streak goal"
                            value={profile.streak}
                            onChange={update("streak")}
                            options={[
                              {
                                value: "3",
                                label: "3-day streak",
                                detail: "Good",
                              },
                              {
                                value: "7",
                                label: "7-day streak",
                                detail: "Great",
                              },
                              {
                                value: "14",
                                label: "14-day streak",
                                detail: "Fantastic",
                              }
                            ]}
                          />
                        </div>
                      </>
                    )}                    

                    {step === "level" && (
                      <div className="mt-3 h-full w-full max-w-[550px]">
                        <Choices
                          label="Education level"
                          columns
                          value={profile.level}
                          onChange={update("level")}
                          options={[
                            "Middle school",
                            "High school",
                            "Undergraduate",
                            "Graduate student",
                            "Professional",
                            "Other",
                          ].map((v) => ({ value: v, label: v }))}
                        />
                        <OtherAnswerInput
                          id="notium-level-other"
                          visible={profile.level === "Other"}
                          value={otherAnswers.level}
                          onChange={updateOtherAnswer("level")}
                          label="Your learning stage"
                          placeholder="Type your answer"
                          reducedMotion={Boolean(reduced)}
                        />
                      </div>
                    )}

                    {step === "subject" && (
                      <div className="mt-5 h-full w-full max-w-[550px]">
                        <Choices
                          label="Main subject"
                          columns
                          value={profile.subject}
                          onChange={update("subject")}
                          options={[
                            "Biology",
                            "Chemistry",
                            "Mathematics",
                            "Computer science",
                            "Physics",
                            "Psychology",
                            "Languages",
                            "History",
                            "Economics",
                            "Other",
                          ].map((v) => ({ value: v, label: v }))}
                        />
                        <OtherAnswerInput
                          id="notium-subject-other"
                          visible={profile.subject === "Other"}
                          value={otherAnswers.subject}
                          onChange={updateOtherAnswer("subject")}
                          label="Your subject"
                          placeholder="e.g. Architecture"
                          reducedMotion={Boolean(reduced)}
                        />
                      </div>
                    )}
                  </div>


                {step === "journey" && (
                  <div className="mt-5 overflow-hidden bg-white p-5 sm:p-6">

                    <div className="mt-5 grid gap-3 pt-5 sm:grid-cols-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] font-medium text-gray-400">
                          First subject
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                          {resolvedProfile.subject}
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] font-medium text-gray-400">
                          Daily session
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {profile.minutes} minutes
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] font-medium text-gray-400">
                          Streak goal
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {profile.streak} days
                        </p>
                      </div>
                    </div>
                    
                  </div>
                )}    


                {/* koniec isSplit */}
                </div>
              ) : step !== "account" && step !== "google-profile" ? (
                <>
                
                  <div className="flex w-full gap-4 shrink-0 items-center justify-center -translate-x-[30px]">
                    <motion.div
                      animate={
                        !reduced && ["welcome", "journey"].includes(step)
                          ? { y: [0, -5, 0] }
                          : { y: 0 }
                      }
                      transition={{
                        repeat: Infinity,
                        duration: 3.2,
                        ease: "easeInOut",
                      }}
                    >
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="h-auto w-[100px] object-contain"
                      >
                        <source
                          src="/Onboarding/animations/sailing.mp4"
                          type="video/mp4"
                        />
                      </video>
                    </motion.div>

                    <div className="flex flex-col items-start justify-center">
                      <h1
                        id="notium-step-title"
                        ref={headingRef}
                        tabIndex={-1}
                        className="max-w-[610px] text-center text-[22px] font-[650] leading-[1.2]
                        tracking-[-.035em] outline-none sm:text-[28px]"
                      >
                        {title}
                      </h1>

                      <p className="max-w-[460px] text-center text-sm leading-6 text-gray-500">
                        {subtitle}
                      </p>  
                    </div>
                   
                  </div>      
                  
                           

                </>
                
              ) : null}

              {!isSplitStep && (
                <div className="flex w-full flex-1 items-center justify-center py-6">
                  <div
                    className={`w-full ${
                      step === "goal" || step === "minutes"
                        ? "max-w-[720px]"
                        : "max-w-[460px]"
                    }`}
                  >

                    {step === "goal" && (
                      <Choices
                        label="Learning goal"
                        illustrated
                        value={profile.goal}
                        onChange={update("goal")}
                        options={[
                          {
                            value: "exams",
                            label: "Ace my exams",
                            detail: "Feel prepared",
                            src: "/Onboarding/Goal/goal_target.png",
                          },
                          {
                            value: "understand",
                            label: "Understand more",
                            detail: "Make it click",
                            src: "/Onboarding/Goal/goal_book.png",
                          },
                          {
                            value: "habit",
                            label: "Build a habit",
                            detail: "A little, every day",
                            src: "/Onboarding/Goal/goal_fire.png",
                          },
                          {
                            value: "curiosity",
                            label: "Stay curious",
                            detail: "Follow my interests",
                            src: "/Onboarding/Goal/goal_lightbulb.png",
                          },
                        ]}
                      />
                    )}
                    {step === "minutes" && (
                      <Choices
                        label="Daily study time"
                        illustrated
                        value={profile.minutes}
                        onChange={update("minutes")}
                        options={[
                          {
                            value: "10",
                            label: "10 minutes",
                            detail: "Start small",
                            src: "/Onboarding/time/clock_10.png",
                          },
                          {
                            value: "20",
                            label: "20 minutes",
                            detail: "Find your rhythm",
                            src: "/Onboarding/time/clock_20.png",
                          },
                          {
                            value: "30",
                            label: "30 minutes",
                            detail: "Make some space",
                            src: "/Onboarding/time/clock_30.png",
                          },
                          {
                            value: "60",
                            label: "60 minutes",
                            detail: "Go a little deeper",
                            src: "/Onboarding/time/clock_60.png",
                          },
                        ]}
                      />
                    )}

                    {step === "source" && (
                      <div>
                        <Choices
                          label="How you found Notium"
                          columns
                          value={profile.source}
                          onChange={update("source")}
                          options={[
                            "TikTok",
                            "Instagram",
                            "YouTube",
                            "Friend or teacher",
                            "Google search",
                            "Other",
                          ].map((v) => ({ value: v, label: v }))}
                        />
                        <OtherAnswerInput
                          id="notium-source-other"
                          visible={profile.source === "Other"}
                          value={otherAnswers.source}
                          onChange={updateOtherAnswer("source")}
                          label="Where did you hear about Notium?"
                          placeholder="Type another source"
                          reducedMotion={Boolean(reduced)}
                        />
                      </div>
                    )}

                    {step === "exam" && (
                      <Choices
                        label="Next exam"
                        value={profile.exam}
                        onChange={update("exam")}
                        options={[
                          {
                            value: "tomorrow",
                            label: "Tomorrow",
                            detail: "Let’s focus on the essentials",
                          },
                          {
                            value: "week",
                            label: "This week",
                            detail: "One focused session at a time",
                          },
                          {
                            value: "month",
                            label: "In the next few weeks",
                            detail: "Build confidence gradually",
                          },
                          {
                            value: "later",
                            label: "More than a month away",
                            detail: "Time to build a steady routine",
                          },
                          {
                            value: "none",
                            label: "No exam / not sure",
                            detail: "Learning at my own pace",
                          },
                        ]}
                      />
                    )}

                    {step === "google-profile" && (
                      <div className="mx-auto w-full max-w-[455px]">
                        <h1 id="notium-step-title" ref={headingRef} tabIndex={-1}
                          className="mb-7 text-center text-[16px] font-medium outline-none">{title}</h1>

                          <div className="isolate flex rounded-[10px] bg-white">
                            <input
                              name="firstName"
                              autoComplete="given-name"
                              aria-label="First name"
                              placeholder="First name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              maxLength={80}
                              disabled={busy}
                              required
                              className="relative h-[50px] min-w-0 flex-1 rounded-l-[10px]
                                border-2 border-gray-200 bg-white px-4 text-[15px] outline-none
                                focus:z-10 focus:border-gray-800"
                            />

                            <input
                              name="lastName"
                              autoComplete="family-name"
                              aria-label="Last name"
                              placeholder="Last name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              maxLength={80}
                              disabled={busy}
                              className="relative -ml-[2px] h-[50px] min-w-0 flex-1 rounded-r-[10px]
                                border-2 border-gray-200 bg-white px-4 text-[15px] outline-none
                                focus:z-10 focus:border-gray-800"
                            />
                          </div>

                        <div className="mt-6 h-[52px]">
                          <button type="submit" disabled={busy || !firstName.trim()}
                            className={`${primary} !w-full`}>
                            {busy ? "Saving…" : "Sign up"}
                          </button>
                        </div>
                      </div>
                    )}

                    {step === "account" && (
                      <div className="mx-auto w-full max-w-[380px] text-center">
                        <motion.div
                          animate={reduced ? { y: 0 } : { y: [0, -3, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 3.2,
                            ease: "easeInOut",
                          }}
                        >
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            className="mx-auto h-auto w-[76px] object-contain"
                          >
                            <source
                              src="/Onboarding/animations/sailing.mp4"
                              type="video/mp4"
                            />
                          </video>
                        </motion.div>
                        <h1
                          id="notium-step-title"
                          ref={headingRef}
                          tabIndex={-1}
                          className="mx-auto mt-4 max-w-[350px] text-[25px] font-bold leading-[1.2] tracking-[-.035em] outline-none sm:text-[28px]"
                        >
                          {title}
                        </h1>
                        {subtitle && (
                          <p className="mx-auto mt-2 max-w-[350px] text-sm leading-6 text-gray-500">
                            {subtitle}
                          </p>
                        )}

                        {registered ? (
                          <div className="mt-7 space-y-4">
                            <p className="rounded-xl bg-blue-50 p-4 text-sm font-medium text-blue-600">
                              {previewMode
                                ? "Your preview profile is ready."
                                : "Your account is ready."}
                            </p>
                            <button
                              type="button"
                              className={`${primary} !w-full`}
                              onClick={() => go(resume?.confirmGoogleProfile ? "google-profile" : "streak")}
                            >
                              Continue
                            </button>
                          </div>
                        ) : (
                          <div className="mt-7">
                            <div className="h-[52px] w-full">
                              <button
                                type="button"
                                onClick={startGoogleRegistration}
                                disabled={busy}
                                aria-label="Sign up with Google"
                                className="box-border flex h-[50px] w-full items-center justify-center gap-3 rounded-full
                                  border-2 border-[#e1e2e5] bg-white text-[16px] font-medium text-gray-900
                                  shadow-[0_1px_0_#e1e2e5] cursor-pointer hover:bg-gray-50
                                  hover:border-gray-300 transition-[height,margin-top,box-shadow] duration-100 ease-out
                                  active:mt-[1px] active:h-[49px] active:shadow-none
                                  disabled:cursor-wait disabled:opacity-60"
                              >
                                <GoogleLogo className="h-[21px] w-[21px] shrink-0" />
                                <span>{busy ? "Please wait…" : "Sign up with Google"}</span>
                              </button>
                            </div>

                            <div className="my-5 flex items-center gap-3" aria-hidden="true">
                              <span className="h-px flex-1 bg-gray-200" />
                              <span className="text-xs font-medium uppercase text-gray-500">
                                or
                              </span>
                              <span className="h-px flex-1 bg-gray-200" />
                            </div>

                            <div className="group relative">
                              <label htmlFor="notium-email" className="sr-only">
                                Email address
                              </label>
                              <input
                                id="notium-email"
                                type="email"
                                autoComplete="email"
                                className={`${field} rounded-[10px]`}
                                placeholder="Email"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  setError("");
                                }}
                              />
                              <button
                                type="button"
                                aria-label="Why Notium needs your email"
                                className="absolute left-[calc(100%+8px)] top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-600 sm:flex"
                              >
                                ?
                              </button>
                              <div
                                role="tooltip"
                                className="pointer-events-none absolute left-[calc(100%+38px)] top-1/2 z-10 hidden w-[178px] -translate-y-1/2 rounded-xl border border-gray-100 bg-white p-4 text-left text-xs leading-[1.45] text-gray-700 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 lg:block"
                              >
                                We use your email for essential account features,
                                including password resets and important product
                                notifications.
                              </div>
                            </div>

                            <AnimatePresence initial={false}>
                              {emailValid && (
                                <motion.div
                                  key="account-details"
                                  className="overflow-hidden text-left"
                                  initial={
                                    reduced
                                      ? false
                                      : { height: 0, opacity: 0, y: -6 }
                                  }
                                  animate={{ height: "auto", opacity: 1, y: 0 }}
                                  exit={
                                    reduced
                                      ? { opacity: 0 }
                                      : { height: 0, opacity: 0, y: -6 }
                                  }
                                  transition={{
                                    duration: reduced ? 0 : 0.24,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                >
                                  <div className="mt-3 space-y-3">
                                    <div className="relative">
                                      <label
                                        htmlFor="notium-password"
                                        className="sr-only"
                                      >
                                        Password
                                      </label>
                                      <input
                                        id="notium-password"
                                        required
                                        minLength={8}
                                        maxLength={128}
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(event) => {
                                          setPassword(event.target.value);
                                          setError("");
                                        }}
                                        className={`${field} rounded-[10px] pr-16`}
                                        placeholder="Password"
                                        aria-describedby="notium-password-help"
                                      />
                                      <button
                                        type="button"
                                        aria-pressed={showPassword}
                                        onClick={() =>
                                          setShowPassword((visible) => !visible)
                                        }
                                        className="absolute inset-y-0 right-4 text-xs font-medium text-gray-500 hover:text-gray-900"
                                      >
                                        {showPassword ? "Hide" : "Show"}
                                      </button>
                                      <span
                                        id="notium-password-help"
                                        className="sr-only"
                                      >
                                        Use at least 8 characters.
                                      </span>
                                    </div>

                                    <div className="grid min-h-13 grid-cols-2 overflow-hidden rounded-[10px] border-2 border-gray-200 bg-white transition-colors focus-within:border-blue-600">
                                      <label
                                        htmlFor="notium-first-name"
                                        className="sr-only"
                                      >
                                        First name
                                      </label>
                                      <input
                                        id="notium-first-name"
                                        required
                                        autoComplete="given-name"
                                        maxLength={80}
                                        value={firstName}
                                        onChange={(event) => {
                                          setFirstName(event.target.value);
                                          setError("");
                                        }}
                                        className="min-w-0 bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
                                        placeholder="First name"
                                      />
                                      <label
                                        htmlFor="notium-last-name"
                                        className="sr-only"
                                      >
                                        Last name
                                      </label>
                                      <input
                                        id="notium-last-name"
                                        autoComplete="family-name"
                                        maxLength={80}
                                        value={lastName}
                                        onChange={(event) => {
                                          setLastName(event.target.value);
                                          setError("");
                                        }}
                                        className="min-w-0 border-l-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
                                        placeholder="Last name"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <button
                              type="submit"
                              disabled={
                                busy ||
                                !emailValid ||
                                !firstName.trim() ||
                                password.length < 8
                              }
                              className={`${primary} mt-4 !w-full`}
                            >
                              {busy ? "Creating account…" : "Sign up"}
                            </button>

                            <p className="mt-4 text-center text-[11px] leading-5 text-gray-500">
                              By clicking Sign up, I agree to Notium&apos;s{" "}
                              <a
                                href={termsHref}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 hover:text-gray-900"
                              >
                                Terms
                              </a>{" "}
                              and{" "}
                              <a
                                href={privacyHref}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 hover:text-gray-900"
                              >
                                Privacy Policy
                              </a>
                              .
                            </p>

                            <p className="mt-6 text-center text-sm text-gray-900">
                              Existing user?{" "}
                              <a
                                href="/login"
                                className="font-medium underline underline-offset-4 hover:text-blue-600"
                              >
                                Sign in
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>



                {/* koniec is not isSplit */}
                </div>
              )}          



            </motion.main>
          </AnimatePresence>



          <footer className="mx-auto mt-4 flex w-full max-w-[340px] flex-col items-center gap-3 pb-[env(safe-area-inset-bottom)]">
            {error && (
              <p
                role="alert"
                className="w-full rounded-xl bg-red-50 p-3 text-center text-sm text-red-700"
              >
                {error}
              </p>
            )}
            {step === "journey" ? (
              <button
                type="button"
                onClick={completeOnboarding}
                disabled={busy}
                className={primary}
              >
                {busy ? "Saving your plan…" : "Go to my dashboard"}
              </button>
            ) : (
              step !== "account" &&
              step !== "parent" &&
              step !== "google-profile" && (
                <button
                  type="submit"
                  disabled={!canContinue || busy}
                  className={`${primary} mb-7`}
                >
                  {step === "welcome"
                    ? "Continue"
                    : step === "streak"
                      ? "Commit to my goal"
                      : "Continue"}
                </button>
              )
            )}
            {step === "source" && (
              <button
                type="button"
                onClick={() => {
                  update("source")("Prefer not to say");
                  next();
                }}
                className="min-h-10 text-xs text-gray-400 hover:text-gray-700"
              >
                Skip this question
              </button>
            )}
          </footer>
        </form>
      </div>

    </div>
  );
}
