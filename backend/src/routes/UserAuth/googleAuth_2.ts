import "dotenv/config";

import type { Request, Response } from "express";
import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import jwt from "jsonwebtoken";

import { db } from "../../db/db.js";
import {
  users,
  type OnboardingProfile,
} from "../../db/schema.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const jwtSecret = process.env.JWT_SECRET;

if (!googleClientId) throw new Error("Missing GOOGLE_CLIENT_ID");
if (!jwtSecret) throw new Error("Missing JWT_SECRET");

const googleClient = new OAuth2Client(googleClientId);
const googleAuthRouter = Router();

const safeUserSelection = {
  id: users.id,
  email: users.email,
  username: users.username,
  avatarUrl: users.avatarUrl,
};

type GoogleAccountData = {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  profile?: OnboardingProfile;
};

class AccountLinkRequiredError extends Error {
  constructor() {
    super("An account with this email already exists.");
  }
}

class OnboardingRequiredError extends Error {
  constructor() {
    super("Complete onboarding before creating a new account.");
  }
}

const profileKeys: (keyof OnboardingProfile)[] = [
  "goal",
  "age",
  "level",
  "familiarity",
  "subject",
  "minutes",
  "source",
  "exam",
  "streak",
];

function isOnboardingProfile(value: unknown): value is OnboardingProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const profile = value as Record<string, unknown>;
  if (
    !profileKeys.every(
      (key) =>
        typeof profile[key] === "string" &&
        (profile[key] as string).length <= 160,
    )
  ) {
    return false;
  }

  const age = Number(profile.age);
  return Number.isInteger(age) && age >= 1 && age <= 120;
}

export async function findOrCreateGoogleUser(input: GoogleAccountData) {
  const normalizedEmail = input.email.trim().toLowerCase();

  return db.transaction(async (tx) => {
    const [existingGoogleUser] = await tx
      .select(safeUserSelection)
      .from(users)
      .where(eq(users.googleId, input.googleId))
      .limit(1);

    if (existingGoogleUser) {
      const [updatedUser] = await tx
        .update(users)
        .set({
          avatarUrl: input.avatarUrl ?? existingGoogleUser.avatarUrl,
          ...(input.profile
            ? {
                onboardingProfile: input.profile,
                onboardingCompletedAt: new Date(),
              }
            : {}),
        })
        .where(eq(users.id, existingGoogleUser.id))
        .returning(safeUserSelection);

      return updatedUser ?? existingGoogleUser;
    }

    const [existingEmailUser] = await tx
      .select({
        id: users.id,
        googleId: users.googleId,
      })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    // Linking a password account to Google requires a separate flow in which
    // the already signed-in user explicitly confirms the connection.
    if (existingEmailUser) throw new AccountLinkRequiredError();

    // A Google click in the ordinary sign-in modal must not bypass onboarding.
    if (!input.profile) throw new OnboardingRequiredError();

    const username =
      [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
      normalizedEmail.split("@")[0];

    const [createdUser] = await tx
      .insert(users)
      .values({
        username,
        email: normalizedEmail,
        passwordHash: null,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        onboardingProfile: input.profile,
        onboardingCompletedAt: new Date(),
      })
      .returning(safeUserSelection);

    if (!createdUser) throw new Error("Google user could not be created.");
    return createdUser;
  });
}

googleAuthRouter.post("/auth/google",
  async (req: Request, res: Response) => {
    const credential = req.body?.credential;
    const rawProfile = req.body?.profile;
    const consentRequestId = req.body?.consentRequestId;

    if (typeof credential !== "string" || !credential.trim()) {
      return res.status(400).json({
        message: "Missing Google credential.",
      });
    }

    const profile =
      rawProfile === undefined
        ? undefined
        : isOnboardingProfile(rawProfile)
          ? rawProfile
          : null;

    if (profile === null) {
      return res.status(400).json({
        message: "Invalid onboarding profile.",
      });
    }

    // This only checks that the UI supplied a request ID. Replace it with a
    // lookup of an approved, unexpired parental-consent record before launch.
    if (
      profile &&
      Number(profile.age) < 13 &&
      (typeof consentRequestId !== "string" || !consentRequestId.trim())
    ) {
      return res.status(403).json({
        code: "PARENTAL_CONSENT_REQUIRED",
        message: "Verified parental consent is required.",
      });
    }

    let googleUser: TokenPayload | undefined;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      googleUser = ticket.getPayload();
    } catch {
      return res.status(401).json({
        message: "Invalid Google credential.",
      });
    }

    if (
      !googleUser?.sub ||
      !googleUser.email ||
      !googleUser.email_verified
    ) {
      return res.status(401).json({
        message: "Google account could not be verified.",
      });
    }

    try {
      const user = await findOrCreateGoogleUser({
        googleId: googleUser.sub,
        email: googleUser.email,
        firstName: googleUser.given_name ?? "",
        lastName: googleUser.family_name ?? "",
        avatarUrl: googleUser.picture ?? null,
        profile: profile ?? undefined,
      });

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        jwtSecret,
        { expiresIn: "1h" },
      );

      return res.json({ token, user });
    } catch (error) {
      if (error instanceof AccountLinkRequiredError) {
        return res.status(409).json({
          code: "ACCOUNT_LINK_REQUIRED",
          message:
            "An account with this email already exists. Sign in with your password to connect Google.",
        });
      }

      if (error instanceof OnboardingRequiredError) {
        return res.status(404).json({
          code: "ONBOARDING_REQUIRED",
          message: "No account exists yet. Start with Get Started.",
        });
      }

      console.error("Google authentication failed:", error);
      return res.status(500).json({
        message: "Google authentication is temporarily unavailable.",
      });
    }
  },
);

export default googleAuthRouter;
