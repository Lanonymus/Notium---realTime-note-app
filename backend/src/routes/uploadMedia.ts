import express from "express"
import { supabaseAdmin } from "../db/supabaseAdmin.js"
import multer from "multer"


const uploadMediaRouter = express.Router()
const upload = multer({ storage: multer.memoryStorage()})


uploadMediaRouter.post("/upload-media", upload.single("file"), async (req, res) => {
    try {
        const file = req.file

        const fileName = req.body.fileName
        const projectID = req.body?.projectID

        if(!file || !fileName || !projectID) return res.status(400).json({ message: "File, file name and projectID is required" })


        // Ścieżka w Supabase Storage (np. editor/1787071617087_bartek_1.jpg lub z podfolderem docId)
        const filePath = `editor/${projectID}/${fileName}` 

        const { data, error } = await supabaseAdmin.storage
            .from("Notium_Media")
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if(error) return res.status(500).json({ message: error.message })


        return res.status(200).json({ message: "File uploaded successfully"})


    } catch (err) {
        console.error("Error uploading file:", err);
        return res.status(500).json({ message: `Error uploading file: ${err}` });
}
})

export default uploadMediaRouter;
