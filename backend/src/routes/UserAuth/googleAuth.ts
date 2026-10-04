import "dotenv/config";
import type { NextFunction, Request, Response } from "express";
import { Router, json } from "express";
import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";
import {
  CodeChallengeMethod,
  OAuth2Client,
  type TokenPayload,
} from "google-auth-library";
import jwt from "jsonwebtoken";
import { db } from "../../db/db.js";
import {
  googleOAuthTransactions,
  users,
  type OnboardingProfile,
} from "../../db/schema.js";
import {
  flowCookieName,
  hashSecret,
  isSecret,
  parseProfile,
  pkceChallenge,
  randomSecret,
  readCookie,
} from "./googleOAuthSecurity.js";

const googleClientId = requiredEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
const jwtSecret = requiredEnv("JWT_SECRET");
const frontendUrl = new URL(requiredEnv("FRONTEND_URL"));
const callbackUrl = new URL(requiredEnv("GOOGLE_REDIRECT_URI"));
const parentalConsentAge = Number(process.env.PARENTAL_CONSENT_AGE ?? 13);

if (![13, 14, 15, 16].includes(parentalConsentAge))
  throw new Error("PARENTAL_CONSENT_AGE must be between 13 and 16.");
for (const url of [frontendUrl, callbackUrl]) {
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  ) {
    throw new Error("OAuth URLs must use HTTPS, except on localhost.");
  }
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "OAuth URLs must not contain credentials, query strings or fragments.",
    );
}
const cookieSecure = callbackUrl.protocol === "https:";
const flowLifetime = 15 * 60_000;
const resultLifetime = 3 * 60_000;
const safeUserSelection = {
  id: users.id,
  email: users.email,
  username: users.username,
  avatarUrl: users.avatarUrl,
  onboardingProfile: users.onboardingProfile,
  onboardingCompletedAt: users.onboardingCompletedAt,
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

class AuthFlowError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const messages: Record<string, string> = {
  ACCOUNT_LINK_REQUIRED:
    "An account with this email already exists. Sign in with your password to connect Google.",
  ONBOARDING_REQUIRED: "No account exists yet. Start with Get Started.",
  GOOGLE_CANCELLED: "Google sign-in was cancelled. You can try again.",
  GOOGLE_AUTH_FAILED: "Google sign-in failed. Please try again.",
  PARENTAL_CONSENT_REQUIRED: "Verified parental consent is required.",
  FLOW_EXPIRED: "Your Google sign-in session has expired. Please try again.",
};

type GoogleAccountData = {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  profile?: OnboardingProfile;
};

export async function findOrCreateGoogleUser(input: GoogleAccountData) {
  const normalizedEmail = input.email.trim().toLowerCase();
  return db.transaction(async (tx) => {
    // Serialize creation for the same Google identity/email; unique constraints remain the final guard.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${input.googleId})), pg_advisory_xact_lock(hashtext(${normalizedEmail}))`,
    );
    const [existing] = await tx
      .select(safeUserSelection)
      .from(users)
      .where(eq(users.googleId, input.googleId))
      .limit(1);
    if (existing) {
      const [updated] = await tx
        .update(users)
        .set({
          avatarUrl: input.avatarUrl ?? existing.avatarUrl,
          // Never overwrite a completed plan simply because someone clicked Sign up again.
          ...(!existing.onboardingCompletedAt && input.profile
            ? { onboardingProfile: input.profile }
            : {}),
        })
        .where(eq(users.id, existing.id))
        .returning(safeUserSelection);
      return updated ?? existing;
    }
    const [sameEmail] = await tx
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);
    // No implicit account linking based solely on an email address.
    if (sameEmail)
      throw new AuthFlowError(
        "ACCOUNT_LINK_REQUIRED",
        messages.ACCOUNT_LINK_REQUIRED,
        409,
      );
    if (!input.profile)
      throw new AuthFlowError(
        "ONBOARDING_REQUIRED",
        messages.ONBOARDING_REQUIRED,
        404,
      );
    const username =
      [input.firstName, input.lastName].filter(Boolean).join(" ").trim() ||
      normalizedEmail.split("@")[0];
    const [created] = await tx
      .insert(users)
      .values({
        username,
        email: normalizedEmail,
        authProvider: "google",
        passwordHash: null,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
        onboardingProfile: input.profile,
        // The account exists, but the final streak/name screens are not finished yet.
        onboardingCompletedAt: null,
      })
      .returning(safeUserSelection);
    if (!created) throw new Error("Google user could not be created.");
    return created;
  });
}

function issueToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: "1h",
  });
}

function sameOrigin(req: Request, res: Response, next: NextFunction) {
  if (req.get("origin") !== frontendUrl.origin) {
    res.status(403).json({ message: "This request must come from Notium." });
    return;
  }
  if (!req.is("application/json")) {
    res.status(415).json({ message: "Expected a JSON request." });
    return;
  }
  next();
}

function authenticatedUserId(req: Request) {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    throw new AuthFlowError("UNAUTHORIZED", "Please sign in again.", 401);
  try {
    const payload = jwt.verify(authorization.slice(7), jwtSecret, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload === "string" ||
      typeof payload.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(payload.id)
    )
      throw new Error("Invalid user ID");
    return payload.id;
  } catch {
    throw new AuthFlowError("UNAUTHORIZED", "Please sign in again.", 401);
  }
}

function returnUrl(state: string) {
  const url = new URL(frontendUrl);
  url.searchParams.set("google_auth", state);
  return url.toString();
}
function cookieOptions() {
  return {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: flowLifetime,
  };
}
function handleError(error: unknown, res: Response) {
  if (error instanceof AuthFlowError)
    return res
      .status(error.status)
      .json({ code: error.code, message: error.message });
  // Do not log full Drizzle queries/token responses containing personal data or credentials.
  console.error(
    "Google authentication failed:",
    error instanceof Error ? error.name : "Unknown error",
  );
  return res
    .status(500)
    .json({ code: "GOOGLE_AUTH_FAILED", message: messages.GOOGLE_AUTH_FAILED });
}

export type GoogleAuthOptions = {
  // Connect your real, server-side consent records here. A client-supplied ID is never approval.
  verifyParentalConsent?: (
    requestId: string,
    profile: OnboardingProfile,
  ) => Promise<boolean>;
  oauthClient?: OAuth2Client;
};

