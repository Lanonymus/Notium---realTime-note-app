// ws.js
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Server } from "http"
import { colorList } from "./colorList.js"
import { broadcastToRoom, getRandomColor } from './helperFunctions.js';
import { eventHandlers } from './eventHandler.js';
import jwt, { decode } from "jsonwebtoken"
import dotenv from "dotenv"
import { db } from '../db/db.js';
import { projects } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { wsArcjet } from '../arcjet.js';
import http from "http"
import { parseCookie } from "cookie"

dotenv.config()


interface AuthenticatedWebsocket extends WebSocket {
    userId: string
}

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
const handleDisconnect = async (roomID: string, uuid: string) => {
    const room = rooms[roomID]

    if(!room) return

    if(room.users[uuid]){
        delete room.users[uuid]
    }

    if(room.connections[uuid]) {
        delete room.connections[uuid]
    }

    if(Object.keys(room.connections).length === 0) {
        console.log(`Room ${roomID} is empty. Deleting room from memory`)

        // Zapisywanie zmian gdy wszyscy użytkownicy wyjdą
        const roomEditorContent = room.editorContent
        try {
            const [result] = await db
               .update(projects)
                .set({ editorContent: roomEditorContent })
                .where(eq(projects.id, roomID))
                .returning()

            console.log("zaktualizowana zawartość: ", result);
            if(!result) return console.error("Error while saving doc roomId: ", roomID)
            
        } catch (err) {
            return console.error("Error while saving document content", err);             
        }
        // TODO: Zapisywanie zmian w bazie NEON 
        delete rooms[roomID]
        return
    }

    broadcastToRoom(room, { type: "UPDATE_USERS", users: room.users });

}




// initiating webSocket server
function initWebSocket(server: Server) {
    // Max 10 MB przesyłki
    const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 * 10});

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

    wss.on("connection", async (ws: AuthenticatedWebsocket, req: any) => {
        const urlSearchParams = new URLSearchParams(req.url.split("?")[1])
        const roomID = urlSearchParams.get("room") as string
        


        if (!roomID) {
            ws.send(JSON.stringify({
                message: "Wrong roomId parameter",
                type: "ERROR",
                success: false
            }));
            ws.close();
            return; // WAŻNE: Musisz dodać return, żeby funkcja nie poszła dalej!
        }

        let username: string;
        try {

            const rawCookieHeader = req.headers.cookie

            if(!rawCookieHeader) {
                throw new Error("Brak nagłówka Cookie w zapytaniu")
            }
            // surowy tekst na token
            const cookies = parseCookie(rawCookieHeader)
            const token = cookies.token

            if(!token) {
                throw new Error("Brak ciasteczka token")
            }

            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, username: string};
            ws.userId = decoded.userId
            username = decoded.username

            console.log(`[WS] Połączono i zautoryzowano użytkownika: ${ws.userId}`);


        } catch (error) {
            console.error(`[WS] Odmowa połączenia: ${error}`);
                
            // Jeśli token jest zły/wygasł lub brakuje ciasteczka, zamykamy gniazdo.
            // Kod 4001 lub 1008 oznacza błąd autoryzacji / naruszenie polityki.
            ws.close(4001, "Unauthorized");
            return;
        }

        // Weryfikacja w bazie danych - Neon
        try {
            const [dbProject] = await db
                .select()
                .from(projects)
                .where(eq(projects.id, roomID))
        
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

            if(!rooms[roomID]) {
                rooms[roomID] = {
                    connections: {},
                    users: {},
                    chatMessages: [],
                    editorContent: dbProject.editorContent || {},
                    editorTitle: dbProject.title || ""                    
                }
            }

            const room = rooms[roomID]
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
            ws.send(JSON.stringify({ type: "WELCOME", uuid: uuid }));
            ws.send(JSON.stringify({
                type: "FULL_STATE",
                users: room.users,
                editorContent: room.editorContent,
                editorTitle: room.editorTitle,
                chatMessages: room.chatMessages,
                uuid: uuid,
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
                        handler(ws, room, uuid, data, roomID)
                    } else {
                        console.warn(`Unknown event type: ${data.type}`)
                    }

                } catch (error) {
                    console.error("Error parsing message: ", error)
                }
            })

            // Obsługa rozłączeń
            ws.on("close", () => handleDisconnect(roomID, uuid))
            ws.on("error", (error) => {
                console.error("WebSocket error: ", error)
                handleDisconnect(roomID, uuid)
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
    for(const roomID of activeRoomIds) {
        const room = rooms[roomID]

        if(room && room.isDirty) {

            // Robimy snapshot co 30 sekund, który chcemy zapisać
            const contentToSave = room.editorContent
            const projectTitle = room.editorTitle
            console.log("title: ", projectTitle);
            
            room.isDirty = false            
            
            try {
                await db
                .update(projects)
                .set({
                    title: projectTitle ? projectTitle : "",
                    editorContent: contentToSave,
                    updatedAt: new Date()
                })
                .where(eq(projects.id, roomID))
                .returning()

                console.log(`💾 [Auto-Save] Pokój ID: ${roomID} pomyślnie zrzucony do bazy supabase.`);
            } catch (error) {
                room.isDirty = true
                console.error(`❌ [Auto-Save] Błąd zapisu pokoju ID: ${roomID}:`, error);
            }
        }
    }
     
}, 5_000)


export default initWebSocket
