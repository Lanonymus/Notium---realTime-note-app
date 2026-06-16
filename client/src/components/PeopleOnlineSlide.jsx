import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon  } from '@hugeicons/core-free-icons';

export default function PeopleOnlineSlide() {

    return (
    <div className="min-h-[50vh] -mt-[1px] p-3 border-t border-b border-dashed border-gray-300 relative">
        <div className="p-3 bg-white w-full h-full outline-1 outline-gray-300 rounded-[3px] flex">
        
            <div className="w-[45%] h-full justify-between pt-2 px-5 flex flex-col">

                {/* Górna część - tekst wyśrodkowany */}
                <div className='flex flex-col justify-center  flex-grow'>
                    <div className='flex gap-3'>
                        <span className='text-gray-800 text-2xl'>Check your friends</span>
                        <span className="relative inline-block px-3 py-1 text-blue-500  font-light w-fit">
                            Status
                            <span className="absolute -top-0 -left-0 w-[10px] h-[10px] border-t-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -top-0 -right-0 w-[10px] h-[10px] border-t-1 border-r-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -left-0 w-[10px] h-[10px] border-b-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -right-0 w-[10px] h-[10px] border-b-1 border-r-1 border-blue-500"></span>
                        </span>
                    </div>

                    <div className=" mt-1 text-gray-600 text-[16px] font-light">
                        Be aware of who is working on the project by seeing profiles pop up in the right 
                        corner of the website
                    </div>

                    

                </div>

                {/* Dolna część */}
                <div className='w-full flex justify-center items-end text-gray-600 font-light'>3 / 4</div>
            </div>

            <div className='w-[55%] flex justify-center items-center relative'>
                
                <img src="./RTE_ss_5.png" className='z-2'  alt="" />
            </div>
        </div>
    </div>
    )
}