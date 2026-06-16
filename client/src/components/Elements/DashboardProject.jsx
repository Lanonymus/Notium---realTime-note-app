import { HugeiconsIcon } from '@hugeicons/react';
import { Menu02Icon } from '@hugeicons/core-free-icons';
import { MoreVerticalIcon } from '@hugeicons/core-free-icons';

export default function DashboardProject({ imgSrc, title, date}) {

    return (
        <div className='h-auto outline-1 rounded-[2px] outline-gray-300 flex flex-col hover:outline-blue-500 cursor-pointer'>
            <div className='w-full h-full'>
            <img src={imgSrc} className='w-full object-center h-[250px] object-cover' alt="" />
            </div>
            <div className='w-full h-[95px] outline-1 outline-gray-300 flex flex-col pl-4 pr-3 py-3 gap-[2px]'>
            <div className='w-full text-left font-[400] text-[15px] font-Roboto text-gray-700'>{title}</div>
            <div className='flex justify-between items-center'>

                <div className='w-auto h-auto p-1 rounded-[3px] rounded-br-[9px] bg-blue-500 '>
                <HugeiconsIcon className=' text-white' strokeWidth={3} size={14} icon={Menu02Icon} />
                </div>
                <div className='text-[13px] text-gray-500 font-[300] font-Roboto max-h-[25px] line-clamp-1'>{date}</div>
                <div className='w-auto h-auto p-1 rounded-[50%] hover:bg-gray-200 duration-75 bg-white'>
                <HugeiconsIcon className='text-gray-600 ' strokeWidth={3} size={25} icon={MoreVerticalIcon} />
                </div>
            </div>
            </div>
        </div>

    )
}