import express from 'express'
import http from 'http'
import initWebSocket from './ws/ws.js'
import cors from 'cors'
import dotenv from 'dotenv'
import projectRouter from './routes/CreateProject/createProject.js'
import { httpArcjetMiddleware } from './arcjet.js'
import uploadMediaRouter from './routes/uploadMedia.js'
import deleteImgRouter from './routes/deleteImage.js'
import Router_AI from './routes/notiumAi.js'
import chatRouter from './routes/chatAPI.js';
import cookieParser from "cookie-parser";
import mediaProxyRouter from './routes/mediaProxyRouter.js';
import DataToTextRouter from './routes/DataToText.js';
import generateQuizRouter from './routes/generateQuiz.js';
import checkAnswerRouter from './routes/checkAnswer.js';
import getQuizezRouter from './routes/getQuizez.js';
import saveQuizProgressRouter from './routes/saveQuizProgress.js';
import updateTitleRouter from './routes/Title/updateTitle.js';
import generateFlashcardsRouter from './routes/Flashcards/generateFlashcards.js';
import getFlashcardsRouter from './routes/Flashcards/getFlashcardSets.js';
import saveFlashcardSetProgressRouter from './routes/Flashcards/saveFlashcardSetProgress.js';
import { createVoiceSamplesRouter } from './routes/Podcast/voiceSamplesRouter.js';
import { db } from './db/db.js';
import { supabaseAdmin } from './db/supabaseAdmin.js';
import AuthTokenMiddleware from './controllers/AuthTokenMiddleware.js';
import generateScenarioRouter from './routes/Podcast/generateScenarioRouter.js';
import playElevenlabsAudioRouter from './routes/Podcast/playElevenLabsAudio.js';
import generatePodcastAudioRouter from './routes/Podcast/generatePodcastAudioRouter.js';
import extractFilesRouter from './routes/Podcast/extractFilesRouter.js';
import getPodcastsRouter from './routes/Podcast/getPodcasts.js';
import extendStreakRouter from './routes/extendStreak.js';
import getUserDataRouter from './routes/getUserData.js';
import activityRouter from './routes/Activity/activityRouter.js';
import completeRouter from './routes/Activity/complete.js';
import { seedSkills } from './db/seedSkills.js';
import userRouter from './routes/userAuth.js';
import googleAuthRouter from './routes/UserAuth/googleAuth.js';

dotenv.config()

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
if (!elevenLabsApiKey) throw new Error("Missing ELEVENLABS_API_KEY");

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0"


// Dla stron hostingowych, które będą pośrednikami między Twoim serwerem a frontendem,

app.set('trust proxy', 1)


app.use(cookieParser())
// Pozwól na żądania z Twojego frontendu i tłumaczenie na JSON
app.use(cors({
  origin: 'http://localhost:5173', // adres frontendu
  credentials: true,               // jeśli będziesz przesyłać ciasteczka
}));
app.use(httpArcjetMiddleware())    // limitujemy ilość żądań
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "Hello from server"})
})

app.use("/api", googleAuthRouter)
app.use("/api", userRouter)
app.use("/api", getUserDataRouter);
app.use("/api", projectRouter)
app.use("/api", uploadMediaRouter)
app.use("/api", deleteImgRouter)
app.use("/api", Router_AI);
app.use("/api", chatRouter)
app.use("/api", mediaProxyRouter)
app.use("/api", DataToTextRouter)
app.use("/api", generateQuizRouter) 
app.use("/api", checkAnswerRouter)
app.use("/api", getQuizezRouter)
app.use("/api", saveQuizProgressRouter)
app.use("/api", updateTitleRouter)
app.use("/api", generateFlashcardsRouter)
app.use("/api", getFlashcardsRouter)
app.use("/api", saveFlashcardSetProgressRouter)
app.use("/api", extractFilesRouter)
app.use("/api", generatePodcastAudioRouter)

app.use(
  "/api/voice-samples",
  createVoiceSamplesRouter({
    db,
    supabaseAdmin,
    requireAuth: AuthTokenMiddleware,
    elevenLabsApiKey,
    allowedOrigins: ["http://localhost:5173"],
    bucketName: "Notium_Media",
  })
);

app.use("/api", generateScenarioRouter)
app.use("/api", playElevenlabsAudioRouter)
app.use("/api", getPodcastsRouter)
app.use("/api", extendStreakRouter)
app.use("/api/activity", activityRouter);
app.use("/api/activity", completeRouter)





initWebSocket(server);


server.listen(PORT, HOST, () => {
  const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running on: ${baseUrl}`)
  console.log(`WebSocket server is running on: ${baseUrl.replace("http", "ws")}/ws`);

});


// seedSkills()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error("Skill seed failed", error);
//     process.exit(1);
//   });