export function createGoogleAuthRouter(options: GoogleAuthOptions = {}) {
  const router = Router();
  const client =
    options.oauthClient ??
    new OAuth2Client(
      googleClientId,
      googleClientSecret,
      callbackUrl.toString(),
    );
  const ensureConsent = async (
    profile: OnboardingProfile,
    requestId: unknown,
  ) => {
    if (Number(profile.age) >= parentalConsentAge) return;
    if (
      typeof requestId !== "string" ||
      requestId.length > 160 ||
      !requestId.trim() ||
      !options.verifyParentalConsent ||
      !(await options.verifyParentalConsent(requestId, profile))
    ) {
      throw new AuthFlowError(
        "PARENTAL_CONSENT_REQUIRED",
        messages.PARENTAL_CONSENT_REQUIRED,
        403,
      );
    }
  };
  router.use((_, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    next();
  });

  router.post(
    "/auth/google/start",
    sameOrigin,
    json({ limit: "16kb" }),
    async (req, res) => {
      try {
        const mode = req.body?.mode;
        if (mode !== "sign_in" && mode !== "sign_up")
          throw new AuthFlowError(
            "INVALID_REQUEST",
            "Choose sign_in or sign_up.",
          );
        const profile =
          mode === "sign_up" ? parseProfile(req.body?.profile) : undefined;
        if (mode === "sign_up" && !profile)
          throw new AuthFlowError(
            "INVALID_PROFILE",
            "Complete your learning preferences first.",
          );
        const consentRequestId =
          typeof req.body?.consentRequestId === "string"
            ? req.body.consentRequestId.trim()
            : undefined;
        if (consentRequestId && consentRequestId.length > 160)
          throw new AuthFlowError(
            "INVALID_REQUEST",
            "Invalid consent request.",
          );
        if (profile) await ensureConsent(profile, consentRequestId);
        await db
          .delete(googleOAuthTransactions)
          .where(lt(googleOAuthTransactions.expiresAt, new Date()));
        const state = randomSecret(),
          browserSecret = randomSecret(),
          nonce = randomSecret(),
          verifier = randomSecret();
        const stateHash = hashSecret(state);
        await db.insert(googleOAuthTransactions).values({
          stateHash,
          browserSecretHash: hashSecret(browserSecret),
          mode,
          nonce,
          codeVerifier: verifier,
          profile: profile ?? null,
          consentRequestId: consentRequestId ?? null,
          expiresAt: new Date(Date.now() + flowLifetime),
        });
        const authorizationUrl = client.generateAuthUrl({
          scope: ["openid", "email", "profile"],
          response_type: "code",
          redirect_uri: callbackUrl.toString(),
          state,
          nonce,
          code_challenge: pkceChallenge(verifier),
          code_challenge_method: CodeChallengeMethod.S256,
          prompt: "select_account",
        });
        res.cookie(flowCookieName(stateHash), browserSecret, cookieOptions());
        return res.json({ authorizationUrl });
      } catch (error) {
        return handleError(error, res);
      }
    },
  );

  router.get("/auth/google/callback", async (req, res) => {
    const state = req.query.state;
    if (!isSecret(state))
      return res
        .status(400)
        .send("Invalid Google sign-in state. Return to Notium and try again.");
    const stateHash = hashSecret(state);
    const browserSecret = readCookie(
      req.headers.cookie,
      flowCookieName(stateHash),
    );
    if (!isSecret(browserSecret))
      return res
        .status(400)
        .send(
          "Google sign-in could not be matched to this browser. Return to Notium and try again.",
        );
    let flow: typeof googleOAuthTransactions.$inferSelect | undefined;
    try {
      // Atomically claim the pending transaction. Callback replays cannot exchange a code twice.
      [flow] = await db
        .update(googleOAuthTransactions)
        .set({ status: "processing" })
        .where(
          and(
            eq(googleOAuthTransactions.stateHash, stateHash),
            eq(
              googleOAuthTransactions.browserSecretHash,
              hashSecret(browserSecret),
            ),
            eq(googleOAuthTransactions.status, "pending"),
            gt(googleOAuthTransactions.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!flow)
        return res
          .status(400)
          .send(
            "Google sign-in has expired or was already processed. Return to Notium and try again.",
          );
      if (req.query.error)
        throw new AuthFlowError("GOOGLE_CANCELLED", messages.GOOGLE_CANCELLED);
      const code = req.query.code;
      if (
        typeof code !== "string" ||
        !code ||
        code.length > 4096 ||
        !flow.codeVerifier ||
        !flow.nonce
      )
        throw new Error("Invalid callback");
      const { tokens } = await client.getToken({
        code,
        codeVerifier: flow.codeVerifier,
        redirect_uri: callbackUrl.toString(),
      });
      if (!tokens.id_token) throw new Error("Missing ID token");
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: googleClientId,
      });
      const payload = ticket.getPayload() as
        | (TokenPayload & { nonce?: string })
        | undefined;
      if (
        !payload?.sub ||
        !payload.email ||
        payload.email_verified !== true ||
        payload.nonce !== flow.nonce
      )
        throw new Error("Invalid Google identity");
      if (flow.profile)
        await ensureConsent(flow.profile, flow.consentRequestId);
      const user = await findOrCreateGoogleUser({
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name ?? "",
        lastName: payload.family_name ?? "",
        avatarUrl: payload.picture ?? null,
        profile: flow.profile ?? undefined,
      });
      await db
        .update(googleOAuthTransactions)
        .set({
          status: "succeeded",
          nonce: null,
          codeVerifier: null,
          result: {
            userId: user.id,
            firstName: payload.given_name ?? "",
            lastName: payload.family_name ?? "",
          },
          expiresAt: new Date(Date.now() + resultLifetime),
        })
        .where(eq(googleOAuthTransactions.stateHash, stateHash));
    } catch (error) {
      if (!flow) return handleError(error, res);
      const errorCode =
        error instanceof AuthFlowError ? error.code : "GOOGLE_AUTH_FAILED";
      try {
        await db
          .update(googleOAuthTransactions)
          .set({
            status: "failed",
            nonce: null,
            codeVerifier: null,
            result: { errorCode },
            expiresAt: new Date(Date.now() + resultLifetime),
          })
          .where(eq(googleOAuthTransactions.stateHash, stateHash));
      } catch (storageError) {
        return handleError(storageError, res);
      }
    }
    // Only opaque state travels through the URL. Neither JWTs nor profile data are in it.
    return res.redirect(303, returnUrl(state));
  });

  router.post(
    "/auth/google/result",
    sameOrigin,
    json({ limit: "2kb" }),
    async (req, res) => {
      try {
        const state = req.body?.state;
        if (!isSecret(state))
          throw new AuthFlowError("FLOW_EXPIRED", messages.FLOW_EXPIRED, 400);
        const stateHash = hashSecret(state),
          cookieName = flowCookieName(stateHash);
        const browserSecret = readCookie(req.headers.cookie, cookieName);
        if (!isSecret(browserSecret))
          throw new AuthFlowError("FLOW_EXPIRED", messages.FLOW_EXPIRED, 400);
        // Delete-and-return makes handing over the local session a one-time operation.
        const [flow] = await db
          .delete(googleOAuthTransactions)
          .where(
            and(
              eq(googleOAuthTransactions.stateHash, stateHash),
              eq(
                googleOAuthTransactions.browserSecretHash,
                hashSecret(browserSecret),
              ),
              inArray(googleOAuthTransactions.status, ["succeeded", "failed"]),
              gt(googleOAuthTransactions.expiresAt, new Date()),
            ),
          )
          .returning();
        if (!flow)
          throw new AuthFlowError("FLOW_EXPIRED", messages.FLOW_EXPIRED, 400);
        const { maxAge: _maxAge, ...clearOptions } = cookieOptions();
        res.clearCookie(cookieName, clearOptions);
        if (flow.status === "failed")
          return res.json({
            ok: false,
            mode: flow.mode,
            profile: flow.profile,
            code: flow.result?.errorCode ?? "GOOGLE_AUTH_FAILED",
            message:
              messages[flow.result?.errorCode ?? ""] ??
              messages.GOOGLE_AUTH_FAILED,
          });
        if (!flow.result?.userId) throw new Error("Missing OAuth result");
        const [user] = await db
          .select(safeUserSelection)
          .from(users)
          .where(eq(users.id, flow.result.userId))
          .limit(1);
        if (!user) throw new Error("Google account no longer exists");
        return res.json({
          ok: true,
          mode: flow.mode,
          token: issueToken(user),
          user,
          next: user.onboardingCompletedAt ? "dashboard" : "onboarding",
          profile: user.onboardingProfile,
          firstName: flow.result.firstName ?? "",
          lastName: flow.result.lastName ?? "",
        });
      } catch (error) {
        return handleError(error, res);
      }
    },
  );

  router.post(
    "/auth/google/profile",
    sameOrigin,
    json({ limit: "2kb" }),
    async (req, res) => {
      try {
        const id = authenticatedUserId(req);
        const firstName = req.body?.firstName,
          lastName = req.body?.lastName;
        if (
          typeof firstName !== "string" ||
          !firstName.trim() ||
          firstName.length > 80 ||
          typeof lastName !== "string" ||
          lastName.length > 80
        )
          throw new AuthFlowError(
            "INVALID_NAME",
            "Enter your first name and a last name of up to 80 characters.",
          );
        const [user] = await db
          .select({ googleId: users.googleId })
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        if (!user?.googleId)
          throw new AuthFlowError(
            "UNAUTHORIZED",
            "Sign in with Google first.",
            403,
          );
        const [updated] = await db
          .update(users)
          .set({
            username: [firstName.trim(), lastName.trim()]
              .filter(Boolean)
              .join(" "),
          })
          .where(eq(users.id, id))
          .returning(safeUserSelection);
        return res.json({ user: updated });
      } catch (error) {
        return handleError(error, res);
      }
    },
  );

  router.post(
    "/auth/onboarding/complete",
    sameOrigin,
    json({ limit: "16kb" }),
    async (req, res) => {
      try {
        const id = authenticatedUserId(req),
          profile = parseProfile(req.body?.profile, true);
        if (!profile)
          throw new AuthFlowError(
            "INVALID_PROFILE",
            "Complete your learning preferences and streak goal first.",
          );
        await ensureConsent(profile, req.body?.consentRequestId);
        const [user] = await db
          .update(users)
          .set({
            onboardingProfile: profile,
            onboardingCompletedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning(safeUserSelection);
        if (!user)
          throw new AuthFlowError("UNAUTHORIZED", "Please sign in again.", 401);
        return res.json({ user });
      } catch (error) {
        return handleError(error, res);
      }
    },
  );
  return router;
}

export default createGoogleAuthRouter();
