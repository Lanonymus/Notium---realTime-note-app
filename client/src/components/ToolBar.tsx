import { Editor } from "@tiptap/core"
import { useEffect, useRef, useState } from "react"
import { Undo2, Redo2, Highlighter, Link, Superscript, Subscript, TextAlignStart, TextAlignCenter, TextAlignEnd, TextAlignJustify, Bold, Italic, Strikethrough,
    Code, FileCodeCorner, ImagePlus 
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Kbd } from "@/components/ui/kbd"
import TableGridPicker from "./TableGridPicker"
import TableGridPicker_Test from "./TableGridPicker_test"

type ToolBarProps = {
    editor: Editor,
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}


export default function ToolBar({ editor, handleImageUpload}: ToolBarProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [, setCounter] = useState<number>(0)

    useEffect(() => {
        if(!editor) return

        const handleUpdate = () => {
            setCounter(prev => prev + 1)
        }

        editor.on("transaction", handleUpdate)

        return () => {
            editor.off("transaction", handleUpdate)
        }
    },[editor])

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

    <div className="w-full h-[50px] px-2 py-[3px] flex justify-center items-center border-b-1 border-gray-200 fixed top-0 left-0 bg-white z-3">

        <NavigationMenu>
            <NavigationMenuList>

            {/* 1. UNDO */}
            <NavigationMenuItem>
                <Tooltip>
                    <TooltipTrigger 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className={`p-1.5 rounded-md transition-colors font-Roboto text-[13px] ${
                            editor.can().undo() 
                                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-800 cursor-pointer" 
                                : "text-gray-300 cursor-not-allowed"
                        }`}>
                    
                        <Undo2 className="h-5 w-5 stroke-[2]" />                                          
                    </TooltipTrigger>
                    <TooltipContent className="px-2 flex gap-2">
                        <p>Undo</p>
                        <div className="text-[10px] flex gap-1 justify-center items-center">
                            <Kbd className="text-[10px]">Ctrl</Kbd>
                            <span>+</span>
                            <Kbd className="text-[10px]">Z</Kbd>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </NavigationMenuItem>

            {/* 2. REDO */}
            <NavigationMenuItem className="border-r border-gray-200 pr-1 mr-1">
                <Tooltip>
                    <TooltipTrigger
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className={`p-1.5 rounded-md transition-colors font-Roboto text-[13px] ${
                            editor.can().redo() 
                                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-800 cursor-pointer" 
                                : "text-gray-300 cursor-not-allowed"
                        }`}
                    >
                        <Redo2 className="h-5 w-5 stroke-[2]" />
                    </TooltipTrigger>
                    <TooltipContent className="px-2 flex gap-2">
                        <p>Redo</p>
                        <div className="text-[10px] flex gap-1 justify-center items-center">
                            <Kbd className="text-[10px]">Ctrl</Kbd>
                            <span>+</span>
                            <Kbd className="text-[10px]">Y</Kbd>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </NavigationMenuItem>


                <NavigationMenuItem>
                    <NavigationMenuTrigger className={"text-[13px]"}>Heading</NavigationMenuTrigger>
                    <NavigationMenuContent className={"flex flex-col gap-[1px] w-[150px] p-1.5"}>
                        
                        {/* H1 */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md ${editor.isActive('heading', { level: 1 }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H1</div>
                            {/* Dodano: text-lg, font-bold i mniejszy line-height */}
                            <h1 className="font-Roboto text-lg font-bold text-gray-900 leading-tight">Heading 1</h1>
                        </NavigationMenuLink>

                        {/* H2 */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md ${editor.isActive('heading', { level: 2 }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H2</div>
                            {/* Dodano: text-base, font-semibold */}
                            <h2 className="font-Roboto text-base font-semibold text-gray-800 leading-tight">Heading 2</h2>
                        </NavigationMenuLink>

                        {/* H3 */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md ${editor.isActive('heading', { level: 3 }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H3</div>
                            {/* Dodano: text-[14px], font-medium */}
                            <h3 className="font-Roboto text-[14px] font-medium text-gray-800 leading-tight">Heading 3</h3>
                        </NavigationMenuLink>

                        {/* H4 */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md ${editor.isActive('heading', { level: 4 }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H4</div>
                            {/* Dodano: text-[13px], font-normal */}
                            <h4 className="font-Roboto text-[13px] font-normal text-gray-700 leading-tight">Heading 4</h4>
                        </NavigationMenuLink>

                        {/* H5 */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer w-full p-1.5 rounded-md ${editor.isActive('heading', { level: 5 }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">H5</div>
                            {/* Dodano: text-[12px], font-light */}
                            <h5 className="font-Roboto text-[12px] font-light text-gray-500 leading-tight">Heading 5</h5>
                        </NavigationMenuLink>

                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger className={"font-Roboto text-[13px]"}>Add component</NavigationMenuTrigger>
                    <NavigationMenuContent className={"flex flex-col gap-[2px] w-fit"}>
                        <NavigationMenuLink 
                            className={"font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer"}>
                            Table
                            <div className="font-Roboto text-gray-400 text-[12px]">insert a table object</div>
                            <TableGridPicker editor={editor} maxRows={8} maxCols={8} />
                        </NavigationMenuLink>
                    </NavigationMenuContent>
                </NavigationMenuItem>


                <NavigationMenuItem>
                    <NavigationMenuTrigger className={"font-Roboto text-[13px]"}>Styling</NavigationMenuTrigger>
                    <NavigationMenuContent className={"gap-[2px] grid grid-cols-2 grid-rows-auto p-2"}>
                        
                        {/* BOLD */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleBold().run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer p-1.5 rounded-md ${editor.isActive('bold') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-700">Bold</div>
                            {/* Dodano: font-bold i ciemniejszy kolor dla kontrastu */}
                            <div className="font-Roboto font-bold text-gray-800 text-[12px]">a sample of bold text</div>
                        </NavigationMenuLink>

                        {/* ITALIC */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleItalic().run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer p-1.5 rounded-md ${editor.isActive('italic') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-700">Italic</div>
                            {/* Dodano: italic */}
                            <div className="font-Roboto italic text-gray-500 text-[12px]">a sample of italic text</div>
                        </NavigationMenuLink>

                        {/* STRIKE */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleStrike().run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer p-1.5 rounded-md ${editor.isActive('strike') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-700">Strike</div>
                            {/* Dodano: line-through */}
                            <div className="font-Roboto line-through text-gray-400 text-[12px]">a sample of strike text</div>
                        </NavigationMenuLink>

                        {/* CODE */}
                        <NavigationMenuLink 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => editor.chain().focus().toggleCode().run() } 
                            className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer p-1.5 rounded-md ${editor.isActive('code') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                        >
                            <div className="text-gray-700">Code</div>
                            {/* Dodano: czcionkę monospace, tło i zaokrąglenie by przypominało kod */}
                            <div className="font-mono bg-gray-100 text-red-500 px-1 rounded text-[11px] mt-0.5">a sample of code text</div>
                        </NavigationMenuLink>

                    </NavigationMenuContent>
                </NavigationMenuItem>

            {/* Przycisk od formatowania */}
            <NavigationMenuItem className="border-r-1 pr-1 mr-1 border-gray-200">
                <NavigationMenuTrigger className={"font-Roboto text-[13px]"}>Format</NavigationMenuTrigger>
                {/* Zwiększono w-[320px] na w-[360px], żeby pomieścić 2 równe kolumny po 4 elementy */}
                <NavigationMenuContent className={"gap-1.5 grid grid-cols-2 w-[360px] p-2"}>
                    
                    {/* 5. BULLET LIST (Nowość) */}
                    <NavigationMenuLink 
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={() => editor.chain().focus().toggleBulletList().run() } 
                        className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer p-2 rounded-md transition-colors ${editor.isActive('bulletList') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                    >
                        <div className="text-gray-800 font-medium text-[12px]">Bullet List</div>
                        {/* Przykładowa atrapa listy punktowanej */}
                        <div className="flex flex-col text-[11px] text-gray-500 mt-0.5 pl-1 gap-y-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-gray-400 block" /> First item
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-gray-400 block" /> Second item
                            </div>
                        </div>
                    </NavigationMenuLink>

                    {/* 6. ORDERED LIST (Nowość) */}
                    <NavigationMenuLink 
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={() => editor.chain().focus().toggleOrderedList().run() } 
                        className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer p-2 rounded-md transition-colors ${editor.isActive('orderedList') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                    >
                        <div className="text-gray-800 font-medium text-[12px]">Ordered List</div>
                        {/* Przykładowa atrapa listy numerowanej */}
                        <div className="flex flex-col text-[11px] text-gray-500 mt-0.5 pl-1 gap-y-0.5 font-Roboto">
                            <div>1. First item</div>
                            <div>2. Second item</div>
                        </div>
                    </NavigationMenuLink>

                    {/* 7. BLOCKQUOTE (Nowość) */}
                    <NavigationMenuLink 
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={() => editor.chain().focus().toggleBlockquote().run() } 
                        className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer p-2 rounded-md transition-colors ${editor.isActive('blockquote') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                    >
                        <div className="text-gray-800 font-medium text-[12px]">Blockquote</div>
                        {/* Atrapa bloku cytatu z pionową kreską po lewej */}
                        <div className="border-l-2 border-gray-300 pl-1.5 italic text-gray-400 text-[11px] mt-0.5 font-Roboto">
                            A quoted text...
                        </div>
                    </NavigationMenuLink>

                    {/* 8. HORIZONTAL RULE (Nowość) */}
                    <NavigationMenuLink 
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={() => editor.chain().focus().setHorizontalRule().run() } 
                        className={`font-Roboto text-[13px] flex flex-col gap-[1px] items-start cursor-pointer p-2 rounded-md transition-colors bg-white hover:bg-gray-50`}
                    >
                        <div className="text-gray-800 font-medium text-[12px]">Horizontal Rule</div>
                        {/* Wizualna imitacja linii rozdzielającej sekcje */}
                        <div className="w-full flex flex-col justify-center h-full min-h-[16px]">
                            <hr className="w-[90%] border-t border-gray-300" />
                        </div>
                    </NavigationMenuLink>

                </NavigationMenuContent>
            </NavigationMenuItem >


            <Tooltip>
                <TooltipTrigger>
                    <NavigationMenuItem>
                            <NavigationMenuLink className={`font-Roboto text-[13px] ${editor.isActive('customHighLight') ?  "bg-gray-100 text-gray-800": ""}`}
                                onClick={() => editor.chain().focus().toggleHighLight().run()}>
                                <Highlighter className={`h-5 w-5 stroke-[2] text-gray-600 hover:text-gray-800 cursor-pointer`}/>
                            </NavigationMenuLink>
                    </NavigationMenuItem>
                </TooltipTrigger>
            <TooltipContent>
                <p>Highlight</p>
            </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger>
                    <NavigationMenuItem>
                            <NavigationMenuLink className={"font-Roboto text-[13px]"}>
                                <Link className="h-5 w-5 stroke-[2] text-gray-600 hover:text-gray-800 cursor-pointer"/>
                            </NavigationMenuLink>
                    </NavigationMenuItem>
                </TooltipTrigger>
            <TooltipContent>
                <p>Link</p>
            </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger>
                    <NavigationMenuItem className="border-r-1 pr-1 mr-1 border-gray-200" 
                        onClick={() => fileInputRef.current?.click()}>
                            <NavigationMenuLink className={"font-Roboto text-[13px]"}>
                                <ImagePlus className="h-5 w-5 stroke-[2] text-gray-600 hover:text-gray-800 cursor-pointer"/>
                            </NavigationMenuLink>
                    </NavigationMenuItem>
                </TooltipTrigger>
            <TooltipContent>
                <p>Add Image</p>
            </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger>
                    <NavigationMenuItem>
                            <NavigationMenuLink className={"font-Roboto text-[13px]"}>
                                <Superscript className="h-5 w-5 stroke-[2] text-gray-600 hover:text-gray-800 cursor-pointer"/>
                            </NavigationMenuLink>
                    </NavigationMenuItem>
                </TooltipTrigger>
            <TooltipContent>
                <p>Superscript</p>
            </TooltipContent>
            </Tooltip>


            <Tooltip>
                <TooltipTrigger>
                    <NavigationMenuItem className="border-r-1 pr-1 mr-1 border-gray-200">
                            <NavigationMenuLink className={"font-Roboto text-[13px]"}>
                                <Subscript className="h-5 w-5 stroke-[2] text-gray-600 hover:text-gray-800 cursor-pointer"/>
                            </NavigationMenuLink>
                    </NavigationMenuItem>
                </TooltipTrigger>
            <TooltipContent>
                <p>Subscript</p>
            </TooltipContent>
            </Tooltip>



            {/* Przycisk od pozycjonowania tekstu */}
            {/* Przycisk od pozycjonowania tekstu */}
        <NavigationMenuItem className="border-r border-gray-200 pr-1 mr-1">
            <NavigationMenuTrigger className={"font-Roboto text-[13px]"}>Align Text</NavigationMenuTrigger>
            
            {/* ZMIANA 1: Szare tło (bg-gray-200), gap-[1px], brak paddingu (p-0) i ukrycie wystających rogów (overflow-hidden) */}
            <NavigationMenuContent className={"grid grid-cols-2 w-[360px] bg-gray-200 gap-[1px] p-0 rounded-md overflow-hidden border border-gray-200"}>
                
                {/* 1. ALIGN LEFT */}
                {/* ZMIANA 2: Usunięto rounded-md z kafelków i dodano h-full w-full, p-3 by tworzyły ładne kwadraty */}
                <NavigationMenuLink 
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().setTextAlign('left').run() } 
                    className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer p-3 w-full h-full transition-colors 
                        ${editor.isActive('textAlign', { align: 'left' }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"} rounded-none! `}
                >
                    <div className="flex items-center gap-2 text-gray-800 font-medium text-[12px]">
                        <span>Align Left</span>
                       <TextAlignStart className="w-3.5 h-3.5" />                        
                    </div>
                    <div className="w-full flex flex-col gap-y-1 mt-2 text-left pl-5">
                        <div className="w-[85%] h-1 bg-gray-400 rounded-sm" />
                        <div className="w-[60%] h-1 bg-gray-300 rounded-sm" />
                    </div>
                </NavigationMenuLink>

                {/* 2. ALIGN CENTER */}
                <NavigationMenuLink 
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().setTextAlign('center').run() } 
                    className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer p-3 w-full h-full transition-colors 
                        ${editor.isActive('textAlign', { align: 'center' }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"} rounded-none! `}
                >
                    <div className="flex items-center gap-2 text-gray-800 font-medium text-[12px]">
                        <span>Align Center</span>
                        <TextAlignCenter className="w-3.5 h-3.5" />                    
                    </div>
                    <div className="w-full flex flex-col gap-y-1 mt-2 items-center pr-2">
                        <div className="w-[75%] h-1 bg-gray-400 rounded-sm" />
                        <div className="w-[50%] h-1 bg-gray-300 rounded-sm" />
                    </div>
                </NavigationMenuLink>

                {/* 3. ALIGN RIGHT */}
                <NavigationMenuLink 
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().setTextAlign('right').run() } 
                    className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-end cursor-pointer p-3 w-full h-full transition-colors 
                        ${editor.isActive('textAlign', { align: 'right' }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"} rounded-none! `}
                >
                    <div className="flex items-center gap-2 text-gray-800 font-medium text-[12px] w-full justify-start">
                        <span>Align Right</span>
                        <TextAlignEnd className="w-3.5 h-3.5" />                        
                    </div>
                    <div className="w-full flex flex-col gap-y-1 mt-2 items-end pr-2">
                        <div className="w-[85%] h-1 bg-gray-400 rounded-sm" />
                        <div className="w-[60%] h-1 bg-gray-300 rounded-sm" />
                    </div>
                </NavigationMenuLink>

                {/* 4. ALIGN JUSTIFY */}
                <NavigationMenuLink 
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().setTextAlign('justify').run() } 
                    className={`font-Roboto text-[13px] flex flex-col gap-[2px] items-start cursor-pointer p-3 w-full h-full transition-colors 
                        ${editor.isActive('textAlign', { align: 'justify' }) ? "bg-gray-100" : "bg-white hover:bg-gray-50"} rounded-none! `}
                >
                    <div className="flex items-center gap-2 text-gray-800 font-medium text-[12px]">
                        <span>Align Justify</span>
                        <TextAlignJustify className="w-3.5 h-3.5" />                        
                    </div>
                    <div className="w-full flex flex-col gap-y-1 mt-2 pl-5">
                        <div className="w-[85%] h-1 bg-gray-400 rounded-sm" />
                        <div className="w-[85%] h-1 bg-gray-300 rounded-sm" />
                    </div>
                </NavigationMenuLink>

            </NavigationMenuContent>
        </NavigationMenuItem>





            </NavigationMenuList>
        </NavigationMenu>
    </div>
    
        {/* <button
        onClick={() => editor.chain().focus().toggleHighLight().run()}
        className={`px-3 py-1 text-sm rounded border transition-colors ${
            editor.isActive('customHighlight') 
            ? 'bg-yellow-200 border-yellow-400 font-bold' 
            : 'bg-white hover:bg-gray-100'
        }`}
        >
        🖊️ Zakreślacz
        </button> */}
    </>)
}