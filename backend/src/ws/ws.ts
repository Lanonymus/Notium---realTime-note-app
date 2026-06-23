// ws.js
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Server } from "http"
import { colorList } from "./colorList.js"
import { broadcastToRoom, getRandomColor } from './helperFunctions.js';
import { eventHandlers } from './eventHandler.js';
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { db } from '../db/db.js';
import { project } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { wsArcjet } from '../arcjet.js';
import http from "http"

dotenv.config()


export type Room = {
    connections: Record<string, WebSocket>, // gniazda - sockety
    users: Record<string, any>,    // uuid: dane_użytkownika
    chatMessages: any[],        
    editorContent: Record<string, any>,
    editorTitle: string,
    isDirty?: boolean,
}

const rooms: Record<string, Room> = {};
const JWT_SECRET = process.env.JWT_SECRET || "secret"; // w praktyce wrzucasz w .env


// Czyszczenie pokoji i użytkowników
const handleDisconnect = async (roomId: string, uuid: string) => {
    const room = rooms[roomId]

    if(!room) return

    if(room.users[uuid]){
        delete room.users[uuid]
    }

    if(room.connections[uuid]) {
        delete room.connections[uuid]
    }

    if(Object.keys(room.connections).length === 0) {
        console.log(`Room ${roomId} is empty. Deleting room from memory`)

        // Zapisywanie zmian gdy wszyscy użytkownicy wyjdą
        const roomEditorContent = room.editorContent
        try {
            const [result] = await db
               .update(project)
                .set({ editorContent: roomEditorContent })
                .where(eq(project.id, Number(roomId)))
                .returning()

            console.log("zaktualizowana zawartość: ", result);
            if(!result) return console.error("Error while saving doc roomId: ", roomId)
            
        } catch (err) {
            return console.error("Error while saving document content", err);             
        }
        // TODO: Zapisywanie zmian w bazie NEON 
        delete rooms[roomId]
        return
    }

    broadcastToRoom(room, { type: "UPDATE_USERS", users: room.users });

}




