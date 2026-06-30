import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown02Icon  } from '@hugeicons/core-free-icons';
import { ArrowRight01Icon  } from '@hugeicons/core-free-icons';
import BackgroundDots from './BackgroundDots';


export default function LandingSlide() {

    return (
    <div className="min-h-[50vh] -mt-[1px] p-3 border-t border-b border-dashed border-gray-300 relative">
        
        <div className="p-2 bg-white w-full h-full outline-1 outline-gray-300 rounded-[3px] flex">
        
            <div className="max-w-[45%] h-full justify-between pt-2 px-5 flex flex-col">

                {/* Górna część - tekst wyśrodkowany */}
                <div className='flex flex-col justify-center  flex-grow'>
                    <div className='flex gap-3'>
                        <span className='text-gray-800 text-2xl'>Real time</span>
                        <span className="relative inline-block px-3 py-1 text-blue-500  font-light w-fit">
                            Editor
                            <span className="absolute -top-0 -left-0 w-[10px] h-[10px] border-t-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -top-0 -right-0 w-[10px] h-[10px] border-t-1 border-r-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -left-0 w-[10px] h-[10px] border-b-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -right-0 w-[10px] h-[10px] border-b-1 border-r-1 border-blue-500"></span>
                        </span>
                    </div>

                    <div className=" mt-1 text-gray-600 text-[16px] font-light">Discover a way to instatnly connect with your friends online our Editor
                        let's you edit a document in real time for other users to see mixed with 
                        user friendly interface <span className='text-blue-500 font-normal'>+ many benefits</span>
                    </div>

                    <div className='group p-1 outline-gray-300 outline-1 w-fit mt-3 cursor-pointer'>
                        <div className="px-[25px] py-[8px] text-[15px] bg-gray-900 text-white  outline-1
                        outline-gray-300 rounded-[6px] w-fit h-fit gap-2 flex justify-center items-center">
                            Explore <HugeiconsIcon className='group-hover:translate-x-1 duration-100 transform translate-x-0' size={20} icon={ArrowRight01Icon}/>
                        </div>
                    </div>
                </div>

                {/* Dolna część */}
                <div className='w-full flex justify-center items-end text-gray-600 font-light'>1 / 4</div>
            </div>

            <div>
                <img src="./RTE_ss_3.png"  alt="" />
            </div>
        </div>
    </div>
    )
}