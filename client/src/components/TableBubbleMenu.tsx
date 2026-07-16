import { Editor } from "@tiptap/core"
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Table as TableIcon 
} from "lucide-react"

type TableBubbleMenuProps = {
  editor: Editor
}

export default function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  if (!editor) return null

  return (
      <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-xl rounded-lg p-1.5 backdrop-blur-md select-none">
        
        {/* SEKCJA: WIERSZE */}
        <div className="flex items-center border-r border-gray-100 pr-1 mr-1 gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-1.5 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded flex items-center gap-1 font-Roboto text-[12px] font-medium transition-colors cursor-pointer"
            title="Add Row Below"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Row</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors cursor-pointer"
            title="Delete Current Row"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SEKCJA: KOLUMNY */}
        <div className="flex items-center border-r border-gray-100 pr-1 mr-1 gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-1.5 text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded flex items-center gap-1 font-Roboto text-[12px] font-medium transition-colors cursor-pointer"
            title="Add Column Right"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Col</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors cursor-pointer"
            title="Delete Current Column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SEKCJA: USUWANIE CAŁEJ TABELI */}
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 rounded flex items-center gap-1 font-Roboto text-[12px] font-semibold transition-colors cursor-pointer"
          title="Delete Entire Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Delete Table</span>
        </button>

      </div>
  )
}