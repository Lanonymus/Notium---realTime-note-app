import { useNavigate } from "react-router-dom";

export default function NavBar() {
    const navigate = useNavigate();
    

    return (
    <div className="fixed w-[1200px] top-0 left-[50%] translate-x-[-50%] h-[7vh]  mt-2 overflow-hidden shadow rounded
        outline-1 outline-gray-200 z-999">

        <div className="absolute w-[100%] h-[100%] bg-white/50 backdrop-blur-[10px] z-1"></div>
        <div className="absolute w-[100%] h-[100%] z-2 flex items-center justify-between pl-5 pr-5">

            <div className="flex justify-center items-center gap-[4px]">
                <div className="rounded-[7px] overflow-hidden ">
                    <img src="./RTE_logo_10.png" className="h-[45px] transform  w-auto" alt="" />
                </div>
                <span className="text-[20px]  font-Roboto text-black ">Notium</span>
            </div>

            <div className="flex gap-[8px] justify-center items-center">
                <div className="group p-[2px] rounded-[12px] cursor-pointer hover:outline-gray-400 duration-100 outline-gray-300 outline-1 flex justify-center items-center">
                    <div onClick={() => {
                        navigate("/register")
                        
                    }}  className="text-[17px] text-white font-Roboto px-5 py-2 outline-1
                outline-gray-200 rounded-[12px] bg-gray-800 group-hover:bg-gray-700 duration-100">Sing in</div>
                </div>

                <div className="h-[50px] w-[1px] bg-gray-200"></div>

                <div className="text-[15px] text-gray-600 cursor-pointer font-Roboto px-5 py-2 outline-1 outline-gray-300 rounded-[12px] duration-100 hover:bg-gray-50
                 hover:outline-gray-400" 
                    onClick={() => {
                        navigate("/login")
                    }}
                 >Login in</div>
            </div>
        </div>
    </div>
    )
}