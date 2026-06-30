import { Editor } from "@tiptap/core"
import { useRef } from "react"


type ToolBarProps = {
    editor: Editor,
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}


export default function ToolBar({ editor, handleImageUpload}: ToolBarProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    return (
    <>
    {/* Ukryty input do wgyrwania zdjęć */}
        <input 
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        ref={fileInputRef}
        />

    <div className="flex items-center gap-x-2 p-2">
        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        B
        </button>

        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        I
        </button>

        <button
            onMouseDown={(e) => e.preventDefault()}
            // Zmieniamy na level: 3, ale na przycisku napiszmy H3, żeby nie mylić użytkownika
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all border-gray-300 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200' : 'bg-white'}`}
        >
            H3
        </button>

        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        U
        </button>

        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        BL
        </button>

        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().setColor("#ef4444").run()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        RED
        </button>

        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        CODE
        </button>

        <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`w-[35px] h-[35px] text-sm font-semibold rounded-md border transition-all hover:bg-slate-50 border-gray-300 `}
        >
        IMG
        </button>
        <button
        onClick={() => editor.chain().focus().toggleHighLight().run()}
        className={`px-3 py-1 text-sm rounded border transition-colors ${
            editor.isActive('customHighlight') 
            ? 'bg-yellow-200 border-yellow-400 font-bold' 
            : 'bg-white hover:bg-gray-100'
        }`}
        >
        🖊️ Zakreślacz
        </button>
    </div>
    </>)
}