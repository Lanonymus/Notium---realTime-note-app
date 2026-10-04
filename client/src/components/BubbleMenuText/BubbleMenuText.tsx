import { Editor, enter } from "@tiptap/core"
import { Kbd } from "@/components/ui/kbd"
import { useEffect, useState } from "react"

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar"
import { Dialog, DialogContent, DialogFooter, DialogClose, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { Bold, Italic, Underline, Link, Code, MessageCircleMore, Command, Sparkles, Highlighter, TextAlignStart, TextAlignCenter, TextAlignEnd,
     TextAlignJustify, Type, ChevronDown, List, Image, MessageSquarePlus, Smile, BookOpen, ListChecks,Signature, MessageSquare, StickyNote, Link2,
     Lightbulb,
     Feather,
     PencilSparkles
} from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"


import { ColorPickerPopover } from "../Toolbar/ColorPickerPopover";
import { getHexWithOpacity } from "../Toolbar/getHexWithOpacity";
import { LinkDialog } from "./LinkDialog";


type BubbleMenuTextProps = {
    editor: Editor,
    onGenerateWithAiClick: (action: string | null) => void
    onAskAiClick: () => void,
    onOpenHighlighterPicker: () => void,
    onCloseHighlighterPicker: () => void

}


export default function BubbleMenuText({ editor, onGenerateWithAiClick, onAskAiClick, onOpenHighlighterPicker, onCloseHighlighterPicker} : BubbleMenuTextProps) {

    const [, setCounter] = useState(0)
    const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState<boolean>(false)    
    const [selectedHighlight, setSelectedHighlight] = useState<string>('#fef08a')
    const DEFAULT_HIGHLIGHT = "#fef08a"    


    useEffect(() => {
        if(!editor) return

        const handleUpdate = () => {
            setCounter((prev) => prev + 1)
        }

        editor.on("transaction", handleUpdate)

        return () => {
            editor.off("transaction", handleUpdate)
        }
    }, [editor])

    // Pobieranie aktualnego hightligha albo default jest nie ma
    const getCurrentHighlight = () => {
        if(!editor) return DEFAULT_HIGHLIGHT

        const highlight = editor.getAttributes("customHighLight").color   
        // console.log("highlight: ", highlight);     
        return highlight || DEFAULT_HIGHLIGHT   
    }
    
    
    useEffect(() => {
        if(!editor) return

        const handleSelectionChange = () => {
            
            // aktualizacja highlighta
            const activeHighlight = getCurrentHighlight()
            setSelectedHighlight(activeHighlight)
        }

        editor.on("selectionUpdate", handleSelectionChange)
        editor.on("transaction", handleSelectionChange)

        return () => {
            editor.off("selectionUpdate", handleSelectionChange)
            editor.off("transaction", handleSelectionChange)
        }
    }, [editor])    

    useEffect(() => {
        if(isHighlightPickerOpen) {
            onOpenHighlighterPicker()
        } else {
            onCloseHighlighterPicker()
        }
    },[editor, isHighlightPickerOpen])



    return (<>

        <Menubar className="!bg-white border border-gray-200 rounded-[8px] shadow-[1px_1px_1px_rgba(0,0,0,0.1)] flex items-center gap-1.5 py-5 px-1">


            <MenubarMenu>
                <MenubarTrigger 
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center justify-center cursor-pointer w-fit h-[30px]"
                >
                    <Type className="w-[17px] h-[17px] stroke-[2] text-gray-900 "/>
                    <ChevronDown className="h-3 w-3 text-gray-500 ml-1" />
                </MenubarTrigger>
                
                <MenubarContent className="w-[220px] p-1.5 bg-white border-1 border-gray-200 shadow-xl rounded-xl" align="end" sideOffset={8}>
                    <MenubarGroup>
                        {/* PARAGRAPH */}
                        <MenubarItem 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor?.chain().focus().setParagraph().run()}
                            className={`flex items-center justify-between p-2 rounded-sm font-Roboto text-[13px] text-gray-700 cursor-pointer ${
                                editor?.isActive('paragraph') ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                            }`}
                        >
                            <span>Paragraph</span>
                            <MenubarShortcut className="text-[13px] text-gray-400 font-mono flex gap-[1px] justify-center items-center">
                                <Kbd className="text-[10px]">
                                    <Command className="w-[13px]! h-[13px]!"/>
                                </Kbd>
                                <span>+</span>
                                <Kbd className="text-[12px]">P</Kbd>
                            </MenubarShortcut>
                        </MenubarItem>
                    </MenubarGroup>

                    <MenubarSeparator className="h-[1px] bg-gray-200 my-1" />

                    <MenubarGroup className="flex flex-col gap-[2px]">
                        {/* HEADING 1 */}
                        <MenubarItem 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={`flex items-center justify-between p-2 rounded-sm font-Roboto text-lg font-bold text-gray-900 cursor-pointer ${
                                editor?.isActive('heading', { level: 1 }) ? "bg-gray-100" : "hover:bg-gray-50"
                            }`}
                        >
                            <span>Heading 1</span>
                            <MenubarShortcut className="text-[13px] text-gray-400 font-mono flex gap-[1px] justify-center items-center">
                                <Kbd className="text-[10px]">
                                    <Command className="w-[13px]! h-[13px]!"/>
                                </Kbd>
                                <span>+</span>
                                <Kbd className="text-[12px]">1</Kbd>
                            </MenubarShortcut>
                        </MenubarItem>

                        {/* HEADING 2 */}
                        <MenubarItem 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`flex items-center justify-between p-2 rounded-sm font-Roboto text-base font-semibold text-gray-800 cursor-pointer ${
                                editor?.isActive('heading', { level: 2 }) ? "bg-gray-100" : "hover:bg-gray-50"
                            }`}
                        >
                            <span>Heading 2</span>
                            <MenubarShortcut className="text-[13px] text-gray-400 font-mono flex gap-[1px] justify-center items-center">
                                <Kbd className="text-[10px]">
                                    <Command className="w-[13px]! h-[13px]!"/>
                                </Kbd>
                                <span>+</span>
                                <Kbd className="text-[12px]">2</Kbd>
                            </MenubarShortcut>
                        </MenubarItem>

                        {/* HEADING 3 */}
                        <MenubarItem 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`flex items-center justify-between p-2 rounded-sm font-Roboto text-[14px] font-medium text-gray-700 cursor-pointer ${
                                editor?.isActive('heading', { level: 3 }) ? "bg-gray-100" : "hover:bg-gray-50"
                            }`}
                        >
                            <span>Heading 3</span>
                            <MenubarShortcut className="text-[13px] text-gray-400 font-mono flex gap-[1px] justify-center items-center">
                                <Kbd className="text-[10px]">
                                    <Command className="w-[13px]! h-[13px]!"/>
                                </Kbd>
                                <span>+</span>
                                <Kbd className="text-[12px]">3</Kbd>
                            </MenubarShortcut>
                        </MenubarItem>
                    </MenubarGroup>

                    <MenubarSeparator className="h-[1px] bg-gray-200 my-1" />

                        <MenubarGroup>
                            {/* BLOCKQUOTE */}
                            <MenubarItem 
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                className={`flex items-center justify-between p-2 rounded-sm font-Roboto text-[13px] text-gray-600 italic cursor-pointer ${
                                    editor?.isActive('blockquote') ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                }`}
                            >
                                <span className="border-l-2 border-gray-400 pl-2">blockquote</span>
                                <MenubarShortcut className="text-[13px] text-gray-400 font-mono flex gap-[1px] justify-center items-center">
                                    <Kbd className="text-[10px]">
                                        <Command className="w-[13px]! h-[13px]!"/>
                                    </Kbd>
                                    <span>+</span>
                                    <Kbd className="text-[12px]">Q</Kbd>
                                </MenubarShortcut>
                            </MenubarItem>
                        </MenubarGroup>
                    </MenubarContent>
            </MenubarMenu>

            {/* ==================== FORMATOWANIE (B, I, U) ==================== */}
            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleBold().run() } 
                    className={`w-[30px] h-[30px] rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                        editor.isActive('bold') ? "bg-gray-100 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                    <Bold className="w-[17px] h-[17px] stroke-[2]"/>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleItalic().run() } 
                    className={`w-[30px] h-[30px] rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                        editor.isActive('italic') ? "bg-gray-100 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                    <Italic className="w-[17px] h-[17px] stroke-[2]"/>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleUnderline().run() } 
                    className={`w-[30px] h-[30px] rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                        editor.isActive('underline') ? "bg-gray-100 text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                    <Underline className="w-[17px] h-[17px] stroke-[2]"/>
                </MenubarTrigger>
            </MenubarMenu>

            {/* ==================== MEDIA (Link, Image) ==================== */}
            <LinkDialog editor={editor} />

                    



            {/* HIGHLIGHT */}
            <Popover open={isHighlightPickerOpen} onOpenChange={setIsHighlightPickerOpen}>
                    <PopoverTrigger 
                            onMouseDown={(e) => e.preventDefault()}
                            style={{ 
                                // Zwiększone krycie tła do 35% oraz delikatne obramowanie
                                backgroundColor: editor.isActive("customHighLight") 
                                    ? getHexWithOpacity(selectedHighlight, 35) 
                                    : "transparent",
                                borderColor: editor.isActive("customHighLight") 
                                    ? getHexWithOpacity(selectedHighlight, 70) 
                                    : "transparent"}}
                            
                            className="p-1.5 rounded-[8px] transition-all cursor-pointer text-gray-700 hover:bg-gray-100
                                flex flex-col items-center justify-center border"
                        >  
                            <Highlighter className="h-4 w-4 stroke-[2]" />

                            {/* Wskaźnik wybranego koloru pod ikonką */}
                            <div 
                                className="w-5 h-[3px] rounded-full mt-0.5 shadow-xs" 
                                style={{ backgroundColor: selectedHighlight }} 
                            />                              
                    </PopoverTrigger>

                <ColorPickerPopover 
                    editor={editor} 
                    setSelectedHighlightToolBar={(color: string) => setSelectedHighlight(color)} 
                    onClose={() => setIsHighlightPickerOpen(false)}
                    side={'top'}
                    sideOffset={8}
                    align={'start'}
                />
            </Popover>

            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== ADDING A STICKY NOTE ==================== */}
            <MenubarMenu>
                <MenubarTrigger className="w-fit gap-1 h-[30px] rounded-md flex items-center justify-center cursor-pointer border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <StickyNote className="w-[17px] h-[17px] text-yellow-500 stroke-[1.5]"/>
                    <span>Sticky note</span>
                </MenubarTrigger>
            </MenubarMenu>


            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== AI DROPDOWN (Sparkle) ==================== */}
            <MenubarMenu>
                <MenubarTrigger className="w-fit h-[30px] gap-1 rounded-md flex items-center justify-center cursor-pointer  hover:text-blue-600 hover:bg-blue-50 transition-colors group data-[state=open]:text-blue-600 data-[state=open]:bg-blue-50">
                    <Sparkles className="w-[17px] h-[17px] stroke-[1.5] group-hover:animate-pulse text-blue-600"/>
                    <span className="text-gray-700 ">Notium</span>
                    <ChevronDown className="h-3 w-3 text-gray-700 ml-1" />
                </MenubarTrigger>
                
                <MenubarContent className="w-[220px] p-1.5 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" sideOffset={8}>
                    <MenubarGroup>
                        
                        {/* Zwykłe generowanie kontentu */}
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-blue-50 group" 
                            onClick={() => onGenerateWithAiClick(null)}
                        >
                            <Sparkles className="w-4 h-4 text-blue-500 stroke-[2]"/>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-gray-800 group-hover:text-blue-700">Generate with Notium</span>
                            </div>
                        </MenubarItem>

                        {/* Pytanie kontekstowe do chata */}
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-blue-50 group"  
                            onClick={onAskAiClick}
                        >
                            <MessageSquarePlus className="w-4 h-4 text-blue-500 stroke-[2]"/>
                            <span className="text-[13px] font-medium text-gray-800 group-hover:text-blue-700">Ask Notium</span>
                        </MenubarItem>
                    </MenubarGroup>

                    <MenubarSeparator className="h-px bg-gray-100 my-1.5 mx-2" />

                    <MenubarGroup>
                        <div className="px-2 py-1 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</div>
                        
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600"
                            onClick={() => onGenerateWithAiClick("simplify")}
                        >
                            <PencilSparkles className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Simplify</span>
                        </MenubarItem>             


                        {/* Generowanie tekstu z emotkami */}
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600"
                            onClick={() => onGenerateWithAiClick("emojify")}
                        >
                            <Smile className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Emojify text</span>
                        </MenubarItem>
                        
                        {/* Generowanie dłuższego / lepiej wytłumaczonego fragmentu tekstu */}
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600"
                            onClick={() => onGenerateWithAiClick("explain")}
                        >
                            <BookOpen className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Explain better</span>
                        </MenubarItem>

                        {/* Generowanie krótszego / bardziej zwięzłęgo i merytorycznego tekstu */}
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600"
                            onClick={() => onGenerateWithAiClick("summarize")}
                        >
                            <ListChecks className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Summarize</span>
                        </MenubarItem>

                        {/* Generowanie krótszego / bardziej zwięzłęgo i merytorycznego tekstu */}
                        <MenubarItem 
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600"
                            onClick={() => onGenerateWithAiClick("example")}
                        >
                            <Lightbulb className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Real-World Example</span>
                        </MenubarItem>


                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>

        </Menubar>


    </>)
}