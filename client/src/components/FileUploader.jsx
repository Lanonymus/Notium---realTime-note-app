import { HugeiconsIcon } from '@hugeicons/react';
import { Attachment01Icon  } from '@hugeicons/core-free-icons';

import { useRef } from "react"
import ToolTip from "./ToolTip"

export default function FileUploader({ onFileSelected }) {

    const inputRef = useRef()

    const handleClick = () => {
        inputRef.current.click()
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file && onFileSelected) {
            onFileSelected(file)
        }
    }


    return (
        <div
        className="group w-[25px] h-[25px] flex justify-center items-center 
                    bg-gray-white hover:bg-gray-100 rounded-[4px] relative cursor-pointer"
        onClick={handleClick}
        >
            <HugeiconsIcon
                className="text-gray-700"
                size={16}
                icon={Attachment01Icon}
            />
            <ToolTip info={"File"} />

            <input
                type='file'
                ref={inputRef}
                onChange={handleFileChange}
                style={{ display: 'none'}}
            />
        </div>
    )
}