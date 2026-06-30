// /routes/auth.js
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/db.js'
import { userRegisterSchema, userLoginSchema } from '../validation/users.js';
import { users } from '../db/schema.js';
import dotenv from "dotenv"
import { eq } from 'drizzle-orm';
import { JwtPayload } from 'jsonwebtoken';

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
        username: parsedData.data.username,
        email: parsedData.data.email,
        passwordHash: passwordHash
    }).returning();

    const jwtToken = jwt.sign({ userId: user.id }, JWT_SECRET, {   expiresIn: "7d" });

    res.status(201).json({ 
      success: true, 
      message: "Created user", 
      userId: user.id, 
      token: jwtToken, 
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

    const token = jwt.sign({ userId: user.id, username: user.username}, JWT_SECRET, { expiresIn: '7d'})
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


// Verifying data fetch request
userRouter.get("/getUserData", (req, res) => {
  const token = req.headers["authorization"]

  // Błędny token lub brak
  if(!token) return res.status(401).json({ 
    message: "Not a valid token", 
    flag: "INVALID_TOKEN",
    success: false 
  })

  jwt.verify(token, JWT_SECRET, async (error, decoded) => {
    if(error) {
      return res.status(401).json({ 
        message: "Not a valid token",
        flag: "INVALID_TOKEN",
        success: false 
      })
    }

    const decodedPayload = decoded as JwtPayload & { userId?: number };
    const decodedId = decodedPayload.userId;

    if (!decodedId) {
      return res.status(401).json({ 
        message: "Problem with conversion",
        flag: "JWT_CONVERSION_ERROR",
        success: false 
      })
    }

    try {
      const [data] = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedId))

      if (!data) {
        return res.status(404).json({ 
          message: "User not found",
          flag: "USER_NOT_FOUND",
          success: false 
        })
      }

      return res.status(200).json({
        message: "User data fetched successfully",
        data: data,
        flag: "DATA_FETCHED",
        success: true
      })

    } catch (error) {
      console.error("Error fetching user data", error)
      return res.status(500).json({
        message: "Internal server error",
        flag: "INTERNAL_SERVER_ERROR",
        success: false
      })
    }
})
});



export default userRouter
