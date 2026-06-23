import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";


dotenv.config();

const ARCJET_KEY = process.env.ARCJET_KEY;
const ARCJET_MODE = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";


export const httpArcjet = ARCJET_KEY ? 
    arcjet({
        key: ARCJET_KEY,
        rules: [
            shield({ mode: ARCJET_MODE }),
            detectBot({ mode: ARCJET_MODE, allow: ["CATEGORY:PREVIEW", "CATEGORY:SEARCH_ENGINE"]}),
            slidingWindow({ mode: ARCJET_MODE, interval: "10s", max: 25})
        ]
    }) : null

export const wsArcjet = ARCJET_KEY ? 
    arcjet({
        key: ARCJET_KEY,
        rules: [
            shield({ mode: ARCJET_MODE }),
            detectBot({ mode: ARCJET_MODE, allow: ["CATEGORY:PREVIEW", "CATEGORY:SEARCH_ENGINE"]}),
            slidingWindow({ mode: ARCJET_MODE, interval: "2s", max: 5})
        ]
    }) : null


export function httpArcjetMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!httpArcjet) return next();

        try {
            const decision = await httpArcjet.protect(req)
            if(decision.isDenied()) {
                console.warn(`[ARCJET BLOCKED] IP: ${req.ip} | Reason: ${decision.reason.type}`);

                if(decision.reason.isRateLimit()) {
                    return res.status(429).json({ message: "Too many requests"})
                }
                return res.status(403).json({ message: "Forbidden" })
            }
        } catch (error) {
            console.error("[ARCJET ERROR] Problem with Arcjet shield:", error)
            return res.status(503).json({ message: "service unavailable"})
        }

        return next()

    }
}

