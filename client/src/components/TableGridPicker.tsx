import { useState } from "react"
import { Editor } from "@tiptap/core"


type TableGridPickerProps = {
  editor: Editor
  maxRows?: number
  maxCols?: number
}

export default function TableGridPicker({ 
  editor, 
  maxRows = 8, 
  maxCols = 8,
}: TableGridPickerProps) {
  // Przechowujemy pozycję, nad którą aktualnie znajduje się myszka (1-indexed)
  const [hoveredGrid, setHoveredGrid] = useState({ rows: 0, cols: 0 })

  const handleCellHover = (row: number, col: number) => {
    setHoveredGrid({ rows: row, cols: col })
  }

  const handleCellClick = (rows: number, cols: number) => {
    if (!editor) return
    
    const uniqueTableId = `table-${Math.random().toString(36).substr(2, 9)}`
    // Wstawiamy tabelę w Tiptap o dynamicznym wymiarze
    editor.chain().focus().insertTable({ 
      rows: rows, 
      cols: cols, 
      withHeaderRow: true 
    }).updateAttributes('table', { id: uniqueTableId})
    .run()
    console.log(editor.getJSON())
  }

  return (
    <div className="p-2 bg-white rounded-md flex flex-col items-center gap-2 select-none">
      {/* Dynamiczny napis pokazujący aktualną wielkość, np. 4 x 3 */}
      <div className="text-[12px] font-medium text-gray-500">
        {hoveredGrid.rows > 0 && hoveredGrid.cols > 0 
          ? `${hoveredGrid.cols} × ${hoveredGrid.rows}` 
          : "Select size"}
      </div>

      {/* Kontener samej siatki */}
      <div 
        className="flex flex-col gap-[3px]"
        onMouseLeave={() => setHoveredGrid({ rows: 0, cols: 0 })}
      >
        {Array.from({ length: maxRows }).map((_, rowIndex) => {
          const currentRow = rowIndex + 1

          return (
            <div key={rowIndex} className="flex gap-[3px]">
              {Array.from({ length: maxCols }).map((_, colIndex) => {
                const currentCol = colIndex + 1
                
                // Komórka jest "aktywna" (niebieska), jeśli jej pozycja jest mniejsza lub równa pozycji hoveru
                const isActive = 
                  currentRow <= hoveredGrid.rows && currentCol <= hoveredGrid.cols

                return (
                  <div
                    key={colIndex}
                    onMouseEnter={() => handleCellHover(currentRow, currentCol)}
                    onClick={() => handleCellClick(currentRow, currentCol)}
                    className={`w-4 h-4 rounded-[2px] transition-colors border cursor-pointer ${
                      isActive
                        ? "bg-blue-500 border-blue-600 shadow-xs"
                        : "bg-gray-50 border-gray-200 hover:border-gray-400"
                    }`}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}