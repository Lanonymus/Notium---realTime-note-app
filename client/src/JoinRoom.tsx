import { useState } from "react"
import TipTapEditor from "./TiptapEditor"

export default function JoinRoom() {
    const [roomId, setRoomId] = useState<number | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isJoined, setIsJoined] = useState<boolean>(false)

    const JoinRoom = () => {
        if( roomId && token) {
            setIsJoined(true)
        }
        else {
            alert("Podaj room Id i token")
        }
    }

    if(isJoined) {
        return <TipTapEditor roomId={roomId} token={token}/>;
    }

    return (
        <>
            <div className="bg-white w-screen h-screen flex justify-center items-center">
                <div className="flex flex-col justify-center items-center gap-5">
                    <div className="py-[1px] px-[3px] rounded-[5px] w-fit h-[50px] flex gap-1 border-1 bg-gray-50 border-gray-200 justify-center items-center">
                        <input onChange={(e) => setRoomId(Number(e.target.value))} type="text" className="w-fit h-max hover:bg-gray-200 rounded-[4px] p-2 text-center" placeholder="Enter Room id"></input> 
                        <input onChange={(e) => setToken(e.target.value)} type="text" className="w-fit h-max hover:bg-gray-200 rounded-[4px] p-2 text-center" placeholder="Enter JWT Token"></input>    
                    </div>  
                    <div className="p-[1px] border-gray-200  border-2 rounded-[5px]">
                        <button onClick={JoinRoom} className="bg-blue-500 hover:bg-blue-400 cursor-pointer transition-all duration-150 rounded-[4px] text-white px-5 py-2">Join</button>  
                    </div>
                </div>
            </div>    
        </>
    )
}