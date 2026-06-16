import { HugeiconsIcon } from '@hugeicons/react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function DashboardTemplate({ icon, title, user}) {
    const navigate = useNavigate();

    function createAndEnterRoom() {
        const roomId = uuidv4()
        console.log(user);
        const username = user.username
        console.log(username);
        

        // Pobieranie z state aplikacji, np user.name lub input
        // najlepiej trzymać username w state globalnym albo localstorage
        navigate(`/editor?room=${roomId}&username=${encodeURIComponent(username)}`)
    }


    return (
        <>
            {/* Project - Template */}
            <div className='flex flex-col w-[135px] bg-white'>
                <div className='w-full h-[185px] outline-1 cursor-pointer outline-gray-300 rounded-[3px]
                    hover:outline-blue-400 flex justify-center items-center group' 
                    onClick={() => {
                        createAndEnterRoom()
                    }}
                    >
                    <HugeiconsIcon icon={icon} size={40} className='text-gray-500 group-hover:text-gray-800' strokeWidth={1} />
                    {/* <HugeiconsIcon icon={PlusSignIcon} /> */}
                </div>
            <div className='font-[500] text-gray-800 text-[14px] font-Manrope w-full text-center pt-2'>{title}</div>
            </div>
        </>
    )
}