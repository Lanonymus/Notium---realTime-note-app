import express from "express"
import { supabaseAdmin } from "../db/supabaseAdmin.js"
import multer from "multer"

const mediaRouter = express.Router()
const upload = multer({ storage: multer.memoryStorage()})

mediaRouter.post("/upload-media", upload.single("file"), async (req, res) => {
    try {
        const file = req.file
        if(!file) return res.status(400).json({ message: "File is required" })

        const fileName = `editor/${Date.now()}_${file.originalname}`

        const { data, error } = await supabaseAdmin.storage
            .from("Notium_Media")
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if(error) return res.status(500).json({ message: error.message })

        const { data: publicUrlObject } = supabaseAdmin.storage
            .from("Notium_Media")
            .getPublicUrl(fileName)

        if(!publicUrlObject) return res.status(500).json({ message: "Failed to get public URL" })   

        const imageUrl = publicUrlObject.publicUrl

        return res.status(200).json({ message: "File uploaded successfully", url: imageUrl  })


    } catch (err) {
        console.error("Error uploading file: ")
        return res.status(500).json({ message: `Error uploading file. Please try again later: ${err}` })
    }
})

export default mediaRouter;
