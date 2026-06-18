import type { Room } from "./ws.js"
import { broadcastToRoom } from "./helperFunctions.js"
import { WebSocket } from "ws"

// --- STRATEGIA OBSŁUGI WIADOMOŚCI WZGLĘDEM FLAGI ---
type eventHandler = (ws: WebSocket, room: Room, uuid: string, data: any) => void

export const eventHandlers: Record<string, eventHandler> = {
    "UPDATE_CURSOR": (ws, room, uuid, data) => {
        if(!data.state || !room.users[uuid]) return
        room.users[uuid].state = data.state
        broadcastToRoom(room, { type: "UPDATE_CURSOR", uuid: uuid, state: data.state })
    },

    "UPDATE_DOC": (ws, room, uuid, data) => {
        if(!data.editorContent) return
        // Zapisujemy całe drzewo / content Slate'a w pamięci serwera
        room.editorContent = data.editorContent
        broadcastToRoom(room, { type: "UPDATE_DOC", editorContent: data.editorContent})
    },

    "UPDATE_TITLE": (ws, room, uuid, data) => {
        if (!data.editorTitle) return;
        room.editorTitle = data.editorTitle;
        broadcastToRoom(room, { type: 'UPDATE_TITLE', editorTitle: room.editorTitle });
    },

    "UPDATE_CHAT": (ws, room, uuid, data) => {
        if(!data.chatMessages) return
        room.chatMessages = data.chatMessages
        broadcastToRoom(room, { type: "UPDATE_CHAT", chatMessages: data.chatMessages })
    },
    
    "FULL_STATE": (ws, room, uuid) => {
        ws.send(JSON.stringify({
            type: "FULL_STATE",
            users: room.users,
            chatMessages: room.chatMessages,
            editorContent: room.editorContent,
            editorTitle: room.editorTitle

        }))
    } 

}