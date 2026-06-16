import { HugeiconsIcon } from  "@hugeicons/react"
import { SourceCodeIcon } from '@hugeicons/core-free-icons'


export default function Code({ onCode, cCode }) {

    return (
        <div className={`
          border-1 border-gray-300  text-gray-800 w-[35px] flex justify-center items-center 
          cursor-pointer border-r-0 hover:bg-gray-100 ${cCode ? "bg-gray-50" : "bg-white"}`}>
            <HugeiconsIcon size={18} icon={SourceCodeIcon} 
        onClick={() => {
            onCode()
        }}    
        />
        </div>
    )
}