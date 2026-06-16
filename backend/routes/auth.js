// /routes/auth.js
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js';

const router = express.Router();
const JWT_SECRET = "supersecret"; // w praktyce wrzucasz w .env

// Rejestracja
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  
  try {
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [username, email, hashed]
    );
    const user = result.rows[0]

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" }); // 1 godzina działania tokenu
    console.log('token przy rejestracji: ', token);
    

    res.json({ success: true, userId: user.id, token: token });

  } catch (err) {
    if (err.code === '23505') {
      // użytkownik już istnieje
      return res.status(400).json({ success: false, message: "Użytkownik już istnieje", flag: "userExists" });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Coś poszło nie tak" });
    }
});

// Logowanie
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);
  const user = result.rows[0];

  if (!user) return res.status(400).json({ success: false, message: "Nie poprawne dane", flag: "invalidEmail"});

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(400).json({ success: false, message: "Wrong password", flag: "invalidPassword" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" }); // 1 godzina działania tokenu

  res.json({ success: true, token: token });
});


// Verifying data fetch request
router.get("/getUserData", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader; // "Bearer <token>"

  if (!token) return res.status(401).json({ success: false, message: "Brak tokena" });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Niepoprawny token" });

    try {
      const result = await pool.query("SELECT id, email, username FROM users WHERE id=$1", [decoded.userId]);
      
      const user = result.rows[0];

      res.json({ success: true, user });
    } catch (dbErr) {
      res.status(500).json({ success: false, message: "Błąd serwera" });
    }
  });
});



export default router
