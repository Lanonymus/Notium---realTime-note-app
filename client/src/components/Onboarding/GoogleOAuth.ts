export type Registration = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profile: StudyProfile;
  consentRequestId?: string;
};

export type StudyProfile = {
  goal: string;
  age: string;
  level: string;
  familiarity: string;
  subject: string;
  minutes: string;
  source: string;
  exam: string;
  streak: string;
};

export type OnboardingResume = {
  profile: StudyProfile;
  step: "welcome" | "account" | "google-profile" | "streak";
  registered: boolean;
  confirmGoogleProfile?: boolean;
  firstName?: string;
  lastName?: string;
  otherAnswers?: { 
    level: string; 
    subject: string; 
    source: string 
  };
  consentRequestId?: string;
  consentVerified?: boolean;
  error?: string;
};

export type GoogleOAuthStart = {
  mode: "sign_in" | "sign_up";
  profile?: StudyProfile;
  consentRequestId?: string;
};

export type GoogleOAuthUser = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
};

export type GoogleOAuthResult =
  | {
      ok: true;
      mode: "sign_in" | "sign_up";
      token: string;
      user: GoogleOAuthUser;
      next: "dashboard" | "onboarding";
      profile: StudyProfile | null;
      firstName: string;
      lastName: string;
    }
  | {
      ok: false;
      mode: "sign_in" | "sign_up";
      code: string;
      message: string;
      profile: StudyProfile | null;
    };

const DRAFT_KEY = "notium.google.onboarding.v1";
const DRAFT_LIFETIME = 20 * 60_000;
const resultRequests = new Map<string, Promise<GoogleOAuthResult>>();
const keys = [
  "goal",
  "age",
  "level",
  "familiarity",
  "subject",
  "minutes",
  "source",
  "exam",
  "streak",
] as const;

export function isStudyProfile(value: unknown): value is StudyProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  
  return keys.every(
    (key) =>
      typeof (value as Record<string, unknown>)[key] === "string" &&
      ((value as Record<string, unknown>)[key] as string).length <= 160,
  );
}

export function storeOnboardingDraft(resume: OnboardingResume) {
  // Passwords and Google/application tokens are never part of the recovery draft.
  try {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ expiresAt: Date.now() + DRAFT_LIFETIME, resume }),
    );
  } catch {
    /* Server-side profile remains authoritative if browser storage is unavailable. */
  }
}

export function readOnboardingDraft(): OnboardingResume | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
    if (
      !value ||
      value.expiresAt < Date.now() ||
      !isStudyProfile(value.resume?.profile)
    )
      return null;
    const r = value.resume as OnboardingResume;
    if (!["welcome", "account", "google-profile", "streak"].includes(r.step))
      return null;
    return r;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* Optional recovery cache. */
  }
}

async function oauthPost<T>(
  apiBaseUrl: string,
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message ?? "Google sign-in is temporarily unavailable.",
    );
  return data as T;
}

export async function startGoogleOAuth(
  apiBaseUrl: string,
  data: GoogleOAuthStart,
) {
  const result = await oauthPost<{ authorizationUrl: string }>(
    apiBaseUrl,
    "/api/auth/google/start",
    data,
  );
  const url = new URL(result.authorizationUrl);
  if (url.protocol !== "https:" || url.hostname !== "accounts.google.com")
    throw new Error("Invalid Google sign-in URL.");
  window.location.assign(url.toString());
}

export function consumeGoogleOAuthResult(apiBaseUrl: string, state: string) {
  // StrictMode and repeated renders share the same one-time backend request.
  const key = `${apiBaseUrl}:${state}`;
  let request = resultRequests.get(key);
  if (!request) {
    request = oauthPost<GoogleOAuthResult>(
      apiBaseUrl,
      "/api/auth/google/result",
      { state },
    );
    resultRequests.set(key, request);
  }
  return request;
}

export function getGoogleReturnState() {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get("google_auth");
}
export function clearGoogleReturnState() {
  const url = new URL(window.location.href);
  url.searchParams.delete("google_auth");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}
