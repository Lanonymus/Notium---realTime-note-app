import { useState } from "react"
import { useNavigate } from "react-router-dom"

const JoinRoom = () => {
    const [projectID, setRoomId] = useState<string | null>("be982297-b59f-449a-a232-cc0d545ed416")
    const navigate = useNavigate()
    // TODO: dodać logike rejestracji
    
    const handleRegister = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/register", {
                method: "POST",
                credentials: "include", // Kluczowe do przekazania i odbioru ciasteczek!
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                username: "test_username2226723",
                email: "test_email1@gmail.com",
                password: "test_password",
                }),
            });

            if (!response.ok) {
                throw new Error("Problem podczas rejestracji");
            }

            console.log("Pomyślnie zarejestrowano");
            } catch (error) {
                console.error("Błąd rejestracji:", error);
            }
        };

    const handleJoinRoom = () => {
        if (projectID) {
            navigate(`/project/${projectID}`);
        } else {
            alert("Podaj room Id");
        }
    };


    return (
        <div className="bg-white w-screen h-screen flex justify-center items-center">
            <div className="flex flex-col justify-center items-center gap-5">
                <div className="py-[1px] px-[3px] rounded-[5px] w-fit h-[50px] flex gap-1 border-1 bg-gray-50 border-gray-200 justify-center items-center">
                    <input
                        onChange={(e) => setRoomId(e.target.value)}
                        value={projectID ?? ""}
                        type="text"
                        className="w-fit h-max hover:bg-gray-200 rounded-[4px] p-2 text-center"
                        placeholder="Enter Room id"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRegister}
                        className="bg-green-500 hover:bg-green-400 cursor-pointer text-white px-5 py-2 rounded-[4px]"
                    >
                        Zarejestruj
                    </button>
                    <button
                        onClick={handleJoinRoom}
                        className="bg-blue-500 hover:bg-blue-400 cursor-pointer transition-all duration-150 rounded-[4px] text-white px-5 py-2"
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
}

export default JoinRoom;