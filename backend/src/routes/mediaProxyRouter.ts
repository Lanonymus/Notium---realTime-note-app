import express from "express";
import { supabaseAdmin } from "../db/supabaseAdmin.js";

const mediaProxyRouter = express.Router();

mediaProxyRouter.get("/media/:projectID/:fileName", async (req, res) => {
    try {
        const { projectID, fileName } = req.params;
        const filePath = `editor/${projectID}/${fileName}`;

        // Pobieramy plik (Blob) bezpośrednio z prywatnego bucketa
        const { data, error } = await supabaseAdmin.storage
            .from("Notium_Media")
            .download(filePath);

        if (error || !data) {
            console.error("Błąd pobierania z Supabase:", error);
            return res.status(404).json({ message: "Image not found" });
        }

        // Supabase zwraca obiekt Blob. Express wymaga formatu Buffer do wysłania
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Przekazujemy przeglądarce odpowiednie nagłówki typu pliku i cache'owania
        res.setHeader("Content-Type", data.type); 
        // Wymuszamy cacheowanie w przeglądarce (np. przez 24 godziny), 
        // aby edytor nie pytał backendu o to samo zdjęcie przy każdym odświeżeniu
        res.setHeader("Cache-Control", "public, max-age=86400");

        return res.send(buffer);

    } catch (err) {
        console.error("Error serving media: ", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default mediaProxyRouter;