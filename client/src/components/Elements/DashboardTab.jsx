import { HugeiconsIcon } from '@hugeicons/react';

export default function DashboardTab({ icon, text, active }) {

    return (
        <div className={`flex gap-3 group items-center hover:text-gray-800  cursor-pointer text-gray-500 text-[16px]
         font-[500] font-Manrope hover:bg-blue-100 w-full px-3 py-[7px] rounded-[10px] duration-75 ${active ? "bg-gray-100" : ""}`}>
            <HugeiconsIcon
                icon={icon}
                className="text-gray-500 group-hover:text-gray-800"
                size={21}
                strokeWidth={1}
            />
            {text}
        </div>
    )
}