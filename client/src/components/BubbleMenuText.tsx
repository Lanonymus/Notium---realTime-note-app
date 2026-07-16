import { Editor } from "@tiptap/core"
import { Kbd } from "@/components/ui/kbd"
import { useEffect, useState } from "react"

import { Menubar, MenubarContent, MenubarGroup, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar"
import { Dialog, DialogContent, DialogFooter, DialogClose, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { Bold, Italic, Underline, Link, Code, MessageCircleMore, Command, Sparkles
     ,Highlighter, TextAlignStart, TextAlignCenter, TextAlignEnd, TextAlignJustify, Type, ChevronDown } from "lucide-react"




export default function BubbleMenuText({ editor, onAiAskClick} : { editor: Editor, onAiAskClick: () => void }) {
    const [, setCounter] = useState(0)
    const [isDialogOpen, setIsDialogOpen] = useState(false)


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



    return (<>
        <Menubar className={"bg-white shadow-md shadow-gray-200"}>

            <MenubarMenu>
                <MenubarTrigger 
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center justify-center cursor-pointer"
                >
                    <Type className="h-5 w-4 stroke-[1.5] text-gray-700 "/>
                    <ChevronDown className="h-3 w-3 text-gray-500 ml-1" />
                </MenubarTrigger>
                
                <MenubarContent className="w-[190px] p-1 bg-white border border-gray-200 shadow-md rounded-md">
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

            {/* Separator linia szara w prawo */}
            <div className="border-r-1 h-full w-[2px] pr-1 mr-1 border-gray-200"/>

            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleBold().run() } 
                    className={`flex items-center cursor-pointer ${editor.isActive('bold') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                >
                    <Bold className="h-5 w-4 stroke-[1.5] text-gray-700 "/>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleItalic().run() } 
                    className={`flex items-center cursor-pointer ${editor.isActive('italic') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                >
                    <Italic className="h-5 w-4 stroke-[1.5] text-gray-700 "/>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger
                    onMouseDown={(e) => e.preventDefault()} 
                    onClick={() => editor.chain().focus().toggleUnderline().run() } 
                    className={`flex items-center cursor-pointer ${editor.isActive('underline') ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                >
                    <Underline className="h-5 w-4 stroke-[1.5] text-gray-700 "/>
                </MenubarTrigger>
            </MenubarMenu>

        <MenubarMenu>
            {/* Trigger wywołuje tylko zmianę stanu, nie trzyma okna w sobie */}
            <MenubarTrigger
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => {
                if (editor.isActive('link')) {
                    editor.chain().focus().unsetLink().run();
                } else {
                    setIsDialogOpen(true);
                }
                }} 
                className={`flex items-center cursor-pointer ${
                editor.isActive('link') ? "bg-gray-100" : "bg-white hover:bg-gray-50"
                }`}
            >
                <Link className="h-5 w-4 stroke-[1.5] text-gray-700 "/>
            </MenubarTrigger>

            {/* Dialog umieszczamy jako osobny element w strukturze */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} >
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[15px]!">Add Link</DialogTitle>
                    <DialogDescription className="text-[13px]!">
                    Copy and paste the link you want to add to the selected text.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-center gap-2">
                    <div className="grid flex-1 gap-2">
                    <Label htmlFor="link" className="sr-only text-[14px]!">
                        Link
                    </Label>
                    <Input
                        id="link"
                        defaultValue="https://example.com"
                        
                        // Tutaj w przyszłości podepniesz stan, np. value={linkUrl}
                    />
                    </div>
                </div>

                <DialogFooter className="sm:justify-end py-3">
                    {/* Przycisk Zatwierdź/Zapisz link */}
                    <Button 
                    type="button" 
                    className="text-[12px] px-5"
                    onClick={() => {
                        const inputEl = document.getElementById('link') as HTMLInputElement;
                        if (inputEl && inputEl.value.trim() !== '') {
                        editor.chain().focus().setLink({ href: inputEl.value }).run();
                        }
                        setIsDialogOpen(false);
                    }}
                    >
                    Add
                    </Button>

                </DialogFooter>
                </DialogContent>
            </Dialog>
        </MenubarMenu>

            {/* Separator linia szara w prawo */}
            <div className="border-r-1 h-full w-[2px] pr-1 mr-1 border-gray-200"/>


            <MenubarMenu>
                <MenubarTrigger className="flex items-center justify-center gap-[5px]">
                    <MessageCircleMore className="h-5 w-4 stroke-[1.5] text-gray-700 "/>
                    <div className="text-gray-600 font-normal text-[12px]">add comment</div>
                </MenubarTrigger>
            </MenubarMenu>

            {/* Separator linia szara w prawo */}
            <div className="border-r-1 h-full w-[2px] pr-1 mr-1 border-gray-200"/>

            <MenubarMenu>
                <MenubarTrigger 
                    className="flex items-center justify-center gap-[5px]"
                    onClick={onAiAskClick}
                >
                    <Sparkles className="h-5 w-4 stroke-[2] text-blue-700 "/>
                    <div className="text-gray-600 font-medium text-[12px]">Ask Notium</div>
                </MenubarTrigger>
            </MenubarMenu>

        </Menubar>
    </>)
}