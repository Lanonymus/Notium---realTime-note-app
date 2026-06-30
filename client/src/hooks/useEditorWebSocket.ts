import { Editor } from "@tiptap/core";
import { useEffect, useRef } from "react";


type EditorWebSocketProps = {
    editor: Editor,
    roomId: number | null,
    token: string | null,
    setRemoteCursors: React.Dispatch<React.SetStateAction<Record<string, any>>>
}

export function useEditorWebSocket({ editor, roomId, token, setRemoteCursors}: EditorWebSocketProps) {
    const socketRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        if(!editor || !roomId || !token) return

        if(!roomId || !token) return
        const wsUrl = `ws://localhost:8000/ws?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
        console.log('WebSocket connection opened')
        socketRef.current = ws;
        };

        ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data)

            if(data.token === token) {
            // console.log("nie potrzeba zmiany ty jesteś autorem");
            return
            }
            if(data.type === "UPDATE_CURSOR" && data.state) {
            console.log("ktoś zmienił selekcje");
            
            const { from, to, name, color } = data.state
            
            setRemoteCursors(prev => ({
                ...prev,
                [data.token]: {
                from,
                to,
                name,
                color
                }
            }))          
            }

            if(data.type === "FULL_STATE" && data.editorContent) {
            const contentToload = Object.keys(data.editorContent).length > 0 ? data.editorContent : ""
            // pass options object to match SetContentOptions type (avoid boolean arg)
            editor.commands.setContent(contentToload, { emitUpdate: false})
            }

            if(data.type === "UPDATE_DOC" && data.editorContent) {
            const { from, to} = editor.state.selection

            const contentToLoad = Object.keys(data.editorContent).length > 0 ? data.editorContent : ""
            editor.commands.setContent(contentToLoad, { emitUpdate: false})
            editor.commands.setTextSelection({ from, to})
            }
        } catch (err) {
            console.error('Error parsing WebSocket message:', err)
        }
        }

        ws.onclose = () => {
        console.log('WebSocket connection closed')
        };

        ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        };

        return () => {
        ws.close()
        }
    }, [editor, roomId, token])


    const sendPayLoad = (payload: object) => {
        if(socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(payload))
        }
    } 

    return { sendPayLoad }
}