import { HugeiconsIcon } from '@hugeicons/react';
import { TextFontIcon  } from '@hugeicons/core-free-icons';
import { Relieved02Icon  } from '@hugeicons/core-free-icons';

import BenefitBlock from './BenefitBlock';
import { useState } from 'react';


export default function EndingSlide() {

    const [email, setEmail] = useState(null)

    return (
    <div className="min-h-[30vh] -mt-[1px] p-3 border-t border-b border-dashed border-gray-300 relative">
        <div className="p-3 bg-white w-full h-full outline-1 outline-gray-300 rounded-[3px] flex">
        
            <div className="w-[45%] h-full justify-between pt-2 px-5 flex flex-col">

                {/* Górna część - tekst wyśrodkowany */}
                {/* Górna część - tekst wyśrodkowany */}
                <div className='flex flex-col justify-center  flex-grow'>
                    <div className='flex gap-3'>
                        <span className="text-2xl text-gray-800">
                            Stop waiting and
                        </span>
                        <span className="relative inline-block text-1xl px-3 py-1 text-blue-500  font-normal w-fit">
                            Join
                            <span className="absolute -top-0 -left-0 w-[10px] h-[10px] border-t-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -top-0 -right-0 w-[10px] h-[10px] border-t-1 border-r-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -left-0 w-[10px] h-[10px] border-b-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -right-0 w-[10px] h-[10px] border-b-1 border-r-1 border-blue-500"></span>
                        </span>
                    </div>

                    <div className=" mt-1 text-gray-600 text-[16px] font-light">
                        This website was built by me you can check my 
                        <span className='text-blue-500 px-1 font-normal'>
                            <a href="https://jacob-gacek.vercel.app/" target='_blank'>portfolio</a>
                        </span> 
                        and is 100% free 
                        and will be forever free and all data is stored safely
                    </div>

                    <footer className="w-full mt-3 border-t border-gray-200 bg-white py-2">
                    <div className="flex items-center justify-between font-light text-gray-500 text-[13px]">
                        <div className="flex gap-4 mt-1 ">
                        <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
                        <a href="/terms" className="hover:text-gray-900">Terms of Service</a>
                        <a href="/contact" className="hover:text-gray-900">Contact</a>
                        </div>
                    </div>
                    </footer>
                </div>

                {/* Dolna część */}
                <div className='w-full flex justify-center items-end text-[13px] text-gray-800 font-normal'> © 2025 Notium. All rights reserved.</div>
            </div>

            <div className='w-[55%] flex justify-center items-center flex-col gap-1'>
                <div className='text-gray-800 font-light text-[20px]'>Receive latest updates</div>
                <form className="flex p-2 gap-3"
                    onSubmit={(e) => {
                        e.preventDefault()
                        console.log('Entered Email');
                        
                    }}
                >
                    <input 
                        className="focus:outline-gray-400 text-[15px] focus:outline-1 rounded-[12px]
                        bg-gray-100 border-1 text-gray-700 border-gray-300 px-6 py-3 focus:bg-gray-100"
                        type="text" 
                        placeholder="Enter your email"
                        onChange={(e) => setEmail(e.target.value)}
                    />
            
                    <div className="w-fit h-fit p-[1px] hover:border-gray-700 duration-100 bg-white border-1 border-gray-300 rounded-[12px]">
                        <input type="submit" className="bg-gray-800 text-[15px]
                        text-gray-100 px-5 py-3 rounded-[12px] hover:bg-gray-700 duration-100
                        border-1 cursor-pointer" value={'Submit'}/>
                    </div>
                </form>
            </div>
        </div>
    </div>
    )
}