import { HugeiconsIcon } from '@hugeicons/react';
import { TextFontIcon  } from '@hugeicons/core-free-icons';
import { Relieved02Icon  } from '@hugeicons/core-free-icons';
import { ViewIcon  } from '@hugeicons/core-free-icons';


import BenefitBlock from './BenefitBlock';


export default function CustomizationSlide() {

    return (
    <div className="min-h-[50vh] -mt-[1px] p-3 border-t border-b border-dashed border-gray-300 relative">
        <div className="p-3 bg-white w-full h-full outline-1 outline-gray-300 rounded-[3px] flex">
        
            <div className="w-[45%] h-full justify-between pt-2 px-5 flex flex-col">

                {/* Górna część - tekst wyśrodkowany */}
                <div className='flex flex-col justify-center  flex-grow'>
                    <div className='flex gap-3'>
                        <span className='text-gray-800 text-2xl'>Over 100</span>
                        <span className="relative inline-block px-3 py-1 text-blue-500  font-light w-fit">
                            Fonts
                            <span className="absolute -top-0 -left-0 w-[10px] h-[10px] border-t-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -top-0 -right-0 w-[10px] h-[10px] border-t-1 border-r-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -left-0 w-[10px] h-[10px] border-b-1 border-l-1 border-blue-500"></span>
                            <span className="absolute -bottom-0 -right-0 w-[10px] h-[10px] border-b-1 border-r-1 border-blue-500"></span>
                        </span>
                    </div>

                    <div className=" mt-1 text-gray-600 text-[16px] font-light">
                        Let your imagination be your only limit with fonts we have over 100 most popular fonts according 
                        to google with diffrent styles
                    </div>

                    <div className='mt-5'>

                        <div className='grid grid-cols-2 gap-3'>
                            <BenefitBlock text="Many styles" Icon={() => <HugeiconsIcon size={20} icon={TextFontIcon} />} />
                            <BenefitBlock text="Best Fonts" Icon={() => <HugeiconsIcon size={20} icon={Relieved02Icon} /> }/>
                            <BenefitBlock text="Font Preview" Icon={() => <HugeiconsIcon icon={ViewIcon} /> }/>
                        </div>
                        {/* <div className='bg-blue-50 outline-1 rounded-[1px] outline-gray-500 w-fit'>
                            <div className='text-gray-700 w-full bg-white px-3 pt-3 pb-2'>Delete Messages</div>
                            <div className='text-gray-700 w-full bg-gray-100 px-3 pt-3 pb-2'>Send Photos</div>
                            <div className='text-gray-700 w-full bg-white px-3 pt-3 pb-2'>Edit Messages</div>
                            <div className='text-gray-700 w-full bg-gray-100 px-3 pt-3 pb-2'>Ping your friends</div>
                        </div> */}

                        <div className='text-gray-400 font-light'>as well as userfriendly interface</div>
                    </div>
                </div>

                {/* Dolna część */}
                <div className='w-full flex justify-center items-end text-gray-600 font-light'>4 / 4</div>
            </div>

            <div className='w-[55%] flex justify-center items-center'>
                <img src="./RTE_ss_6.png"  alt="" />
            </div>
        </div>
    </div>
    )
}