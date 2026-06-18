import type { Room } from "./ws.js"

export const getRandomColor = (colorList: string[], room: Room) => {
    const assigned = Object.values(room.users || {}).map(u => u.profileColor);
    const available = colorList.filter(c => !assigned.includes(c));
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    return colorList[Math.floor(Math.random() * colorList.length)];
}

export const broadcastToRoom = (room: Room, payloadObj: any) => {
    const payLoadStr = JSON.stringify(payloadObj);

    Object.values(room.connections).forEach((websocket) => {
        if(websocket.readyState === WebSocket.OPEN) {
            try {
                websocket.send(payLoadStr)
            } catch (error) {
                console.error("Problem with broadcasting message", error)
            }
        }
    })
}

// pomoc: broadcast w danym pokoju

export const parseMessage = (raw: any): any | null => {
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error("Problem with parsing message", error)
    }
}