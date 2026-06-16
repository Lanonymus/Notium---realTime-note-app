import express from 'express'
import http from 'http'
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js'
import initWebSocket from './ws.js'
import cors from 'cors'

const app = express();
const server = http.createServer(app);

// Moje Api
app.get("/", (req, res) => res.send({ message: "Hello chat"}))

// Pozwól na żądania z Twojego frontendu
app.use(cors({
  origin: 'http://localhost:5173', // adres frontendu
  credentials: true,               // jeśli będziesz przesyłać ciasteczka
}));

app.use(bodyParser.json());
app.use("/api", authRoutes);

initWebSocket(server);

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`\nHTTPS + WS running on http://localhost:${PORT}`);
});
