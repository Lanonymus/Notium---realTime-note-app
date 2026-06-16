import { HugeiconsIcon } from  "@hugeicons/react"
import { TextItalicIcon } from '@hugeicons/core-free-icons'


export default function Italic({ onItalic, cItalic }) {

    return (
        <div className={`
          border-1 border-gray-300  text-gray-800 w-[35px] flex justify-center items-center 
          cursor-pointer rounded-tr-[4px] rounded-br-[4px] hover:bg-gray-100
          ${cItalic ? "bg-gray-50" : "bg-white"}`}>
            <HugeiconsIcon size={18} icon={TextItalicIcon} 
        onClick={() => {
            onItalic()
        }}    
        />
        </div>
    )
}