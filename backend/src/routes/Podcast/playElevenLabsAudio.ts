import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const testText = "tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. No"


router.post("/playElevenLabsAudio", async (req, res) => {
  try {

    const audioStream = await elevenlabs.textToSpeech.stream(
      "JBFqnCBsd6RMkjVDRZzb",
      {
        text: testText,
        modelId: "eleven_flash_v2_5",
        outputFormat: "mp3_44100_128",
      }
    );

    // Bardzo ważne — to NIE jest JSON.
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Przepuszczamy każdy chunk natychmiast do klienta
    for await (const chunk of audioStream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error("ElevenLabs error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate audio",
      });
    }
  }
});

export default router;