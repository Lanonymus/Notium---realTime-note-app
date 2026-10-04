import express from "express"
import { supabaseAdmin } from "../db/supabaseAdmin.js"

const deleteImgRouter = express.Router()

deleteImgRouter.delete("/delete-image", async (req, res) => {
    try {
        // Zmieniliśmy nazwę z imgUrl na filePath, bo frontend wysyła np. "editor/123/plik.jpg"
        const filePath = decodeURIComponent(req.body.url)
        console.log("File path to delete: ", filePath)

        if(!filePath) return res.status(400).json({ 
            message: "File path is required",
            success: false 
       })

        const bucketName = "Notium_Media"
        
        // Supabase .remove() przyjmuje tablicę ścieżek
        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .remove([filePath])

        if(error) {
            // Poprawiono: logujemy obiekt `error`, a nie `data`
            console.error("Error in removing file from storage", error)
            return res.status(500).json({ 
                message: "Critical problem on the side of supabase",
                success: false
            })
        }
        
        console.log("Successfully deleted image from database: ", data);
        return res.status(200).json({ 
            message: "Image deleted successfully",
            success: true,
        })

    } catch (error) {
        console.error("Error in deleting image:", error)
        return res.status(500).json({ 
            message: "Internal problem with deleting image",
            success: false 
        })
    }
})

export default deleteImgRouter;