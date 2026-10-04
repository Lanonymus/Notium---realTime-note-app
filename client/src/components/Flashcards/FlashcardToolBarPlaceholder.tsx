import { Editor } from "@tiptap/core"
import { useEffect, useRef, useState } from "react"
import { 
  Undo2, Redo2, Highlighter, Link, Bold, Italic, Strikethrough, Code, 
  ImagePlus, ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, 
  AlignJustify, List, ListOrdered, Quote, ChevronDown, Table as TableIcon, 
  Type,
} from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import TableGridPicker from "../Table/TableGridPicker"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import DropBoxImage from "../Toolbar/DropBoxImage";
import FontItem from "../Toolbar/FontItem";
import { ColorPickerPopover } from "../Toolbar/ColorPickerPopover";
import { getHexWithOpacity } from "../Toolbar/getHexWithOpacity";


const fonts = [
    'Inter',
    'Geist',
    'Ubuntu',
    'Comic Neue',
    'Noto Sans Korean',
    'Montserrat',
    'Quicksand'
]



// TODO: Dodać logike wybierania czcionki i zmiany wielkości
// TODO: Dodać logike wybierania kolorów
export default function FlashcardToolBarPlaceholder() {

    const [fontSizeVisual, setFontSizeVisual] = useState<any>(14)
    const [fontSize, setFontSize] = useState<number>(14)
    const [isEditingFontSize, setIsEditingFontSize] = useState<boolean>(false)

    // TEXT COLOR AND HIGHLIGHT
    const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false)
    const [selectedColor, setSelectedColor] = useState<string>('#101828')
    const DEFAULT_COLOR = "#101828"
    
    const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState<boolean>(false)    

    // image uploader
    const [isDropImageOpen, setIsDropImageOpen] = useState<boolean>(false)


    return (
    <>


        <div className={`w-full py-1 flex justify-center items-center relative border-b-1 border-gray-200`}>

                <div className="overflow-hidden min-h-0 flex justify-center items-center w-full px-4">
                    <div className="flex items-center  w-full px-1">
                        
                                                    

                        {/* <-------------TOOLBAR CONTAINER-------------> */}
                        <div className="flex items-center gap-1 p-1.5 max-w-full flex-wrap justify-center">


                            {/* 2. FONT FAMILY SELECTOR */}
                            <Popover>
                                <PopoverTrigger className="h-8 px-3 py-1 text-xs font-medium border border-gray-200 hover:border-gray-300
                                        rounded-[8px] flex items-center gap-1.5 bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer">
                                    <span><Type size={15} className="text-gray-700"/></span>
                                    {'Inter'}
                                    <span><ChevronDown size={10} className="text-gray-700"/></span>
                                </PopoverTrigger>
                                    
                                <PopoverContent className="w-fit p-0 gap-0 px-0.5 py-0.5 border-1 border-gray-200
                                        rounded-[8px] flex flex-col  bg-white text-gray-700 transition-all shadow-xl  shadow-gray-300 cursor-pointer" align="start">
                                

                                </PopoverContent>
                            </Popover>


                            {/* 2. FONT SIZE SELECTOR */}
                            <div className="h-8 text-xs font-medium border border-gray-200 hover:border-gray-300
                                        rounded-[8px] flex bg-white text-gray-700 
                                        transition-all shadow-2xs cursor-pointer overflow-hidden">
                                <input 
                                    type="text" 
                                    className="w-15 text-[12px] text-center h-full rounded-l-[8px] hover:bg-gray-100" 
                                    value={isEditingFontSize ? fontSizeVisual : `${fontSizeVisual}px`} 
                                    // value={fontSizeVisual}
                                    onClick={() => {
                                        setIsEditingFontSize(true)
                                    }}
                                    onChange={(e) => {
                                        const value: any = e.target.value || 0
                                        setFontSizeVisual(parseInt(value, 10))
                                        setIsEditingFontSize(true)
                                    }}
                                    onKeyDown={(e) => {
                                        if(e.key === "Enter") {
                                            const fontSizeWithoutPixels = parseInt(fontSizeVisual, 10)
                                            setIsEditingFontSize(false)
                                        }
                                    }}
                                />

                                <div className="flex flex-col w-full h-full justify-center items-center border-l border-gray-200">
                                    <div className="rotate-180 hover:bg-gray-100 group px-1 h-[50%] flex items-center justify-center">
                                        <ChevronDown size={10} className="text-gray-700 group-hover:text-gray-800" 
                                            onClick={() => {
                                                const newFontSize = fontSize + 1
                                                setFontSize(newFontSize)
                                                setFontSizeVisual(newFontSize)
                                            }}
                                        />
                                    </div>  

                                    <div className="w-full bg-gray-200 h-[1px]"></div>

                                    <div className="hover:bg-gray-100 group px-1 h-[50%] flex items-center justify-center">
                                        <ChevronDown size={10} className="text-gray-700 group-hover:text-gray-800"
                                            onClick={() => {
                                                const newFontSize = fontSize - 1
                                                setFontSize(newFontSize)
                                                setFontSizeVisual(newFontSize)
                                            }}                                
                                        />
                                    </div>                                
                                </div>
                            </div>




                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />



                            {/* <-----KOLOR TEKSTU / COLOR PICKER------*/}
                            <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
                                <Tooltip>
                                    <PopoverTrigger render={
                                        <TooltipTrigger 
                                            className={`rounded-[8px] transition-all cursor-pointer p-1.5`}
                                        >
                                        <div
                                            style={{ backgroundColor: selectedColor}}  
                                            className="w-[20px] h-[20px] rounded-full border transition-all cursor-pointer relative
                                        ring-2 ring-inset ring-white border-black/20  shadow-md z-10" />
                                        </TooltipTrigger>                                    
                                    }>
                                    </PopoverTrigger>

                                    <TooltipContent className="text-xs">
                                        <p>Text Color</p>
                                    </TooltipContent>

                                </Tooltip>

                            </Popover>



                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                            {/* 3. FORMATOWANIE TEKSTU */}
                            <div className="flex items-center gap-0.5">
                                {/* BOLD  */}
                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <Bold className="h-4 w-4 stroke-[2.2]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Bold</TooltipContent>
                                </Tooltip>

                                {/* ITALIC */}
                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <Italic className="h-4 w-4 stroke-[2.2]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Italic</TooltipContent>
                                </Tooltip>

                                {/* STRIKETHRUGHT  */}
                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <Strikethrough className="h-4 w-4 stroke-[2.2]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Strikethrough</TooltipContent>
                                </Tooltip>


                                {/* HIGHLIGHT */}
                                <Popover open={isHighlightPickerOpen} onOpenChange={setIsHighlightPickerOpen}>
                                    <Tooltip>
                                        <PopoverTrigger render={
                                            <TooltipTrigger
                                                className="p-1.5 border-none rounded-[8px] transition-all cursor-pointer text-gray-700 hover:bg-gray-100
                                                flex flex-col items-center justify-center"
                                            >
                                                <Highlighter className="h-4 w-4 stroke-[2]" />
                                                {/* Wskaźnik wybranego koloru pod ikonką */}

                                            </TooltipTrigger>                                  
                                        }>
                                        </PopoverTrigger>

                                        <TooltipContent className="text-xs">Highlight</TooltipContent>
                                    </Tooltip>

                                </Popover>
                            </div>

                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                            {/* 4. WYRÓWNANIE TEKSTU */}
                            <div className="flex items-center gap-0.5">
                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <AlignLeft className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Align Left</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <AlignCenter className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Align Center</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <AlignRight className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Align Right</TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                            {/* 5. LISTY I CYTATY */}
                            <div className="flex items-center gap-0.5">
                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <List className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Bullet List</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <ListOrdered className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Numbered List</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger
                                        className={`p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                                    >
                                        <Quote className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Quote</TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />



                            {/* 6. MEDIA I TABELA */}
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger 
                                        onClick={() => setIsDropImageOpen(true)}
                                        className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-[8px] transition-colors cursor-pointer"
                                    >
                                        <ImagePlus className="h-4 w-4 stroke-[2]" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Add Image</TooltipContent>
                                </Tooltip>

                                            
                                <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                                <Popover>
                                    <PopoverTrigger className="h-8 px-2 py-1 text-xs font-medium border border-gray-200 hover:border-gray-300
                                        rounded-[8px] flex items-center gap-1.5 bg-white text-gray-700transition-all shadow-2xs cursor-pointer">
                                            <TableIcon className="h-3.5 w-3.5 text-gray-500" />
                                            <span>Table</span>
                                    </PopoverTrigger>   

                                    <PopoverContent className="w-auto p-3 bg-white border hover:bg-gray-50 border-gray-200 shadow-md rounded-xl" align="end">
                                        <div className="text-xs font-medium text-gray-500 mb-2">Insert Table Grid</div>
                                    </PopoverContent>

                                </Popover>
                            </div>

                        </div>

                    
                    </div>
                </div>
        </div>
    </>
    )
}