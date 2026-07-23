import { Editor, enter } from "@tiptap/core"
import { Kbd } from "@/components/ui/kbd"
import { useEffect, useState } from "react"

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar"
import { Dialog, DialogContent, DialogFooter, DialogClose, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { Bold, Italic, Underline, Link, Code, MessageCircleMore, Command, Sparkles
     ,Highlighter, TextAlignStart, TextAlignCenter, TextAlignEnd, TextAlignJustify, Type, ChevronDown, 
     List,
     Image,
     MessageSquarePlus,
     Smile,
     BookOpen,
     ListChecks,
     Signature,
     MessageSquare,
     StickyNote} from "lucide-react"
import { FontFamily, TextStyle } from "@tiptap/extension-text-style"
import { ColorPickerMenu } from "./ColorPickerMenu"


type BubbleMenuTextProps = {
    editor: Editor,
    onGenerateWithAiClick: () => void
    onAskAiClick: () => void
}


export default function BubbleMenuText({ editor, onGenerateWithAiClick, onAskAiClick} : BubbleMenuTextProps) {

    const [, setCounter] = useState(0)
    const [fontSize, setFontSize] = useState<number>(14)
    const [inputValue, setInputValue] = useState<number>(fontSize)


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

    const getActiveFont = () => {
        if (editor.isActive('textStyle', { fontFamily: 'Inter'})) return 'Inter'
        if (editor.isActive('textStyle', { fontFamily: 'Geist'})) return 'Geist'
        if (editor.isActive('textStyle', { fontFamily: 'Roboto'})) return 'Roboto'
        if (editor.isActive('textStyle', { fontFamily: 'Ubuntu'})) return 'Ubuntu'
        if (editor.isActive('textStyle', { fontFamily: 'Comic Neue'})) return 'Comic Neue'
        if (editor.isActive('textStyle', { fontFamily: 'Noto Sans Korean'})) return 'Noto Sans Korean'
        if (editor.isActive('textStyle', { fontFamily: 'Montserrat'})) return 'Montserrat'
        if (editor.isActive('textStyle', { fontFamily: 'Quicksand'})) return 'Quicksand'
        return 
    }

    useEffect(() => {
        setInputValue(fontSize)
    }, [fontSize])


    useEffect(() => {
        if (!editor) return;

        if (fontSize < 6) {
            setFontSize(6)
        }
        const fontSizeWithPixels = String(fontSize).includes("px") ? String(fontSize) : `${fontSize}px`
        editor.chain().focus().setFontSize(fontSizeWithPixels).run()
        console.log("wykonuje sie zamiana czcionki: ", fontSizeWithPixels);
        
    }, [fontSize, editor])





    return (<>

        <Menubar className="h-[46px] px-3 bg-white border border-gray-200 rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.06)] flex items-center gap-1.5">

            {/* ==================== FONT FAMILY ==================== */}
            <MenubarMenu>
                {/* Zauważ klasę 'border border-gray-200' - to tworzy ten "przycisk w przycisku" ze zdjęcia */}
                <MenubarTrigger 
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 h-[30px] border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer data-[state=open]:bg-gray-50"
                >
                    <div className="flex items-center gap-1.5">
                        <Signature className="w-4 h-4 stroke-[1.5] text-gray-500" />
                        <span className="text-[13px] font-medium leading-none">{getActiveFont() || 'Inter'}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </MenubarTrigger>
                
                <MenubarContent className="min-w-[140px] p-1 bg-white border border-gray-200 shadow-lg rounded-xl">

                    {/* -------- CZCIONKI -------- */}
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Inter'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Inter").run()
                    }}>
                        Inter
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Roboto'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Roboto").run()
                    }}>
                        Roboto
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Geist'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Geist").run()
                    }}>
                        Geist
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Montserrat'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Montserrat").run()
                    }}>
                        Montserrat
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Noto Sans Korean'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Noto Sans Koreanst").run()
                    }}>
                        Noto Sans Korean
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Ubuntu'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Ubuntu").run()
                    }}>
                        Ubuntu
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Quicksand'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Quicksand").run()
                    }}>
                        Quicksand
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Manrope'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Manrope").run()
                    }}>
                        Manrope
                    </MenubarItem>
                    <MenubarItem className="text-[13px] rounded-md cursor-pointer" style={{ fontFamily: 'Comic Neue'}} onClick={() => {
                        editor.chain().focus().setFontFamily("Comic Neue").run()
                    }}>
                        Comic Neue
                    </MenubarItem>                                                                            


                </MenubarContent>
            </MenubarMenu>

            {/* ==================== FONT SIZE ==================== */}
            <MenubarMenu>
                <MenubarTrigger 
                    className="flex items-center justify-between gap-2 pr-2.5 py-0.5 h-[30px] border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer data-[state=open]:bg-gray-50 ml-0.5"
                >
                    <input 
                        className="text-[13px] py-1 px-1 max-w-[50px] font-medium leading-none" 
                        value={`${inputValue}`} 
                        onKeyDown={(e) => {
                            if(e.key === "Enter") {
                                e.preventDefault()

                                let finalFontSize = Number(inputValue)

                                if(isNaN(finalFontSize) || finalFontSize <= 0) {
                                    setInputValue(fontSize)
                                    return
                                }

                                if( finalFontSize >= 100) {
                                    finalFontSize = 100
                                }

                                setFontSize(finalFontSize);
                                (e.target as HTMLInputElement).blur();

                            }
                        }}
                        onChange={(e) => {
                            e.preventDefault()
                            setInputValue(Number(e.target.value))
                        }}/>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" onMouseDown={(e) => e.preventDefault()}/>
                </MenubarTrigger>
                
                <MenubarContent className="min-w-[80px] max-h-[285px] p-1 bg-white border border-gray-200 shadow-lg rounded-xl 
                    [&::-webkit-scrollbar]:w-[5px]
                    [&::-webkit-scrollbar]:h-[5px]
                    [&::-webkit-scrollbar-track]:bg-gray-100
                    [&::-webkit-scrollbar-thumb]:bg-gray-300
                    [&::-webkit-scrollbar-thumb]:rounded-[4px]">
                    {/* Opcje rozmiarów */}
                    {Array.from({ length: 50}).map((_, i) => {
                        if (i < 3) return
                        return <MenubarItem key={i} onClick={() => setFontSize(i*2)} className="text-[13px] rounded-md cursor-pointer">{`${i*2}px`}</MenubarItem>
                    })}
                </MenubarContent>
            </MenubarMenu>

            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== FORMATOWANIE (B, I, U) ==================== */}
            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleBold().run() } 
                    className={`w-[30px] h-[30px] rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                        editor.isActive('bold') ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
                        editor.isActive('italic') ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
                        editor.isActive('underline') ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                    <Underline className="w-[17px] h-[17px] stroke-[2]"/>
                </MenubarTrigger>
            </MenubarMenu>

            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== KOLOR (Kropka ze zdjęcia) ==================== */}
            <ColorPickerMenu editor={editor}/>
            {/* <MenubarMenu>
                <MenubarTrigger 
                    className="w-[30px] h-[30px] rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="w-[18px] h-[18px] bg-gray-900 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                </MenubarTrigger>

                <MenubarContent className="p-2 bg-white border border-gray-200 shadow-lg rounded-xl">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-1">Text Color</div>
                    <div className="grid grid-cols-5 gap-1.5">
                        
                        <div className="w-6 h-6 rounded-md bg-red-500 cursor-pointer hover:ring-2 ring-red-200 ring-offset-1"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().setColor("oklch(63.7% 0.237 25.331)").run()}
                        />
                        
                        <div className="w-6 h-6 rounded-md bg-blue-500 cursor-pointer hover:ring-2 ring-blue-200 ring-offset-1"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().setColor("oklch(62.3% 0.214 259.815)").run()}
                        />                        
                        
                        <div className="w-6 h-6 rounded-md bg-green-500 cursor-pointer hover:ring-2 ring-green-200 ring-offset-1"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().setColor("green")}
                        />                        
                        
                        <div className="w-6 h-6 rounded-md bg-yellow-500 cursor-pointer hover:ring-2 ring-yellow-200 ring-offset-1"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().setColor("yellow")} 
                        />                        
                        
                        <div className="w-6 h-6 rounded-md bg-gray-900 cursor-pointer hover:ring-2 ring-gray-200 ring-offset-1"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => editor.chain().focus().setColor("gray")} 
                        />                        
                    </div>
                </MenubarContent>

            </MenubarMenu> */}

            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== ADDING A STICKY NOTE ==================== */}
            <MenubarMenu>
                <MenubarTrigger className="w-fit gap-1 h-[30px] rounded-md flex items-center justify-center cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                    <StickyNote className="w-[17px] h-[17px] text-yellow-500 stroke-[1.5]"/>
                    <span>Sticky note</span>
                </MenubarTrigger>
            </MenubarMenu>


            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== MEDIA (Link, Image) ==================== */}
            <MenubarMenu>
                <MenubarTrigger className={`w-[30px] h-[30px] rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                    editor.isActive('link') ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}>
                    <Link className="w-[17px] h-[17px] stroke-[1.5]"/>
                </MenubarTrigger>
            </MenubarMenu>


            <MenubarMenu>
                <MenubarTrigger 
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center justify-center cursor-pointer w-fit h-[30px]"
                >
                    <Type className="w-[17px] h-[17px] stroke-[1.5] text-gray-700 "/>
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

            {/* SEPARATOR */}
            <div className="w-[1px] h-4 bg-gray-200 mx-1.5 shrink-0" />

            {/* ==================== AI DROPDOWN (Sparkle) ==================== */}
            <MenubarMenu>
                <MenubarTrigger className="w-fit h-[30px] rounded-md flex items-center justify-center cursor-pointer text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors group data-[state=open]:text-blue-600 data-[state=open]:bg-blue-50">
                    <Sparkles className="w-[17px] h-[17px] stroke-[1.5] group-hover:animate-pulse"/>
                    <ChevronDown className="h-3 w-3 text-gray-500 ml-1" />
                </MenubarTrigger>
                
                <MenubarContent className="w-[220px] p-1.5 bg-white border border-gray-200 shadow-xl rounded-xl" align="end" sideOffset={8}>
                    <MenubarGroup>
                        <MenubarItem className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-blue-50 group" onClick={onGenerateWithAiClick}>
                            <Sparkles className="w-4 h-4 text-blue-500 stroke-[2]"/>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-gray-800 group-hover:text-blue-700">Generate with Notium</span>
                            </div>
                        </MenubarItem>
                        <MenubarItem className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-blue-50 group"  onClick={onAskAiClick}>
                            <MessageSquarePlus className="w-4 h-4 text-blue-500 stroke-[2]"/>
                            <span className="text-[13px] font-medium text-gray-800 group-hover:text-blue-700">Ask Notium</span>
                        </MenubarItem>
                    </MenubarGroup>

                    <MenubarSeparator className="h-px bg-gray-100 my-1.5 mx-2" />

                    <MenubarGroup>
                        <div className="px-2 py-1 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</div>
                        
                        <MenubarItem className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600">
                            <Smile className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Emojify text</span>
                        </MenubarItem>
                        
                        <MenubarItem className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600">
                            <BookOpen className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Explain text</span>
                        </MenubarItem>

                        <MenubarItem className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600">
                            <ListChecks className="w-4 h-4 stroke-[1.5]"/>
                            <span className="text-[13px]">Summarize</span>
                        </MenubarItem>
                    </MenubarGroup>
                </MenubarContent>
            </MenubarMenu>

        </Menubar>


    </>)
}