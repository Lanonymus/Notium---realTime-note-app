import express from 'express'
import http from 'http'
import userRouter from './routes/userAuth.js'
import initWebSocket from './ws/ws.js'
import cors from 'cors'
import dotenv from 'dotenv'
import projectRouter from './routes/project.js'
import { httpArcjetMiddleware } from './arcjet.js'


dotenv.config()

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0"


// Dla stron hostingowych, które będą pośrednikami między Twoim serwerem a frontendem,

app.set('trust proxy', true)

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
app.use("/api", userRouter);
app.use("/api", projectRouter)


initWebSocket(server);


server.listen(PORT, HOST, () => {
  const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running on: ${baseUrl}`)
  console.log(`WebSocket server is running on: ${baseUrl.replace("http", "ws")}/ws`);

});
