import { Editor } from "@tiptap/core";
import { TextStyle } from "@tiptap/extension-text-style";


type FontItemProps = {
    fontName: string,
    editor: Editor
}



export default function FontItem({ fontName, editor } : FontItemProps) {
    return (
        <button 
            onMouseDown={(e) => e.preventDefault()} 
            onClick={() => editor.chain().focus().setFontFamily(fontName).run()} 
            className={`text-[13px] px-2.5 py-2 flex items-start cursor-pointer w-full rounded-[4px] transition-colors text-left ${
                editor.isActive('textStyle', { fontFamily: fontName }) ? "bg-gray-100" : "bg-white hover:bg-gray-100"
            }`}
        >
            <h1 style={{ fontFamily: fontName}} className="text-[13px] text-gray-900 leading-tight">{fontName}</h1>
        </button>        
)
}