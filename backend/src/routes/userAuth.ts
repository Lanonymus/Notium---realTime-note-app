// /routes/auth.js
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/db.js'
import { userRegisterSchema, userLoginSchema } from '../validation/users.js';
import { projects, users } from '../db/schema.js';
import dotenv from "dotenv"
import { eq } from 'drizzle-orm';
import {v4 as uuidv4} from "uuid"
import AuthTokenMiddleware from '../controllers/AuthTokenMiddleware.js';
import { Request, Response } from "express"
import { success } from 'zod';

dotenv.config()


const userRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret"; // w praktyce wrzucasz w .env
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 6; // w praktyce wrzucasz w .env

// Rejestracja
userRouter.post("/register", async (req, res) => {
  const parsedData = userRegisterSchema.safeParse(req.body)

  if(!parsedData.success) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid register data", 
      details: parsedData.error.issues 
    });
  }

  try {
    const passwordHash = await bcrypt.hash(parsedData.data.password, SALT_ROUNDS);

    const [ user ] = await db.insert(users).values({
        id: uuidv4(),
        username: parsedData.data.username,
        email: parsedData.data.email,
        passwordHash: passwordHash
    }).returning();

    const token = jwt.sign({ userId: user.id, username: parsedData.data.username }, JWT_SECRET, {   expiresIn: "7d" });

    // res.cookie(nazwa, wartość, [opcje])
    res.cookie("token", token, {
      httpOnly: true, // zabezpiecza przed inject XSS kodem od hackerów na frontendzie hacker nie ma dostępu do cookie (cross-site scripting)
      secure: process.env.NODE_ENV === "production", // na produkcji wymaga protokołu HTTPS - secure
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // czas życia cookie - 7 dni
      path: "/" // żeby na wszystkich endpointach było widoczne
    })

    res.status(201).json({ 
      success: true, 
      message: "Created user", 
      userId: user.id, 
      token: token, 
      flag: "CREATED_USER"});
 
  } catch (error: any) {

  // Wyciągamy kod błędu z pola .cause, do którego Drizzle pakuje błędy bazy
    const pgDrizzleErrorCode = error.cause?.code;
    console.log("Wykryty kod błędu Postgresa:", pgDrizzleErrorCode);
    

    if(pgDrizzleErrorCode === '23505') {
      return res.status(400).json({
        success: false,
        message: "User arleady exists",
        flag: "USER_EXISTS"
      })
    }


    console.error("Error creating user", error)
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Logowanie
userRouter.post("/login", async (req, res) => {
  const parsedData = userLoginSchema.safeParse(req.body)
  

  if(!parsedData.success) {
    return res.status(400).json({ 
      message: "Invalid login data", 
      flag: "INVALID_DATA",
      success: false 
    })
  }
  const { email, password } = parsedData.data
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if(!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
        flag: "INVALID_CREDENTIALS",
        success: false 
      })}

    // Funkcja bcrypt, przyjmuje surowe hasło z np. formularza i hashuje względem soli z drugiego aegumentu i sprawdza
    const isPassCorrect = await bcrypt.compare(password, user.passwordHash);

    if(!isPassCorrect) {
      return res.status(400).json({ 
        message: "Invalid Email or Password",
        flag: "INVALID_CREDENTIALS",
        success: false 
    })}

    // generowanie tokenu na 7 dni
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username
      },
      JWT_SECRET, 
      { expiresIn: '7d'}
    )

    // res.cookie(nazwa, wartość, [opcje])
    res.cookie("token", token, {
      httpOnly: true, // zabezpiecza przed inject XSS kodem od hackerów na frontendzie hacker nie ma dostępu do cookie (cross-site scripting)
      secure: process.env.NODE_ENV === "production", // na produkcji wymaga protokołu HTTPS - secure
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // czas życia cookie - 7 dni
    })


    return res.status(201).json({ 
      message: "Login successful",
      flag: "LOGIN_SUCCESS",
      success: true,
      token: token
    })
  } catch (error: any) {
    console.error("Couldn't log into account: ", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      flag:"INTERNAL_SERVER_ERROR",
      success: false 
    })
  }

});

export default userRouter;


