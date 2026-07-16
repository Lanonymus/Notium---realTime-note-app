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
    const uuidRef = useRef<string>("")

    useEffect(() => {
        if(!editor || !roomId || !token) return
        const wsUrl = `ws://localhost:8000/ws?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
        console.log('WebSocket connection opened')
        socketRef.current = ws;
        };

        ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data)

            if(data.uuid === uuidRef.current) {
                // WAŻNE: Zrób dokładnie to samo zabezpieczenie dla FULL_STATE, 
                // ponieważ jeśli serwer to wyśle bez uuid, ominie pierwszy if() na górze!
                if(data.type === "FULL_STATE" && data.editorContent) {
                    const currentContent = editor.getJSON();
                    if (JSON.stringify(currentContent) === JSON.stringify(data.editorContent)) {
                        return; 
                    }
                    
                    const contentToLoad = Object.keys(data.editorContent).length > 0 ? data.editorContent : "";
                    editor.chain()
                        .command(({ tr }) => {
                            tr.setMeta("addToHistory", false);
                            return true;
                        })
                        .setContent(contentToLoad, { emitUpdate: false })
                        .run();
                    console.log("FULL_STATE received and content updated from server");
                }
                // console.log("nie potrzeba zmiany ty jesteś autorem");
                return
            }

            if(data.type === "UPDATE_CURSOR" && data.state) {
            console.log("ktoś zmienił selekcje");
            
            const { from, to, name, color } = data.state
            
            setRemoteCursors(prev => ({
                ...prev,
                [data.uuid]: {
                from,
                to,
                name,
                color
                }
            }))          
            }
            if(data.type === "WELCOME" && data.uuid) {
                uuidRef.current = data.uuid
                console.log("welcome from server: ", uuidRef.current);
            }


            if(data.type === "UPDATE_DOC" && data.editorContent) {
                // 1. SZYBKIE SPRAWDZENIE: Zanim wywołamy destrukcyjne setContent, 
                // sprawdźmy czy treść z serwera różni się od naszej.
                const currentContent = editor.getJSON();
                if (JSON.stringify(currentContent) === JSON.stringify(data.editorContent)) {
                    console.log("🛡️ Zatrzymano zbędny setContent (treść jest identyczna)");
                    return; 
                }

                const { from, to } = editor.state.selection;
                const contentToLoad = Object.keys(data.editorContent).length > 0 ? data.editorContent : "";

                editor.chain()
                    .command(({ tr }) => {
                        tr.setMeta("addToHistory", false);
                        return true;
                    })
                    .setContent(contentToLoad, { emitUpdate: false })
                    .setTextSelection({ from, to })
                    .run();
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

    return { sendPayLoad, uuidRef }
}