import { useState } from "react";
import BackgroundDots from "../BackgroundDots";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onSubmit }) {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberPassword, setRememberPassword] = useState(false)
    const [invalidEmail, setInvalidEmail] = useState(false)
    const [invalidPassword, setInvalidPassword] = useState(false)


    const handleLogin = async () => {
        try {
        const res = await fetch("http://localhost:8000/api/login", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (data.success) {
            console.log("Użytkownik zalogowany:", data.token);
            localStorage.setItem('token', data.token)
            navigate("/dashboard"); // przerzucenie po rejestracji
        } else {
            console.error("Błąd rejestracji:", data.message);
            if(data.flag == "invalidEmail") {
                setInvalidEmail(true)
            }
            if(data.flag == 'invalidPassword') {
                setInvalidPassword(true)
            }

        }
        } catch (err) {
        console.error("Błąd sieci:", err);
        }
    };

    return (
        <>
            <div className="w-full h-[100vh] flex justify-center items-center ">
                <BackgroundDots/>
                <div className="w-[400px] h-auto px-5 py-5 flex flex-col bg-white rounded-[6px]
                 shadow-xl shadow-gray-300 outline-1 outline-gray-200 z-10 ">
                    <div className="flex items-center gap-[4px]">
                        <div className="rounded-[7px] overflow-hidden">
                            <img src="./RTE_logo_10.png" className="h-[45px] cursor-pointer transform  w-auto" alt="" onClick={() => {
                                navigate("/")
                            }}/>
                        </div>
                        <span className="text-[20px]  font-Manrope font-semibold text-gray-700 ">Notium</span>
                    </div>  
                    <div className="mt-6 font-Manrope text-2xl font-bold text-gray-700">Login in to Notium</div>
                    <div className="mt-1 font-Manrope text-[15px]  text-gray-500">Your every day project manager.</div>

                    <label className="mt-8 font-Manrope text-[15px]  text-gray-800" htmlFor="Email">Email address*</label>
                    <input 
                        className={`focus:outline-gray-400 focus:outline-1 py-[10px] rounded-[3px]
                        bg-gray-100 mt-1 border-1 font-Manrope pl-3 w-full text-[14px] ${invalidEmail ? "border-red-700" : "border-gray-300"}`}
                        type="email" 
                        placeholder="Enter your email"
                        id="Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setInvalidEmail(false)
                        }}
                    />

                    {invalidEmail && <div className="py-1 text-[12px] text-red-700 gap-1 flex justify-start items-center">
                        <div className="w-[4px] h-[4px] rounded-[50%] bg-red-700"></div>
                        Email doesn't exists.</div>}

                    <label className="mt-4 font-Manrope text-[15px]  text-gray-800" htmlFor="Password">Password*</label>
                    <input 
                        className={`focus:outline-gray-400 focus:outline-1 py-[10px] rounded-[3px]
                        bg-gray-100 mt-1 border-1 font-Manrope pl-3 w-full text-[14px] ${invalidPassword ? "border-red-700" : "border-gray-300"}`}
                        type="password" 
                        placeholder="Enter your password"
                        id="Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setInvalidPassword(false)
                        }}
                    />

                    {invalidPassword && <div className="py-1 text-[12px] text-red-700 gap-1 flex justify-start items-center">
                        <div className="w-[4px] h-[4px] rounded-[50%] bg-red-700"></div>
                        incorrect password.</div>}

                    <div className="flex justify-between items-center mt-3 px-[1px]">
                        <div className="flex gap-2 font-Manrope text-[14px] text-gray-700">
                            <input type="checkbox" id="Remember" />
                            <label htmlFor="Remember">Remember me</label>
                        </div>
                        <div className="font-Manrope text-[14px] font-semibold text-indigo-500">Forgot Password?</div>
                    </div>

                    <div
                        onClick={handleLogin} 
                        className="mt-5 w-full rounded-[6px] shadow-xl shadow-gray-200
                            py-[11px] text-[17px]
                            bg-gradient-to-tr text-white font-Manrope from-indigo-600
                            to-indigo-400 text-center hover:to-indigo-500 duration-150 transition-colors cursor-pointer">
                        Let's go
                    </div>

                    <div className="mt-4 flex items-center">
                        <div className="w-full h-[1px] bg-gray-300"></div>
                        <div className="px-3 font-Manrope text-gray-700 text-[14px]">or</div>
                        <div className="w-full h-[1px] bg-gray-300"></div>
                    </div>

                    <div className=" mt-3 flex gap-3 w-full">
                        <div className="w-[50%] py-[10px] outline-1 outline-gray-200 rounded-[6px] flex text-[13px] 
                        justify-center items-center text-gray-800 font-Inter gap-1 cursor-pointer
                        hover:shadow-gray-100 hover:outline-gray-300 hover:bg-gray-100 duration-75 shadow-xl shadow-gray-50">
                            <img src="./Icons/GoogleIcon.png" className="w-[25px] h-auto" alt="" />
                            Continue with Google
                            </div>
                        <div className="px-1 w-[50%] py-[10px] outline-1 outline-gray-200 rounded-[6px] flex text-[14px] 
                        justify-center items-center gap-2 text-gray-800 font-Inter cursor-pointer
                        hover:shadow-gray-100 hover:outline-gray-300 hover:bg-gray-100 duration-75 shadow-xl shadow-gray-50">
                            <img src="./Icons/XIcon.png" className="w-[20px] h-auto" alt="" />
                            Continue with X
                            </div>
                    </div>
                </div>
            </div>
        </>
    )
}