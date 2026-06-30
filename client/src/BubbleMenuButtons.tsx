import { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";



export default function BubbleMenuButtons({ editor }: {editor: Editor}) {
    const [, setTick] = useState(0)

    useEffect(() => {
        const handler = () => {
            setTick(prev => prev + 1)
        }

        editor.on("transaction", handler)

        return () => {
            editor.off("transaction", handler)
        }
    },[editor])


    return (
    <>
    <div className="bg-gray shadow-[5px] bg-white  shadow-gray-800 px-[3px] py-[2px] rounded-[5px] flex gap-1 border-1 border-gray-200">
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-[50px] font-Roboto hover:bg-gray-200 transition-all duration-150 text-gray-800 rounded-[4px] bg-gray-50
            ${editor.isActive("bold") ? "bg-gray-200 text-gray-100" : ""}`}
            >
            B
        </button>
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-[50px] font-Roboto hover:bg-gray-200 transition-all duration-150 text-gray-800 rounded-[4px] bg-gray-50
            ${editor.isActive("italic") ? "bg-gray-200 text-gray-100" : ""}`}
        >
          I
        </button>
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-[50px] font-Roboto hover:bg-gray-200 transition-all duration-150 text-gray-800 rounded-[4px] bg-gray-50
            ${editor.isActive("underline") ? "bg-gray-200 text-gray-100" : ""}`}
        >
          U
        </button>
    </div>
    </>
    )
}