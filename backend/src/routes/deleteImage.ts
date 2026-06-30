import express from "express"
import { supabaseAdmin } from "../db/supabaseAdmin.js"


const deleteImgRouter = express.Router()


deleteImgRouter.delete("/delete-image", async (req, res) => {
    try {
        const imgUrl = decodeURIComponent(req.body.url)
        console.log("Image URL to delete: ", imgUrl)

        if(!imgUrl) return res.status(400).json({ 
            message: "URL is required",
            success: false 
       })

        const bucketName = "Notium_Media"

        const urlDelimitier = `/storage/v1/object/public/${bucketName}/`
        const filePath = imgUrl.split(urlDelimitier)[1]
        if(!filePath) return res.status(400).json({
            message: "Invalid image URL",
            success: false
        })

        const { data, error} = await supabaseAdmin.storage
            .from(bucketName)
            .remove([filePath])

        if(error) {
            console.error("Error in removing file from storage", data)
            return res.status(500).json({ 
                message: "Critial problem on the side of supabase",
                success: false
            })
        }
        
        console.log("Succesfuly deleted image from database: ", data);
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