// initiating webSocket server
function initWebSocket(server: Server) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 * 5});

    server.on("upgrade", async (req, socket, head) => {
        console.log(req.headers.upgrade);
        
        if(req.headers.upgrade?.toLowerCase() !== "websocket"){
            console.error("Invalid upgrade request")
            socket.destroy()
            return;
        }

        if(wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req)
                if(decision.isDenied()) {
                    const isRateLimit = decision.reason.isRateLimit()
                    const statusCode = isRateLimit ? 429 : 403
                    const statusMessage = isRateLimit ? "Too many requests" : "Forbidden"

                    // Tworzymy obiekt odpowiedzi
                    const res = new http.ServerResponse(req)
                    res.assignSocket(socket as any)

                    // Czysty kod wiadomości zwrotnej
                    res.writeHead(statusCode, {
                        "Content-Type": "text/plain",
                        "Connection": "close"
                    })

                    res.end(statusMessage)
                    return

                }
            } catch (error) {
                console.error("Error during WebSocket request protection:", error)
                socket.destroy()
                return;
            }

        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req)
        })


    })

    wss.on("connection", async (ws: WebSocket, req: any) => {
        const urlSearchParams = new URLSearchParams(req.url.split("?")[1])
        const token = urlSearchParams.get("token") as string
        const roomIdString = urlSearchParams.get("room") as string
        const roomIdNumber = Number(roomIdString)
        


        if (!roomIdNumber || isNaN(roomIdNumber)) {
            ws.send(JSON.stringify({
                message: "Wrong roomId parameter",
                type: "ERROR",
                success: false
            }));
            ws.close();
            return; // WAŻNE: Musisz dodać return, żeby funkcja nie poszła dalej!
        }

        let userId: number;
        let username: string;
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (!decoded) throw new Error("Invalid token");
            userId = decoded.userId; // Upewnij się, że w tokenie zapisujesz userId (nie id)
            username = decoded.username; // Pobieramy imię z tokenu!

        } catch (error) {
            console.error("Coulnd't process token")
            ws.close()
            return
        }

        // Weryfikacja w bazie danych - Neon
        try {
            const [dbProject] = await db
                .select()
                .from(project)
                .where(eq(project.id, roomIdNumber))
        
            // Jeśli projektu nie ma w bazie danych -> ODRZUCAMY POŁĄCZENIE
            if (!dbProject) {
                ws.send(JSON.stringify({ message: 'Taki projekt nie istnieje w bazie danych!', type: 'ERROR', success: false }));
                ws.close();
                return;
            }

            // TODO:
            // // Opcjonalnie (Zabezpieczenie 403 Forbidden): Czy ten projekt należy do zalogowanego użytkownika?
            // // W przyszłości, jeśli wprowadzisz udostępnianie, sprawdzisz tu tabelę uprawnień.
            // if (dbProject.userId !== decodedId) {
            //     ws.send(JSON.stringify({ type: 'ERROR', message: 'Brak uprawnień do tego projektu!' }));
            //     ws.close();
            //     return;
            // }

            if(!rooms[roomIdString]) {
                rooms[roomIdString] = {
                    connections: {},
                    users: {},
                    chatMessages: [],
                    editorContent: dbProject.editorContent || {},
                    editorTitle: dbProject.title || "New Project"                    
                }
            }

            const room = rooms[roomIdString]
            const uuid = uuidv4();
            const color = getRandomColor(colorList, room);

            // Zapis danych do pokoju / jeżeli ziomeczek jest nowy, to dodajemy go do listy połączeń i użytkowników.
            room.connections[uuid] = ws;
            room.users[uuid] = {
                username: username,
                color: color,
                state: {}
            }

            // D. Wysłanie stanu początkowego (WELCOME + FULL_STATE) do klienta
            ws.send(JSON.stringify({ type: "WELCOME", uuid }));
            ws.send(JSON.stringify({
                type: "FULL_STATE",
                users: room.users,
                editorContent: room.editorContent,
                editorTitle: room.editorTitle,
                chatMessages: room.chatMessages
            }));

            // Broadcast do innych, że ktoś nowy wbił
            broadcastToRoom(room, { type: 'UPDATE_USERS', users: room.users });

            // Nasłuchiwanie na wydarzenia
            ws.on("message", (rawData) => {
                try {
                    const data = JSON.parse(rawData.toString())
                    if(!data.type) return

                    const handler = eventHandlers[data.type]
                    if (handler) {
                        handler(ws, room, uuid, data, roomIdNumber)
                    } else {
                        console.warn(`Unknown event type: ${data.type}`)
                    }

                } catch (error) {
                    console.error("Error parsing message: ", error)
                }
            })

            // Obsługa rozłączeń
            ws.on("close", () => handleDisconnect(roomIdString, uuid))
            ws.on("error", (error) => {
                console.error("WebSocket error: ", error)
                handleDisconnect(roomIdString, uuid)
            })

        } catch (error) {
            console.error("Error while joining a room: ", error)
            ws.close()
        }
       
})
} 


setInterval(async () => {
    const activeRoomIds = Object.keys(rooms)
    if(activeRoomIds.length === 0) return

    // Jeżeli są aktywne pokoje
    for(const roomId of activeRoomIds) {
        const room = rooms[roomId]

        if(room && room.isDirty) {
            try {
                await db
                .update(project)
                .set({ editorContent: room.editorContent})
                .where(eq(project.id, Number(roomId)))
                .returning()

                room.isDirty = false
                console.log(`💾 [Auto-Save] Pokój ID: ${roomId} pomyślnie zrzucony do bazy Neon.`);
            } catch (error) {
                console.error(`❌ [Auto-Save] Błąd zapisu pokoju ID: ${roomId}:`, error);
            }
        }
    }
     
}, 30_000)


export default initWebSocket
