import express, { type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { and, eq, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { projects } from "../db/schema.js";
import { supabaseAdmin } from "../db/supabaseAdmin.js";
import AuthTokenMiddleware from "../controllers/AuthTokenMiddleware.js";

const projectCoverRouter = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const COVER_BUCKET = "Notium_Media";
const MAX_GENERATION_ATTEMPTS = 3;
const LEASE_DURATION_MS = 5 * 60 * 1000;

const extensionForMimeType = (mimeType: string) => {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
};

const safeErrorCode = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("quota") || message.includes("rate"))
    return "PROVIDER_RATE_LIMIT";
  if (message.includes("safety") || message.includes("blocked"))
    return "IMAGE_BLOCKED";
  if (message.includes("storage") || message.includes("bucket"))
    return "STORAGE_ERROR";
  return "GENERATION_ERROR";
};

projectCoverRouter.post("/projects/:projectId/cover", AuthTokenMiddleware, async (req: Request, res: Response) => {
    const userId = String(req.userId);
    const projectId = String(req.params.projectId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const [project] = await db
        .select({
          id: projects.id,
          title: projects.title,
          coverPrompt: projects.coverPrompt,
          coverImageStatus: projects.coverImageStatus,
          coverImageKey: projects.coverImageKey,
          coverImageAttempts: projects.coverImageAttempts,
          coverImageRetryAfter: projects.coverImageRetryAfter,
          coverImageLeaseExpiresAt: projects.coverImageLeaseExpiresAt,
        })
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, userId)),
        )
        .limit(1);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      if (!project.coverPrompt?.trim()) {
        return res.status(409).json({
          success: false,
          message: "Project does not have a cover prompt",
        });
      }

      // Idempotencja: ponowne kliknięcie nie tworzy kolejnej okładki.
      if (project.coverImageStatus === "ready" && project.coverImageKey) {
        return res.status(200).json({
          success: true,
          status: "ready",
          storageKey: project.coverImageKey,
        });
      }

      const now = new Date();

      if (
        project.coverImageStatus === "generating" &&
        project.coverImageLeaseExpiresAt &&
        project.coverImageLeaseExpiresAt > now
      ) {
        return res.status(202).json({
          success: true,
          status: "generating",
        });
      }

      if (project.coverImageAttempts >= MAX_GENERATION_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          status: "failed",
          message: "Maximum cover generation attempts reached",
        });
      }

      if (
        project.coverImageRetryAfter &&
        project.coverImageRetryAfter > now
      ) {
        return res.status(429).json({
          success: false,
          status: project.coverImageStatus,
          retryAfter: project.coverImageRetryAfter.toISOString(),
          message: "Cover generation can be retried later",
        });
      }

      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(Date.now() + LEASE_DURATION_MS);

      // Atomowe przejęcie pracy zapobiega dwóm równoległym generacjom.
      const [claimedProject] = await db
        .update(projects)
        .set({
          coverImageStatus: "generating",
          coverImageErrorCode: null,
          coverImageAttempts: sql`${projects.coverImageAttempts} + 1`,
          coverImageRetryAfter: null,
          coverImageLeaseToken: leaseToken,
          coverImageLeaseExpiresAt: leaseExpiresAt,
          coverImageUpdatedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.userId, userId),
            lt(projects.coverImageAttempts, MAX_GENERATION_ATTEMPTS),
            or(
              isNull(projects.coverImageRetryAfter),
              lte(projects.coverImageRetryAfter, now),
            ),
            or(
              eq(projects.coverImageStatus, "pending"),
              eq(projects.coverImageStatus, "failed"),
              and(
                eq(projects.coverImageStatus, "generating"),
                or(
                  isNull(projects.coverImageLeaseExpiresAt),
                  lte(projects.coverImageLeaseExpiresAt, now),
                ),
              ),
            ),
          ),
        )
        .returning({ id: projects.id });

      if (!claimedProject) {
        return res.status(409).json({
          success: false,
          message: "Cover generation cannot be started in the current state",
        });
      }

      let uploadedStorageKey: string | null = null;

      try {
        const imageResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    "Create a clean educational project cover image.",
                    `Project title: ${project.title}`,
                    `Visual brief: ${project.coverPrompt.trim()}`,
                    "No logos, watermarks, UI elements or readable text.",
                    "Use a clear focal point and a polished editorial illustration style.",
                  ].join("\n"),
                },
              ],
            },
          ],
          config: {
            responseModalities: ["IMAGE"],
            responseFormat: {
              image: {
                aspectRatio: "16:9",
                imageSize: "1K",
              },
            },
          },
        });

        const responseParts =
          imageResponse.candidates?.[0]?.content?.parts ?? [];
        const imagePart = responseParts.find(
          (part) => part.inlineData?.data,
        );
        const base64Image = imagePart?.inlineData?.data;
        const mimeType = imagePart?.inlineData?.mimeType || "image/png";

        if (!base64Image) {
          throw new Error("IMAGE_GENERATION_EMPTY_RESPONSE");
        }

        const imageBuffer = Buffer.from(base64Image, "base64");
        const extension = extensionForMimeType(mimeType);
        const storageKey =
          `project-covers/${userId}/${projectId}/cover-${leaseToken}.${extension}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(COVER_BUCKET)
          .upload(storageKey, imageBuffer, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`STORAGE_UPLOAD_FAILED: ${uploadError.message}`);
        }

        uploadedStorageKey = storageKey;

        const [updatedProject] = await db
          .update(projects)
          .set({
            coverImageStatus: "ready",
            coverImageKey: storageKey,
            coverImageMimeType: mimeType,
            coverImageErrorCode: null,
            coverImageRetryAfter: null,
            coverImageLeaseToken: null,
            coverImageLeaseExpiresAt: null,
            coverImageUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, projectId),
              eq(projects.userId, userId),
              eq(projects.coverImageLeaseToken, leaseToken),
            ),
          )
          .returning({
            id: projects.id,
            coverImageStatus: projects.coverImageStatus,
            coverImageKey: projects.coverImageKey,
          });

        if (!updatedProject) {
          throw new Error("PROJECT_UPDATE_FAILED");
        }

        return res.status(200).json({
          success: true,
          status: updatedProject.coverImageStatus,
          storageKey: updatedProject.coverImageKey,
        });
      } catch (error) {
        // Jeżeli upload się udał, ale zapis projektu nie, usuń osierocony plik.
        if (uploadedStorageKey) {
          await supabaseAdmin.storage
            .from(COVER_BUCKET)
            .remove([uploadedStorageKey]);
        }

        const errorCode = safeErrorCode(error);
        const retryDelayMs = Math.min(
          60_000 * 2 ** project.coverImageAttempts,
          15 * 60_000,
        );

        await db
          .update(projects)
          .set({
            coverImageStatus: "failed",
            coverImageKey: null,
            coverImageMimeType: null,
            coverImageErrorCode: errorCode,
            coverImageRetryAfter: new Date(Date.now() + retryDelayMs),
            coverImageLeaseToken: null,
            coverImageLeaseExpiresAt: null,
            coverImageUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, projectId),
              eq(projects.userId, userId),
              eq(projects.coverImageLeaseToken, leaseToken),
            ),
          );

        console.error("Project cover generation failed", {
          projectId,
          errorCode,
        });

        return res.status(502).json({
          success: false,
          status: "failed",
          errorCode,
          message: "Could not generate the project cover",
        });
      }
    } catch (error) {
      console.error("Project cover endpoint failed", { projectId, error });

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default projectCoverRouter;
