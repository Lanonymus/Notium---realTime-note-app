import express from "express"
import { Request, Response } from "express"
import { db } from "../db/db.js";
import { chats, projects } from "../db/schema.js";
import { eq } from "drizzle-orm";
import AuthTokenMiddleware from "../controllers/AuthTokenMiddleware.js";

const chatRouter = express.Router()


chatRouter.get("/getAllChats", AuthTokenMiddleware, async (req: Request, res: Response) => {
    const projectID = req.query.projectID as string

    if(!projectID) {
        return res.status(400).json({ success: false, message: `ID projektu nie istnieje`})
    }

    const data = await db.select().from(chats).where(eq(chats.projectID, projectID))
   
    return res.status(200).json({ data: data, succes: true})
})

chatRouter.post("/updateChat", async (req: Request, res: Response) => {
    try {
        const { chatID, projectID, updatedMessages } = req.body


        console.log("update chatu");
        
        await db
            .update(chats)
            .set({ messages: updatedMessages})
            .where(eq(chats.id, chatID))
            
        return res.status(201).json({ success: true, message: "updated ai chat messages: ", chatID})
    } catch (error) {
        console.log("internal problem with server from /updateChat: ", error);
        
    }
})


chatRouter.post("/deleteChat",AuthTokenMiddleware, async (req: Request, res: Response) => {
    try {
        const chatID = req.query.chatID as string

        if(!chatID) {
            throw new Error("Brak id chatu do usunięcia")
        }
        
        await db
            .delete(chats)
            .where(eq(chats.id, chatID))
            
        return res.status(201).json({ success: true, message: "chat deleted ", chatID})
    } catch (error) {
        console.log("internal problem with server during CHAT DELETION /updateChat: ", error);
        
    }
})



export default chatRouter