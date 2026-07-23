import React, { useState } from 'react'
import { MenubarMenu, MenubarTrigger, MenubarContent } from '@/components/ui/menubar'
import { Editor } from "@tiptap/core"

// Domyślna paleta bazująca dokładnie na kolorach z Twojego zdjęcia
const INITIAL_COLORS = [
    // Pierwszy rząd (szarości)
    '#171717', '#262626', '#404040', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#FFFFFF',
    // Drugi rząd (kolory)
    '#16A34A', '#2563EB', '#4F46E5', '#9333EA', '#C026D3', '#E11D48', '#DC2626', '#EA580C'
]

export const ColorPickerMenu = ({ editor }: { editor: Editor }) => {
    // Stan przechowywania kolorów - pozwala na dodawanie nowych
    const [savedColors, setSavedColors] = useState<string[]>(INITIAL_COLORS)
    
    // Stan dla inputów
    const [hexValue, setHexValue] = useState('#171717')
    const [opacity, setOpacity] = useState('100')

    // Funkcja do wyliczania końcowego koloru z przezroczystością (Hex z kanałem Alpha)
    const applyColor = (hex: string, op: string) => {
        let finalColor = hex

        // Jeśli opacity jest mniejsze niż 100, konwertujemy procent na wartość HEX (00-FF)
        const opacityNum = parseInt(op)
        if (!isNaN(opacityNum) && opacityNum >= 0 && opacityNum < 100) {
            const alphaHex = Math.round((opacityNum / 100) * 255).toString(16).padStart(2, '0').toUpperCase()
            finalColor = `${hex}${alphaHex}`
        }

        // Aplikacja koloru w Tiptapie
        editor.chain().focus().setColor(finalColor).run()
    }

    // Obsługa kliknięcia kropki z palety
    const handleColorClick = (color: string) => {
        // Obcinamy ewentualny kanał alpha, żeby w inpucie został czysty hex
        const pureHex = color.slice(0, 7) 
        setHexValue(pureHex)
        setOpacity('100')
        applyColor(pureHex, '100')
    }

    // Obsługa przycisku "+ Add"
    const handleAddColor = () => {
        if (!savedColors.includes(hexValue)) {
            setSavedColors([...savedColors, hexValue])
        }
    }

    // Aktualny kolor wybrany w edytorze do wyświetlenia na głównej ikonie paska
    const currentEditorColor = editor?.getAttributes('textStyle').textColor || '#111827'

    return (
        <MenubarMenu>
            {/* ==================== TRIGGER ==================== */}
            <MenubarTrigger className="w-[32px] h-[32px] rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors border border-transparent focus:bg-gray-100 data-[state=open]:bg-gray-100">
                <div 
                    className="w-[18px] h-[18px] rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] border border-gray-200/50" 
                    style={{ backgroundColor: currentEditorColor }}
                />
            </MenubarTrigger>

            {/* ==================== PANEL ==================== */}
            <MenubarContent className="p-2 bg-white border border-gray-200 shadow-xl rounded-xl w-[260px]">
                
                {/* Header z przyciskiem Add */}
                <div className="flex items-center justify-between mb-3 px-0.5">
                    <span className="text-[14px] font-medium text-gray-700">Saved</span>
                    <button 
                        onClick={handleAddColor}
                        className="text-[14px] font-medium text-[#2563EB] hover:text-blue-700 hover:bg-blue-100 p-1 cursor-pointer rounded-[5px] transition-colors flex items-center gap-0.5"
                    >
                        <span className="text-lg leading-none font-light mb-[2px]">+</span> Add
                    </button>
                </div>

                {/* Siatka Kolorów (Grid) */}
                <div className="flex flex-wrap gap-2 mb-4 px-0.5">
                    {savedColors.map((color, index) => {
                        // Jeśli kolor to biały, dodajemy delikatną obwódkę, żeby nie zniknął na tle panelu
                        const isWhite = color.toUpperCase() === '#FFFFFF'
                        
                        return (
                            <button
                                key={`${color}-${index}`}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // Zabezpiecza focus edytora!
                                onClick={() => handleColorClick(color)}
                                className={`w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-sm ${
                                    isWhite ? 'border border-gray-200' : ''
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        )
                    })}
                </div>

                {/* Zblokowany Input (Hex + Opacity) z perfekcyjnymi paddingami */}
                <div className="flex  w-full border border-gray-300 rounded-[8px] overflow-hidden
                 focus-within:ring-[2px] focus-within:ring-gray-200 transition-all bg-white h-9">
                    
                    {/* Sekcja lewa: Hex */}
                    <div className="flex items-center">
                        <div 
                            className="w-3.5 h-3.5 ml-2 rounded-full border border-gray-200 mr-2 shrink-0" 
                            style={{ 
                                backgroundColor: hexValue,
                                opacity: parseInt(opacity) / 100 || 1 
                            }} 
                        />
                        <input 
                            type="text" 
                            value={hexValue}
                            onFocus={(e) => e.preventDefault()}
                            onChange={(e) => {
                                const v = e.target.value
                                // Normalize to always start with '#'
                                const normalized = v.startsWith('#') ? v : `#${v}`
                                // Allow up to 6 hex chars after '#'
                                if (/^#([0-9A-Fa-f]{0,6})$/.test(normalized)) {
                                    setHexValue(normalized)
                                }
                            }}
                            onBlur={() => applyColor(hexValue, opacity)}
                            onKeyDown={(e) => 
                               {
                                e.stopPropagation()
                                e.key === 'Enter' && applyColor(hexValue, opacity)
                               }
                            }
                            className="w-full text-[13px] h-full outline-none text-gray-700 bg-transparent"
                            placeholder="#000000"
                        />
                    </div>

                    {/* Pionowa linia oddzielająca (Divider) */}
                    <div className="w-[1px] h-full bg-gray-300 shrink-0" />

                    {/* Sekcja prawa: Opacity */}
                    <div className="w-[60px] pl-2 pr-2.5 flex items-center bg-gray-50/30">
                        <input 
                            type="text" 
                            value={opacity}
                            onChange={(e) => {
                                const opacity = Number(e.target.value)

                                if(opacity >= 0 && opacity <= 100) {
                                    setOpacity(e.target.value)
                                } else if (opacity >= 100){
                                    setOpacity('100')
                                } else {
                                    setOpacity('0')
                                }
                            }}
                            onBlur={() => applyColor(hexValue, opacity)}
                            onKeyDown={(e) => 
                               {
                                e.stopPropagation()
                                e.key === 'Enter' && applyColor(hexValue, opacity)
                               }
                            }
                            className="w-full text-[13px] outline-none text-gray-700 text-right bg-transparent"
                            maxLength={3}
                        />
                        <span className="text-[13px] text-gray-500 ml-0.5">%</span>
                    </div>
                </div>

            </MenubarContent>
        </MenubarMenu>
    )
}