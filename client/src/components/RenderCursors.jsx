import { useCallback, useEffect } from "react"
import { Cursor } from "./Cursor"

const renderCursors = (users, currentUuid) => {
    return Object.keys(users).map(uuid => {
        const user = users[uuid]
        const profileColor = user.profileColor

        if(currentUuid === uuid) return

        return (
            <Cursor key={uuid} point={[user.state.x, user.state.y]} name={user.username}  color={profileColor}/>
        )
    })
}

export default function RenderCursors({ 
    users, 
    setUsers, 
    uuid, 
    sendJsonMessageThrottled, 
    isReady, 
    lastJsonMessage = null 
}) {





    useEffect(() => {
        if(!lastJsonMessage) return
        const { type } = lastJsonMessage

        switch(type) {
            case 'UPDATE_CURSOR':
            setUsers(prev => {
                // jeżeli to nie istnieje w prev —  znaczy, że nie mamy jeszcze FULL_STATE
                if (!prev[lastJsonMessage.uuid]) return prev;
                return {
                ...prev,
                [lastJsonMessage.uuid]: {
                    ...prev[lastJsonMessage.uuid],
                    state: lastJsonMessage.state
                }
                };
            });
            break;
        }
    }, [lastJsonMessage])



    // Funkcje do WYSYŁANIA danych na serwer
    // Aktualizowanie kursora
    const sendCursorUpdate = useCallback(({ x, y}) => {
        sendJsonMessageThrottled.current({
            type: 'UPDATE_CURSOR',
            state: { x, y}
        });
    }, [sendJsonMessageThrottled])



    // Przez pustego arraya jako parametr tworzymy tego listenera raz na początku
    // TODO: Zoptymalizować przesuwanie myszką
    useEffect(() => {
        if (!isReady) return

        sendCursorUpdate({ x: 0, y: 0})

        const handler = e => sendCursorUpdate({ x: e.clientX, y: e.clientY})
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)

    }, [sendCursorUpdate, isReady])


    return (
        <>
            {renderCursors(users, uuid)}
        </>
    )

}