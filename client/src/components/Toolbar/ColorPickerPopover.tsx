import { useState } from 'react'
import { PopoverContent } from "@/components/ui/popover"
import { X, Plus } from "lucide-react"
import { MAC_COLORS_GRID } from "./MacColorsGrid" // Twój plik z kolorami
import { Editor } from '@tiptap/core';
import { getHexWithOpacity } from './getHexWithOpacity';



type ColorPickerPopoverProps = {
  editor: Editor,
  onClose?: () => void
}

export const ColorPickerPopover = ({ editor, onClose }: ColorPickerPopoverProps ) => {
  const [isShowMoreColors, setIsShowMoreColors] = useState<boolean>(false)
  const [selectedColor, setSelectedColor] = useState<string>('#A855F7')
  const [opacity, setOpacity] = useState<number>(100)
  const [isReplaceColorActive, setIsReplaceColorActive] = useState<boolean>(false)


  // Spójna, nowoczesna paleta podstawowa (Row 7 + Soft Dark Gray)
  const [presets, setPresets] = useState<string[]>([
    '#FE8C82', // Czerwony / Koralowy (Row 7, col 5)
    '#FEA57D', // Pomarańczowy / Brzoskwiniowy (Row 7, col 6)
    '#FFD978', // Żółty (Row 7, col 8)
    '#B2DD8B', // Zielony (Row 7, col 11)
    '#52D6FC', // Jasnoniebieski / Cyjan (Row 7, col 0)
    '#74A7FF', // Niebieski (Row 7, col 1)
    '#854FFD', // Fioletowy (Row 7, col 2)
    '#EF729E', // Różowy (Row 7, col 4)
    '#424242', // Ciemnoszary / Tekstowy (Row 0, col 9)
  ])

  const handlePresetClick = (index: number, color: string) => {

    if(isReplaceColorActive) {

      const updatedPresets = presets
      updatedPresets[index] = selectedColor
      setPresets(updatedPresets)
      setIsReplaceColorActive(false)
      
    } else {
        const currentColor = getHexWithOpacity(color, opacity)
      setSelectedColor(currentColor)
      editor.chain().focus().setColor(currentColor).run()
    }
  }

  // Generowanie wzoru szachownicy (przezroczystość) w czystym CSS bez zewnętrznych plików
  const opacityBackground = {
    backgroundImage: `
      linear-gradient(to right, transparent, ${selectedColor}),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23e5e7eb'%3E%3Crect width='6' height='6'/%3E%3Crect x='6' y='6' width='6' height='6'/%3E%3C/svg%3E")
    `
  }

  return (
    <PopoverContent  className="w-[320px] p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xl text-gray-800">
      
      <div className="flex flex-col gap-3.5">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center px-0.5">
          <span className="font-semibold text-gray-900 text-[15px] tracking-tight">Colors</span>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* PRZEŁĄCZNIK ZAKŁADEK (SEGMENTED CONTROL) */}
        <div className="w-full bg-gray-100/80 p-1 rounded-lg flex gap-1 border border-gray-200/50 text-xs font-medium relative z-1">
          <button
            type="button"
            onClick={() => setIsShowMoreColors(true)}
            className={`flex-1 py-1 transition-colors duration-150 z-3 ${
              isShowMoreColors 
                ? 'text-gray-900  font-semibold' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Advanced settings
          </button>

          
          {/* RUCHOME TŁO (SLIDER / THUMB) */}
            <div 
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-[6px] shadow-sm transition-transform duration-200 ease-out z-0 ${
                isShowMoreColors ? 'translate-x-0' : 'translate-x-full'
              }`}
            />

          <button
            type="button"
            onClick={() => setIsShowMoreColors(false)}
            className={`flex-1 py-1 transition-colors duration-150 z-2 ${
              !isShowMoreColors
                ? 'text-gray-900  font-semibold' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Hide
          </button>
        </div>

        {isShowMoreColors && (
          <>
            {/* SIATKA KOLORÓW */}
            <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200/70 shadow-inner">
              {MAC_COLORS_GRID.map((rowColors: string[], rowIndex: number) => (
                <div key={rowIndex} className="flex">
                  {rowColors.map((color: string, colIndex: number) => (
                    <button
                      key={`${color}-${colIndex}`}
                      type="button"
                      onClick={() => {
                        const currentColor = getHexWithOpacity(color, opacity)
                        setSelectedColor(currentColor) 
                        editor.chain().focus().setColor(currentColor).run()
                      }}
                      style={{ backgroundColor: color }}
                      className="relative w-[24px] h-[21px] cursor-pointer hover:ring-2 hover:ring-white hover:scale-105 hover:z-10 transition-transform "
                    />
                  ))}
                </div>
              ))}
            </div>


            {/* SEKCJA OPACITY */}
            <div className="flex flex-col gap-1.5 mt-1">

              <span className="text-[11px] font-bold text-gray-400 tracking-wider">OPACITY</span>

              <div className="flex items-center gap-3">
                {/* Pasek krycia ze wzorem szachownicy w CSS */}
                <div className="relative flex-1 h-7 flex  items-center">
                  
                    {/* 1. Tło paska (zaokrąglone i przycięte) */}
                    <div 
                      className="w-full h-full rounded-full overflow-hidden border border-gray-200 shadow-inner cursor-pointer" 
                      style={opacityBackground}
                    />

                    {/* 2. Gałka / Białe kółko */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[25px] h-[25px] rounded-full border-2 border-white shadow-md pointer-events-none "
                      style={{ 
                        // Używamy calc, aby kółko nie wychodziło poza krawędzie przy 0% i 100%
                        left: `calc(15px + (${opacity} / 100) * (100%  - 30px)` 
                      }}
                    />

                    {/* 3. Niewidoczny suwak (przechwytuje przeciąganie) */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => {
                        setOpacity(Number(e.target.value))
                        const currentColor = getHexWithOpacity(selectedColor, opacity)
                        setSelectedColor(currentColor) 
                        // editor.chain().focus().setColor(selectedColor).run()  
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />


                </div>
                {/* Wskaźnik procentowy */}
                <span className="text-xs font-semibold text-gray-700 w-[45px] text-right bg-gray-100 px-2 py-1 rounded-md border border-gray-200/60">
                  {opacity}%
                </span>
              </div>

            </div>


          </>
        )}


        {/* SEPARATOR */}
        <div className="w-full h-[1px] bg-gray-100 my-0.5" />

        <div className="flex flex-col gap-1.5">

          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-gray-400 tracking-wider">SAVED COLORS</span>
            {/* dynamiczna instrukcja dla użytkownika gdy aktywuje tryb */}
            {isReplaceColorActive && (
              <span className="text-[11px] font-medium text-blue-600 animate-pulse">
                Click a slot to replace
              </span>
            )}
          </div>
          
          {/* PODGLĄD WYBRANEGO KOLORU I ZAPISANE PALETY */}
          <div className="flex items-center justify-between gap-3 pt-1">

            {/* Główny podgląd koloru */}
            <div 
              className="w-16 h-16 rounded-[10px] shadow-sm border border-black/10 transition-colors flex-shrink-0"
              style={{ backgroundColor: selectedColor, opacity: opacity / 100 }}
            />

            {/* Koliste próbki kolorów z dynamicznymi animacjami */}
            <div className={`grid grid-cols-5  flex-1 justify-items-center ${isReplaceColorActive ? "gap-3" : "gap-2"}`}>
              {presets.map((color, index) => {
                // Sprawdzamy, czy dany kolor jest aktualnie wybrany
                const isSelected = selectedColor === getHexWithOpacity(color, opacity);
                console.log(selectedColor, color);
                
                if(isSelected) console.log("test");
                

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetClick(index, color)}
                    style={{ backgroundColor: color }}
                    className={`w-[26px] h-[26px] rounded-full border shadow-sm transition-all cursor-pointer relative ${
                      isReplaceColorActive 
                        ? "ring-2 ring-blue-500 ring-offset-1 animate-pulse scale-105 hover:scale-125 border-white z-20" 
                        : isSelected
                          ? "ring-2 ring-inset ring-white border-black/20 scale-110 shadow-md z-10" 
                          : "border-black/10 hover:scale-110"
                    }`}
                  />
                )
              })}

              {/* Przycisk aktywujący tryb podmieniania */}
              <button 
                type="button"
                onClick={() => setIsReplaceColorActive((prev) => !prev)}
                title={isReplaceColorActive ? "Cancel replace" : "Replace a preset color"}
                className={`w-[30px] h-[30px] rounded-full flex justify-center items-center transition-all cursor-pointer border ${
                  isReplaceColorActive 
                    ? "bg-blue-500 text-white border-blue-600 ring-2 ring-blue-200 rotate-45" 
                    : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600"
                }`}
              >
                <Plus size={14} className="transition-transform duration-200" />
              </button>
            </div>


          </div>
        </div>
      </div>
    </PopoverContent>
  )
}