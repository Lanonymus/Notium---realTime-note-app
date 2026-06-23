import type { Room } from "./ws.js"
import { broadcastToRoom } from "./helperFunctions.js"
import { WebSocket } from "ws"
import { db } from "../db/db.js"
import { project } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { v4 as uuidv4, v4 } from 'uuid';

// --- STRATEGIA OBSŁUGI WIADOMOŚCI WZGLĘDEM FLAGI ---
type eventHandler = (ws: WebSocket, room: Room, uuid: string, data: any, roomId: number) => void

export const eventHandlers: Record<string, eventHandler> = {
    "UPDATE_CURSOR": (ws, room, uuid, data, roomId) => {
        if(!data.state || !room.users[uuid]) {
            return ws.send(JSON.stringify({ error: "Payload mismatch"}))
        }
        room.users[uuid].state = data.state
        broadcastToRoom(room, { type: "UPDATE_CURSOR", uuid: uuid, state: data.state })
    },

    "UPDATE_DOC": async (ws, room, uuid, data, roomId) => {
        if(!data.editorContent) {
            return ws.send(JSON.stringify({ error: "Payload mismatch"}))
        }
        // Zapisujemy całe drzewo / content Slate'a w pamięci serwera
        room.editorContent = data.editorContent
        room.isDirty = true
        broadcastToRoom(room, { type: "UPDATE_DOC", editorContent: data.editorContent })

    },

    "UPDATE_TITLE": async (ws, room, uuid, data, roomId) => {
        if (!data.editorTitle) {
            return ws.send(JSON.stringify({ error: "Payload mismatch"}))
        };
        room.editorTitle = data.editorTitle;

        try {
            const [result] = await db
               .update(project)
                .set({ title: data.editorTitle })
                .where(eq(project.id, roomId))
                .returning()

            console.log("nowy tytuł: ", result);
            if(!result) return ws.send(JSON.stringify({ error: "Coulnd't update the title"})) 
            
            broadcastToRoom(room, { type: 'UPDATE_TITLE', editorTitle: result.editorContent });
        } catch (err) {
            console.error("Error updating title in db", err);
            return ws.send(JSON.stringify({ error: "Error updating title in db"})) 
        }
    },

    "UPDATE_CHAT": async (ws, room, uuid, data, roomId) => {
        if(!data.message) {
            return ws.send(JSON.stringify({ error: "Payload mismatch"}))
        }
        const newChatMessage = {
            msgId: uuidv4(),
            senderId: uuid,
            message: data.message,
            timestamp: new Date().toISOString(),
        }

        room.chatMessages.push(newChatMessage);

        try {
            const [result] = await db
               .update(project)
                .set({
                    chatMessages: sql`jsonb_concat(${project.chatMessages}, ${JSON.stringify([newChatMessage])}::jsonb)`
                })
                .where(eq(project.id, roomId))
                .returning()

            console.log("new message: ", result.chatMessages);
            if(!result) return ws.send(JSON.stringify({ error: "Coulnd't add an message"})) 
            
            broadcastToRoom(room, { type: "UPDATE_CHAT", newChatMessage: newChatMessage })
        } catch (err) {
            console.error("Error updating chat messages in db", err);
            return ws.send(JSON.stringify({ error: "Error updating chat messages in db"})) 
        }
    },
    
    "FULL_STATE": (ws, room, uuid, roomId) => {
        ws.send(JSON.stringify({
            type: "FULL_STATE",
            users: room.users,
            chatMessages: room.chatMessages,
            editorContent: room.editorContent,
            editorTitle: room.editorTitle

        }))
    } 

}