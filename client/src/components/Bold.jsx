import { HugeiconsIcon } from  "@hugeicons/react"
import { TextBoldIcon } from '@hugeicons/core-free-icons'



export default function Bold({ onBold, cBold }) {


    return (
        <div 
            className={`
            border-1 border-gray-300  text-gray-800 w-[35px] flex justify-center items-center 
            cursor-pointer rounded-tl-[4px] rounded-bl-[4px] border-r-0 hover:bg-gray-100
            ${cBold ? "bg-gray-50" : "bg-white"}`}
            onClick={() => {
                onBold()
            }}
            >
            <HugeiconsIcon size={18} icon={TextBoldIcon} />
        </div>
    )
}