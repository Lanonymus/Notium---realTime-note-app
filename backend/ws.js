// ws.js
import { WebSocketServer } from 'ws';
import * as url from 'url';
import { v4 as uuidv4 } from 'uuid';



// initiating webSocket server
function initWebSocket(server) {
    const wss = new WebSocketServer({ server });

    //  pokój : 
    // roomStructure = 
    // { [roomId]: 
    //     { connections: 
    //         { uuid: ws },
    //         users: { uuid: { username, profileColor, state } },
    //         chatMessages: [], doc: '', title: '' 
    //     } 
    // }

    const rooms = {};

    const colorList = [
        "hsl(16, 100%, 63%)",
        "hsl(355, 100%, 57%)",
        "hsl(265, 88%, 53%)",
        "hsl(217, 91%, 60%)"
    ];

    const getRandomColor = (room) => {
        const assigned = Object.values(room.users || {}).map(u => u.profileColor);
        const available = colorList.filter(c => !assigned.includes(c));
        if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
        return colorList[Math.floor(Math.random() * colorList.length)];
    }

    wss.on("connection", (ws, request) => {
        // oczekujemy paremetrów z linku np
        // localhost:8000/?username=Jacob&room=ROOM_ID

        const { username, room: roomIdFromQuery } = url.parse(request.url, true).query

        // jesli nie ma roomId, to:
        // - można odmówić połączenia
        // - albo wymusić stworzenie nowego pokoju
        const roomId = roomIdFromQuery;
        if (!roomId) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'roomId required in query - as the parameter'}))
            ws.close()
            return;
        }

        // Jeśli pokój nie istenieje to tworzymy go
        if (!rooms[roomId]) {
            rooms[roomId] = {
                connections: {}, // połączenie 
                users: {},
                chatMessages: [],
                editorText: "Make something awesome",
                editorTitle: "Title of your project"
            }
        }

        const room = rooms[roomId]
        const uuid = uuidv4()
        const color = getRandomColor(room)

        // zapisujemy połączenie
        room.connections[uuid] = ws
        room.users[uuid] = {
            username: username || `Anonymous-${uuid.slice(0, 4)}`,
            state: {},
            profileColor: color
        }

        console.log(`[room:${roomId}] ${room.users[uuid].username} connected (${uuid})`);

        // Wysyłamy welcome z uuid i początkowy full state pokoju
        ws.send(JSON.stringify({
            type: "WELCOME",
            uuid,
            roomId
        }))

        // Wysyłamy w całości stan pokoju - wszystkie informacje
        ws.send(JSON.stringify({
            type: "FULL_STATE",
            users: room.users,
            editorText: room.editorText,
            editorTitle: room.editorTitle,
            chatMessages: room.chatMessages
        }))

        // pomoc: broadcast w danym pokoju
        const broadcastToRoom = (payloadObj) => {
            const payload = JSON.stringify(payloadObj);
            Object.values(room.connections).forEach(connection => {
                try { connection.send(payload)} catch (e) { console.warn('send error', e)}
            })
        }

        const handleClose = () => {
            const uname = room.users[uuid]?.username;
            console.log(`[room:${roomId}] ${uname} disconnected (${uuid})`);

            delete room.connections[uuid];
            delete room.users[uuid];

            // jeśli pokój pusty -> usun go
            if (Object.keys(room.connections).length === 0) {
                console.log(`[room:${roomId}] empty, deleting room`);
                delete rooms[roomId];
                return;
            }

            // zaktualizuj pozostałych
            broadcastToRoom({ type: 'UPDATE_USERS', users: room.users });
        }

        ws.on('message', (raw) => {
            let data
            try { data = JSON.parse(raw) } catch (e) {
                console.warn('Invalid JSON', raw);
                return 
            }

            // if (data.senderUuid === uuid) return; // 👈 ignoruj własne zmiany

            // Obsługa aktualizacji wydarzeń dla każdego pokoju
            if (data.type === 'UPDATE_CURSOR' && data.state) {
                if (room.users[uuid]) {
                    room.users[uuid].state = data.state
                    broadcastToRoom({ type: 'UPDATE_CURSOR', uuid, state: data.state})
                }
                return
            }

            if (data.type === 'UPDATE_DOC') {
                if (typeof data.editorText === 'string') {
                room.editorText = data.editorText;
                }
                broadcastToRoom({ type: 'UPDATE_DOC', editorText: room.editorText });
                return;
            }

            if (data.type === 'UPDATE_TITLE') {
                if (typeof data.editorTitle === 'string') room.editorTitle = data.editorTitle;
                broadcastToRoom({ type: 'UPDATE_TITLE', editorTitle: room.editorTitle });
                return;
            }

            if (data.type === 'UPDATE_CHAT' && data.chatMessages) {
                room.chatMessages = data.chatMessages;
                broadcastToRoom({ type: 'UPDATE_CHAT', chatMessages: room.chatMessages });
                return;
            }     

            if (data.type === 'REQUEST_FULL_STATE') {
                ws.send(JSON.stringify({
                    type: "FULL_STATE",
                    users: room.users,
                    editorText: room.editorText,
                    editorTitle: room.editorTitle,
                    chatMessages: room.chatMessages
                }));
                return;
            }

        })
        console.log(room.users);
        
        broadcastToRoom({ type: 'UPDATE_USERS', users: room.users})

        ws.on('close', () => handleClose())
        ws.on('error', (err) => {
            console.warn('ws error', err);
            handleClose()
            
        })
    
}) // end connection



//     const connections = {};
//     const users = {};
//     let chatMessages = [];
//     let editorText = "Make something awesome";
//     let editorTitle = "Title of your project";

