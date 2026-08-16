import dotenv, { configDotenv } from "dotenv"
import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"


dotenv.config()

const JWT_SECRET: string = process.env.JWT_SECRET || "no_key_provided"

// 1. Globalne rozszerzenie standardowego interfejsu Request z Expressa
declare global {
  namespace Express {
    interface Request {
      userId?: string; // Tutaj dodajesz to, co chcesz trzymać w requestach
    }
  }
}

const AuthTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token

    if(!token) {
        return res.status(401).json({ success: false, message: "Brak tokenu autoryzacyjnego lub wygasły"})
        // status 401 - unauthorized
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string}
        req.userId = decoded.userId
        next()
    } catch (error) {
        return res.status(403).json({ success: false, message: "nieprawidłowy lub wygasły token"})
    }
} 

export default AuthTokenMiddleware;