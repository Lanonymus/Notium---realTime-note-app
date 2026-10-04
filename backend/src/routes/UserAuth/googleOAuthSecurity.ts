import { createHash, randomBytes } from "node:crypto";
import type { OnboardingProfile } from "../../db/schema.js";

export const PROFILE_KEYS = [
  "goal",
  "age",
  "level",
  "familiarity",
  "subject",
  "minutes",
  "source",
  "exam",
  "streak",
] as const satisfies readonly (keyof OnboardingProfile)[];

export function randomSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function isSecret(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

// Return a clean, bounded object, never persist extra client-supplied properties.
export function parseProfile(
  value: unknown,
  completed = false,
): OnboardingProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    !PROFILE_KEYS.every(
      (key) =>
        typeof input[key] === "string" && (input[key] as string).length <= 160,
    )
  )
    return null;
  const profile = Object.fromEntries(
    PROFILE_KEYS.map((key) => [key, (input[key] as string).trim()]),
  ) as OnboardingProfile;
  if (
    !/^\d{1,3}$/.test(profile.age) ||
    Number(profile.age) < 1 ||
    Number(profile.age) > 120
  )
    return null;
  if (
    !["goal", "level", "subject", "minutes", "source", "exam"].every((key) =>
      Boolean(profile[key as keyof OnboardingProfile]),
    )
  )
    return null;
  if (
    !/^\d{1,3}$/.test(profile.minutes) ||
    Number(profile.minutes) < 1 ||
    Number(profile.minutes) > 180
  )
    return null;
  if (completed && !["3", "7", "14"].includes(profile.streak)) return null;
  return profile;
}

export function readCookie(header: string | undefined, name: string) {
  for (const part of (header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function flowCookieName(stateHash: string) {
  // A distinct cookie for each flow prevents two browser tabs overwriting one another.
  return `notium_google_${stateHash.slice(0, 24)}`;
}