//     let assignedUniqueColors = 0;


//     // wysyłamy informacje do wszystkich połączonych użytkowników
//     const broadcastUsers = () => {
//         const payload = JSON.stringify({
//             users
//         })

//         Object.values(connections).forEach(conn => conn.send(payload))
//     }

//     // Rozdzielamy wysyłanie danych na pojedynicze wydarzenia dla OPTYMALIZACJI
//     function broadcastCursor(uuid, state) {
//         const msg = JSON.stringify({ type: 'UPDATE_CURSOR', uuid, state})
//         Object.values(connections).forEach(c => c.send(msg))
//         // console.log('zmiana kursora');
        
//     }

//     function broadcastDoc(editorText) {
//         const msg = JSON.stringify({ type: 'UPDATE_DOC', editorText})
//         Object.values(connections).forEach(c => c.send(msg))
//         console.log('zmiana wiadomości globalnej');
//     }

//     function broadcastTitle(editorTitle) {
//         const msg = JSON.stringify({ type: 'UPDATE_TITLE', editorTitle })
//         Object.values(connections).forEach(c => c.send(msg))
//         console.log('Zmiana w tytule projektu');
        
//     }

//     function broadcastChat(newMsg) {
//         chatMessages = newMsg
//         const msg = JSON.stringify({ type: 'UPDATE_CHAT', chatMessages: newMsg})
//         Object.values(connections).forEach(c => c.send(msg))
//         console.log('zmiana wiadomości w chacie: ', newMsg);
//         console.log('Cały chat: ', chatMessages);
//     }

//     function updateUsers() {
//         const msg = JSON.stringify({ type: 'UPDATE_USERS', users: users })
//         Object.values(connections).forEach(c => c.send(msg))
//         console.log('wysłano liste użytników: ', users);
        
//     }





//     const handleClose = uuid => {

//         console.log(`${users[uuid].username} disconnected`);
//         delete connections[uuid]
//         delete users[uuid]

//         broadcastUsers() // update z usuniętymi użytkownikami
//     }

//     const getRandomColor = () => {
//         // Jeśli jeszcze nie wykorzystaliśmy wszystkich unikalnych kolorów
//         if (assignedUniqueColors < 3) {
//             const availableColors = colorList.filter(c => !Object.values(users).some(u => u.profileColor === c));
//             const color = availableColors[Math.floor(Math.random() * availableColors.length)];
//             assignedUniqueColors++
//             return color
//         }

//         // Potem kolory mogą się powtarzać
//         return colorList[Math.floor(Math.random() * colorList.length)]
//     }

//     wss.on("connection", (connection, request) => {

//         // ws://localhost:8000?username=Jacob

//         // Pozyskujemy imię z linku w wyszukiwarce
//         // Możemy sprawdzić czy server działa za pomocą np.
//         // postmana który jest stroną oferującą hostowanie webSocketa
//         const { username } = url.parse(request.url, true).query
//         const uuid = uuidv4()
//         const color = getRandomColor()

//         console.log(username);
//         console.log(uuid);


//         // Dla każdego połączenia mamy odzielny identyfikator
//         connections[uuid] = connection

//         // Dla każdego identyfikatora mamy obiekt 
//         // nazwą użytkownika i aktualną pozycją myszki
//         users[uuid] = {
//             username: username,
//             state: { },
//             profileColor: color
//         }

//         // Wysyłanie unikalnego uuid - identyfikatora do użytkownika
//         connection.send(JSON.stringify({
//             type: "welcome",
//             uuid: uuid
//         }))

//         // 2) Pełny stan dokumentu, użytkowników i czatu na samym początku dla wczytania danych
//         connection.send(JSON.stringify({
//             type: "FULL_STATE",
//             users,
//             editorText,
//             editorTitle,
//             chatMessages
//         }));

//         updateUsers()


//         // wydarzenie on message będzie się działo za kazdym 
//         // ruchem myszką z danymi x i y o pozycji
//         connection.on("message", raw => {
//             let data;

//             // Transforming to JSON format
//             try {
//                 data = JSON.parse(raw)
//             } catch (e) {
//                 console.warn("Niepoprawny JSON: ", raw)
//                 return
//             }

//             // 1. Aktualizacja pozycji kursora
//             if (data.type === 'UPDATE_CURSOR' && data.state) {
//                 users[uuid].state = data.state
//                 broadcastCursor(uuid, data.state)
//                 return
//             }

//             // 2. Aktualizacja globalnej wiadomości lub tytułu projektu
//             if (data.type === 'UPDATE_DOC') {
//                 if (typeof data.editorText === 'string') editorText = data.editorText
//                 broadcastDoc(editorText, editorTitle)
//                 return
//             }

//             // 4. Aktualizowanie tytułu projektu
//             if (data.type === 'UPDATE_TITLE') {
//                 if (typeof data.editorTitle === 'string') editorTitle = data.editorTitle
//                 broadcastTitle(editorTitle)
//                 return
//             }

//             // 5. Aktualizacja wiadomości chatu
//             if (data.type === 'UPDATE_CHAT' && data.chatMessages) { 
//                 // chatMessages.push(data.chatMessages)
//                 broadcastChat(data.chatMessages)
//                 return
//             }

//             // 6. Aktualizacja widocznych użytkowników
//             if (data.type === 'UPDATE_USERS') {
//                 console.log('Aktualizacja użytkowników');
                
//                 updateUsers()
//                 return
//             }

//             // handleMessage(message, uuid)
//         })
//         // Wyłączenie strony
//         connection.on("close", () => handleClose(uuid))
// })

} // end initWebSocket


export default initWebSocket
