import { Editor } from "@tiptap/core"
import { useEffect, useRef, useState } from "react"
import { 
  Undo2, Redo2, Highlighter, Link, Bold, Italic, Strikethrough, Code, 
  ImagePlus, ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, 
  AlignJustify, List, ListOrdered, Quote, ChevronDown, Table as TableIcon, 
  Type,
  X,
  Plus,
  Minus
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
import TableGridPicker from "../TableGridPicker"
import FontItem from "./FontItem";
import { Input } from "@/components/ui/input"
import { MAC_COLORS_GRID } from "./MacColorsGrid";
import { ColorPickerPopover } from "./ColorPickerPopover";

type ToolBarProps = {
    editor: Editor,
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

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
export default function ToolBar({ editor, handleImageUpload }: ToolBarProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [, setCounter] = useState<number>(0)
    const [showToolbar, setShowToolbar] = useState(true)
    const [fontSizeVisual, setFontSizeVisual] = useState<any>(14)
    const [fontSize, setFontSize] = useState<number>(14)
    const [isEditingFontSize, setIsEditingFontSize] = useState<boolean>(false)
    const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false)

    useEffect(() => {
        if (!editor) return

        const handleUpdate = () => {
            setCounter(prev => prev + 1)
        }

        editor.on("transaction", handleUpdate)

        return () => {
            editor.off("transaction", handleUpdate)
        }
    }, [editor])

    if (!editor) return null

    const getCurrentHeadingLabel = () => {
        if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
        if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
        if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
        if (editor.isActive('heading', { level: 4 })) return 'Heading 4'
        return 'Normal text'
    }

    const DEFAULT_FONT = 'Inter'

    const getActiveFont = () => {
        if(!editor) return DEFAULT_FONT

        const fontFamily = editor.getAttributes("textStyle").fontFamily

        // jeśli nie ma czcionki zaznaczonej null albo undefined to taki bezpieczny fallback
        if(!fontFamily) {
            return DEFAULT_FONT
        }

        return fontFamily.replace(/['"]/g, "").trim()
    }    

    const tryToSetFontSize = (fontSize: number) => {
        if(isNaN(fontSize) || !fontSize) {
            setFontSizeVisual(fontSize)
            return
        }
        const fontSizeValue = fontSize > 100 ? 100 : fontSize

        setFontSize(fontSizeValue)
        setFontSizeVisual(fontSizeValue)
        editor.chain().focus().setFontSize(`${fontSizeValue}px`).run()
    }

    useEffect(() => {
        if(!editor) return

        const handleSelectionChange = () => {
            // nie chcemy zmieniać czcionki podczas gdy ktoś edytuje
            if(isEditingFontSize) return

            const currentFontSize = editor.getAttributes("textStyle").fontSize
            
            if(currentFontSize) {
                const fontSizeWithoutPixels = parseInt(currentFontSize, 10)
                if(!isNaN(fontSizeWithoutPixels)) {
                    setFontSizeVisual(fontSizeWithoutPixels)
                    setFontSize(fontSizeWithoutPixels)
                }
            } else {
                const DEFAULT_FONT_SIZE = 16
                setFontSizeVisual(DEFAULT_FONT_SIZE)
                setFontSize(DEFAULT_FONT_SIZE)
            }
        }

        editor.on("selectionUpdate", handleSelectionChange)
        editor.on("transaction", handleSelectionChange)

        return () => {
            editor.off("selectionUpdate", handleSelectionChange)
            editor.off("transaction", handleSelectionChange)
        }
    }, [editor, isEditingFontSize])


    return (
    <>
        <input 
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
        />

        <div className="w-full py-2 flex justify-center items-center relative">
            {/* Przycisk zwijania paska */}
            <div className="absolute bottom-[-4px] flex items-center justify-start left-0 right-0 h-[1px] hover:h-[2px] cursor-pointer transition-all bg-gray-200/80">
                <Button 
                    variant="outline" 
                    className="w-fit h-fit rounded-md p-1 ml-5 cursor-pointer bg-white border-gray-200 hover:bg-gray-50 shadow-2xs" 
                    onClick={() => setShowToolbar(!showToolbar)}
                >
                    {showToolbar ? (
                        <ArrowUp className="w-3 h-3 text-gray-600" />
                    ) : (
                        <ArrowDown className="w-3 h-3 text-gray-600" />
                    )}
                </Button>             
            </div>

            {/* Kontener zwijania */}
            <div 
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out w-full ${
                    showToolbar ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
            >
                <div className="overflow-hidden min-h-0 flex justify-center items-center w-full px-4">
                    <div className="flex items-center gap-1 p-1.5 bg-white max-w-full flex-wrap justify-center">
                        
                        {/* 1. UNDO / REDO */}
                        <div className="flex items-center gap-0.5">
                            <Tooltip>
                                <TooltipTrigger
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => editor.chain().focus().undo().run()}
                                    disabled={!editor.can().undo()}
                                    className={`p-1.5 rounded-[8px] transition-colors ${
                                        editor.can().undo() 
                                            ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer" 
                                            : "text-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                    <Undo2 className="h-4 w-4 stroke-[2]" />
                                </TooltipTrigger>
                                <TooltipContent className="px-2 py-1 text-xs flex gap-1.5 items-center">
                                    <span>Undo</span>
                                    <Kbd className="text-[10px]">Ctrl+Z</Kbd>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => editor.chain().focus().redo().run()}
                                    disabled={!editor.can().redo()}
                                    className={`p-1.5 rounded-[8px] transition-colors ${
                                        editor.can().redo() 
                                            ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer" 
                                            : "text-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                    <Redo2 className="h-4 w-4 stroke-[2]" />
                                </TooltipTrigger>
                                <TooltipContent className="px-2 py-1 text-xs flex gap-1.5 items-center">
                                    <span>Redo</span>
                                    <Kbd className="text-[10px]">Ctrl+Y</Kbd>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="h-4 w-[1px] bg-gray-200 mx-1" />



                        {/* 2. FONT FAMILY SELECTOR */}
                        <Popover>
                            <PopoverTrigger className="h-8 px-3 py-1 text-xs font-medium border border-gray-200 hover:border-gray-300
                                     rounded-[8px] flex items-center gap-1.5 bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer">
                                <span><Type size={15} className="text-gray-700"/></span>
                                {getActiveFont() || 'Inter'}
                                <span><ChevronDown size={10} className="text-gray-700"/></span>
                            </PopoverTrigger>
                                
                            <PopoverContent className="w-fit p-0 gap-0 px-0.5 py-0.5 border-1 border-gray-200
                                     rounded-[8px] flex flex-col  bg-white text-gray-700 transition-all shadow-xl  shadow-gray-300 cursor-pointer" align="start">
                                
                                {/* TOOLBAR FONTS SELECTOR */}
                                {fonts.map((font) => {
                                    return <FontItem fontName={font} editor={editor}/>
                                })}

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
                                        tryToSetFontSize(fontSizeWithoutPixels)
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
                                            editor.chain().focus().setFontSize(`${newFontSize}px`).run()
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
                                            editor.chain().focus().setFontSize(`${newFontSize}px`).run()
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
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('bold') 
                                        ? "bg-gray-100 text-gray-900 font-bold" 
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                    >
                                    <div className="w-[15px] h-[15px] rounded-full ring-2 ring-gray-300 bg-gray-900" />
                                    </TooltipTrigger>                                    
                                }>
                                </PopoverTrigger>

                                <TooltipContent className="text-xs">
                                    <p>Text Color</p>
                                </TooltipContent>

                            </Tooltip>

                            <ColorPickerPopover editor={editor} onClose={() => setIsColorPickerOpen(false)}/>
                        </Popover>



                        <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                        {/* 3. FORMATOWANIE TEKSTU */}
                        <div className="flex items-center gap-0.5">
                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('bold') 
                                            ? "bg-gray-100 text-gray-900 font-bold" 
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <Bold className="h-4 w-4 stroke-[2.2]" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Bold</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('italic') 
                                            ? "bg-gray-100 text-gray-900 font-bold" 
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <Italic className="h-4 w-4 stroke-[2.2]" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Italic</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().toggleStrike().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('strike') 
                                            ? "bg-gray-100 text-gray-900 font-bold" 
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <Strikethrough className="h-4 w-4 stroke-[2.2]" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Strikethrough</TooltipContent>
                            </Tooltip>


                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().toggleHighLight().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('customHighLight') 
                                            ? "bg-amber-100 text-amber-900" 
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <Highlighter className="h-4 w-4 stroke-[2]" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Highlight</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                        {/* 4. WYRÓWNANIE TEKSTU */}
                        <div className="flex items-center gap-0.5">
                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('textAlign', { align: 'left' }) 
                                            ? "bg-gray-100 text-gray-900" 
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <AlignLeft className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Align Left</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('textAlign', { align: 'center' }) 
                                            ? "bg-gray-100 text-gray-900" 
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <AlignCenter className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Align Center</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('textAlign', { align: 'right' }) 
                                            ? "bg-gray-100 text-gray-900" 
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
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
                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('bulletList') 
                                            ? "bg-gray-100 text-gray-900" 
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <List className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Bullet List</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('orderedList') 
                                            ? "bg-gray-100 text-gray-900" 
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                    <ListOrdered className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Numbered List</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger
                                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                    className={`p-1.5 rounded-[8px] transition-all cursor-pointer ${
                                        editor.isActive('blockquote') 
                                            ? "bg-gray-100 text-gray-900" 
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
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
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-[8px] transition-colors cursor-pointer"
                                >
                                    <ImagePlus className="h-4 w-4 stroke-[2]" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Add Image</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-[8px] transition-colors cursor-pointer">
                                    <Link className="h-4 w-4 stroke-[2]" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Insert Link</TooltipContent>
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
                                    <TableGridPicker editor={editor} maxRows={8} maxCols={8} />
                                </PopoverContent>

                            </Popover>
                        </div>


                        {/* 2. HEADING SELECTOR */}
                        <Popover>
                            <PopoverTrigger className="h-8 px-2 py-1 text-xs font-medium border border-gray-200 hover:border-gray-300
                                     rounded-[8px] flex items-center gap-1.5 bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-2xs cursor-pointer">
                                Heading
                                <span><ChevronDown size={10} className="text-gray-700"/></span>
                            </PopoverTrigger>
                                
                            <PopoverContent className="flex flex-col gap-[1px] w-[150px] p-1.5 bg-white border border-gray-200 shadow-md rounded-lg" align="start">
                                
                                {/* H1 */}
                                <button 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                                    className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md transition-colors text-left ${
                                        editor.isActive('heading', { level: 1 }) ? "bg-gray-100" : "bg-white hover:bg-gray-100"
                                    }`}
                                >
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H1</div>
                                <h1 className="font-Roboto text-lg font-bold text-gray-900 leading-tight">Heading 1</h1>
                                </button>

                                {/* H2 */}
                                <button 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                                    className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md transition-colors text-left ${
                                        editor.isActive('heading', { level: 2 }) ? "bg-gray-100" : "bg-white hover:bg-gray-100"
                                    }`}
                                >
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H2</div>
                                <h2 className="font-Roboto text-base font-semibold text-gray-800 leading-tight">Heading 2</h2>
                                </button>

                                {/* H3 */}
                                <button 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
                                    className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md transition-colors text-left ${
                                        editor.isActive('heading', { level: 3 }) ? "bg-gray-100" : "bg-white hover:bg-gray-100"
                                    }`}
                                >
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H3</div>
                                <h3 className="font-Roboto text-[14px] font-medium text-gray-800 leading-tight">Heading 3</h3>
                                </button>

                                {/* H4 */}
                                <button 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} 
                                    className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md transition-colors text-left ${
                                        editor.isActive('heading', { level: 4 }) ? "bg-gray-100" : "bg-white hover:bg-gray-100"
                                    }`}
                                >
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H4</div>
                                <h4 className="font-Roboto text-[13px] font-normal text-gray-700 leading-tight">Heading 4</h4>
                                </button>

                                {/* H5 */}
                                <button 
                                    onMouseDown={(e) => e.preventDefault()} 
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} 
                                    className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md transition-colors text-left ${
                                        editor.isActive('heading', { level: 5 }) ? "bg-gray-100" : "bg-white hover:bg-gray-100"
                                    }`}
                                >
                                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H5</div>
                                <h5 className="font-Roboto text-[12px] font-light text-gray-500 leading-tight">Heading 5</h5>
                                </button>

                            </PopoverContent>
                        </Popover>                        

                    </div>
                </div>
            </div>
        </div>
    </>
    )
}