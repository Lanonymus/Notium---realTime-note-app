import { useEffect, useState, useCallback, use } from "react"
import { Editor } from "@tiptap/react"
import { Plus, TextAlignStart, TextAlignCenter, TextAlignEnd, Baseline
  ,GripHorizontal, GripVertical, Ellipsis, PaintBucket, ScanText, Eraser, Copy, Clipboard, Link, Sparkles, Trash, Delete  } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { changeAllTextAlignment, changeTableBackground, changeTableTextColor, clearTableContents, copyTableToClipboard, duplicateTable } from "./HelperFunctions/AdvancedTableFunctions"




type TableControlsProps = {
  editor: Editor
}

export default function AdvancedTableControls({ editor }: TableControlsProps) {
  const [visible, setVisible] = useState(false)
  
  // Przechowujemy koordynaty (top, left) dla wszystkich 4 elementów
  const [colGrip, setColGrip] = useState({ top: 0, left: 0 })
  const [rowGrip, setRowGrip] = useState({ top: 0, left: 0 })
  const [rightPlus, setRightPlus] = useState({ top: 0, left: 0 })
  const [bottomPlus, setBottomPlus] = useState({ top: 0, left: 0 })
  const [settingsPos, setSettingsPos] = useState({ top: 0, left: 0})
  const [tableRECT , setTableRECT] = useState<{ top: number, left: number, width: number, height: number}>({ top: 0, left: 0, width: 0, height: 0})
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)


  const updateControls = useCallback(() => {
    if (!editor || !editor.isActive("table")) {
      setVisible(false)
      return
    }

    const { view, state } = editor
    const { from } = state.selection

    // 1. Znajdujemy fizyczny element DOM, w którym jest kursor
    const domAtPos = view.domAtPos(from).node as HTMLElement
    // Zabezpieczenie na wypadek węzłów tekstowych
    const element = domAtPos?.nodeType === 3 ? domAtPos.parentElement : domAtPos
    
    const activeCell = element?.closest("td, th") as HTMLElement
    const activeTable = activeCell?.closest("table")

    if (activeCell && activeTable) {
      // 2. Pobieramy wymiary komórki, tabeli i głównego kontenera edytora
      const cellRect = activeCell.getBoundingClientRect()
      const tableRect = activeTable.getBoundingClientRect()

      setTableRECT({ 
        top: tableRect.top,
        left: tableRect.left,
        width: tableRect.width,
        height: tableRect.height,
      })
      
      // parentElement to nasz div z klasą 'relative' otaczający edytor
      const containerRect = view.dom.parentElement!.getBoundingClientRect()

      // 3. Obliczamy pozycje względem kontenera (relative)
      // Odejmujemy containerRect.top/left, by pozycjonowanie działało poprawnie podczas scrollowania

      // GÓRNY UCHWYT (Kolumna) - na środku szerokości komórki, nad tabelą
      setColGrip({
        top: tableRect.top - containerRect.top - 10, // 20px nad tabelą
        left: cellRect.left - containerRect.left + (cellRect.width / 2) + 24, // -12 to połowa szerokości przycisku
      })

      // LEWY UCHWYT (Wiersz) - na środku wysokości komórki, po lewej stronie tabeli
      setRowGrip({
        top: cellRect.top - containerRect.top + (cellRect.height / 2) ,
        left: tableRect.left - containerRect.left + 18,
      })

      // PRAWY PLUS (Dodaj kolumnę na końcu) - na środku wysokości tabeli, po prawej stronie
      setRightPlus({
        top: tableRect.top - containerRect.top + 12, // 8px odstępu od dolnej krawędzi
        left: tableRect.left - containerRect.left + tableRect.width + 45, // 8px odstępu od prawej krawędzi
      })

      // DOLNY PLUS (Dodaj wiersz na końcu) - na środku szerokości tabeli, pod tabelą
      setBottomPlus({
        top: tableRect.top - containerRect.top + tableRect.height + 18,
        left: tableRect.left - containerRect.left + 40,
      })

      // Ustawianie pozycji ustawień tabeli
      setSettingsPos({
        top: tableRect.top - containerRect.top - 2,
        left: tableRect.left - containerRect.left + 40 + 1
      })

      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [editor])




  // Nasłuchujemy na zmiany zaznaczenia i aktualizacje dokumentu (np. wpisywanie tekstu rozszerza tabelę)
  useEffect(() => {
    editor.on("selectionUpdate", updateControls)
    editor.on("update", updateControls)
    
    // Opcjonalnie: nasłuchuj na scroll wewnątrz edytora, by ukryć/zaktualizować gripy
    const container = editor.view.dom.parentElement
    if (container) {
      container.addEventListener("scroll", updateControls)
    }

    return () => {
      editor.off("selectionUpdate", updateControls)
      editor.off("update", updateControls)
      if (container) {
        container.removeEventListener("scroll", updateControls)
      }
    }
  }, [editor, updateControls])

  if (!visible) return null

  return (
    <>
      {/* 1. Przycisk do ustawień tabeli w lewym górnym rogu */}
      <div 
        className="absolute z-10  cursor-pointer"
        style={{ top: settingsPos.top, left: settingsPos.left }}
        onClick={() => setIsSettingsOpen(true)}
      >
        <Ellipsis className="w-4 h-4 text-gray-500 hover:text-gray-800" />


        <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen} modal={false}>
          <DropdownMenuTrigger/>
          <DropdownMenuContent side="bottom" align="start" sideOffset={-15} className={"w-[200px]"}>

            <DropdownMenuGroup>
              <DropdownMenuLabel>Table</DropdownMenuLabel>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PaintBucket className="text-gray-800"/> <span className="text-[13px] text-gray-700">Color</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>

                  <DropdownMenuGroup>
                    {/* Table background reset option */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, null)}>
                      <span className="w-4 h-4 rounded-full border border-gray-300 bg-transparent flex items-center justify-center text-[10px] text-gray-400">✕</span>
                      <span className="text-[13px] text-gray-700">Default Background</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Table Text Color</DropdownMenuLabel>

                    {/* Dark Charcoal */}
                    <DropdownMenuItem onClick={() => changeTableTextColor(editor, "oklch(27.8% 0.02 256.4)")}>
                      <Baseline className="stroke-gray-700!" /> <span className="text-[13px] text-gray-700">Charcoal</span> 
                    </DropdownMenuItem>

                    {/* Muted Blue */}
                    <DropdownMenuItem onClick={() => changeTableTextColor(editor, "oklch(55.2% 0.14 246.9)")}>
                      <Baseline className="stroke-blue-500!" /> <span className="text-[13px] text-gray-700">Muted Blue</span> 
                    </DropdownMenuItem>
                    
                    {/* Soft Coral / Red */}
                    <DropdownMenuItem onClick={() => changeTableTextColor(editor, "oklch(58.5% 0.16 18.2)")}>
                      <Baseline className="stroke-red-500!" /> <span className="text-[13px] text-gray-700">Coral</span> 
                    </DropdownMenuItem>
                    
                    {/* Muted Green / Sage */}
                    <DropdownMenuItem onClick={() => changeTableTextColor(editor, "oklch(52.7% 0.11 143.2)")}>
                      <Baseline className="stroke-emerald-600!" /> <span className="text-[13px] text-gray-700">Sage Green</span> 
                    </DropdownMenuItem> 

                    {/* Warm Amber / Yellow */}
                    <DropdownMenuItem onClick={() => changeTableTextColor(editor, "oklch(61.2% 0.13 76.8)")}>
                      <Baseline className="stroke-amber-600!" /> <span className="text-[13px] text-gray-700">Amber Yellow</span> 
                    </DropdownMenuItem> 

                    {/* Deep Lavender / Purple */}
                    <DropdownMenuItem onClick={() => changeTableTextColor(editor, "oklch(51.6% 0.13 297.6)")}>
                      <Baseline className="stroke-purple-600!" /> <span className="text-[13px] text-gray-700">Lavender</span> 
                    </DropdownMenuItem> 

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Cell Background Color</DropdownMenuLabel>

                    {/* Subtle Gray */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, "oklch(96.1% 0.005 256.4)")}>
                      <span className="w-4 h-4 rounded-full border border-gray-200 bg-[oklch(96.1%_0.005_256.4)]"></span> <span className="text-[13px] text-gray-700">Subtle Gray</span>
                    </DropdownMenuItem>

                    {/* Pastel Blue */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, "oklch(93.8% 0.025 244.6)")}>
                      <span className="w-4 h-4 rounded-full border border-gray-200 bg-[oklch(93.8%_0.025_244.6)]"></span> <span className="text-[13px] text-gray-700">Pastel Blue</span>
                    </DropdownMenuItem>

                    {/* Pastel Rose / Pink */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, "oklch(93.6% 0.028 19.4)")}>
                      <span className="w-4 h-4 rounded-full border border-gray-200 bg-[oklch(93.6%_0.028_19.4)]"></span> <span className="text-[13px] text-gray-700">Pastel Rose</span>
                    </DropdownMenuItem>

                    {/* Pastel Mint / Green */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, "oklch(94.5% 0.027 141.2)")}>
                      <span className="w-4 h-4 rounded-full border border-gray-200 bg-[oklch(94.5%_0.027_141.2)]"></span> <span className="text-[13px] text-gray-700">Pastel Mint</span>
                    </DropdownMenuItem> 

                    {/* Pastel Butter / Yellow */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, "oklch(95.6% 0.032 83.1)")}>
                      <span className="w-4 h-4 rounded-full border border-gray-200 bg-[oklch(95.6%_0.032_83.1)]"></span> <span className="text-[13px] text-gray-700">Pastel Yellow</span>
                    </DropdownMenuItem> 

                    {/* Pastel Lilac / Purple */}
                    <DropdownMenuItem onClick={() => changeTableBackground(editor, "oklch(93.9% 0.027 294.0)")}>
                      <span className="w-4 h-4 rounded-full border border-gray-200 bg-[oklch(93.9%_0.027_294.0)]"></span> <span className="text-[13px] text-gray-700">Pastel Lilac</span>
                    </DropdownMenuItem> 
                  </DropdownMenuGroup>

                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ScanText className="text-gray-800"/> <span className="text-[13px] text-gray-700">Alignment</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      Align content
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup className={"w-[130px]"}>
                      <DropdownMenuRadioItem value="top" onClick={() => changeAllTextAlignment(editor, "left")}> 
                        <TextAlignStart/> <span className="text-[13px] text-gray-700">Left</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="bottom" onClick={() => changeAllTextAlignment(editor, "center")}>
                        <TextAlignCenter/> <span className="text-[13px] text-gray-700">Center</span>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="right" onClick={() => changeAllTextAlignment(editor, "right")}>
                        <TextAlignEnd/> <span className="text-[13px] text-gray-700">Right</span>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>



              <DropdownMenuItem onClick={() => clearTableContents(editor)}>
                <Eraser className="text-gray-800"/> <span className="text-[13px] text-gray-700">clear all contents</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => duplicateTable(editor)}>
                <Copy className="text-gray-800"/> <span className="text-[13px] text-gray-700">Duplicate table</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyTableToClipboard(editor)}>
                <Clipboard className="text-gray-800"/> <span className="text-[13px] text-gray-700">Copy to clipboard</span>
                </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => console.log("nico xd")}>
                <Link className="text-gray-800"/> <span className="text-[13px] text-gray-700">copy anchor link</span>
              </DropdownMenuItem> */}
            </DropdownMenuGroup>

            <DropdownMenuSeparator/>

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="text-gray-800"/> <span className="text-[13px] text-gray-700">Ask Notium</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>


              <AlertDialog>
                <AlertDialogTrigger nativeButton={false} render={
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <Trash /> 
                  <span className="text-[13px] text-red-500 font-medium">
                    Delete Table
                  </span>
              </DropdownMenuItem>
                }>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[15px]"> Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[12px]">
                      Delete this table and all of its contents?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="text-[13px]" variant={"destructive"} 
                      onClick={() => editor.chain().focus().deleteTable().run()}
                      >Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              </DropdownMenuGroup>

          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Tu wrzuć <DropdownMenu> z opcjami:
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            onClick={() => editor.chain().focus().deleteColumn().run()}
        */}
      </div>


      {/* 1. GÓRNY UCHWYT KOLUMNY (Śledzi komórkę na osi X) */}
      <div 
        className="absolute z-10 w-6 h-4 transition-all duration-150 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded cursor-pointer flex items-center justify-center  shadow-sm"
        style={{ top: colGrip.top, left: colGrip.left }}
      >
        <GripHorizontal className="w-3 h-3 text-gray-500" />
        
        {/* Tu wrzuć <DropdownMenu> z opcjami:
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            onClick={() => editor.chain().focus().deleteColumn().run()}
        */}
      </div>

      {/* 2. LEWY UCHWYT WIERSZA (Śledzi komórkę na osi Y) */}
      <div 
        className="absolute z-10 w-4 h-6 transition-all duration-150 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded cursor-pointer flex items-center justify-center shadow-sm"
        style={{ top: rowGrip.top, left: rowGrip.left }}
      >
        <GripVertical className="w-3 h-3 text-gray-500" />

        {/* Tu wrzuć <DropdownMenu> z opcjami:
            onClick={() => editor.chain().focus().addRowBefore().run()}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            onClick={() => editor.chain().focus().deleteRow().run()}
        */}
      </div>

      {/* 3. PRAWY PLUS (Dodawanie kolumny) */}
      <button 
        type="button"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className={`absolute z-10  w-[25px] bg-white hover:bg-gray-100 border border-gray-300 flex items-center
          cursor-pointer justify-center shadow-sm text-gray-400 hover:text-blue-500 transition-colors`}
        style={{ top: rightPlus.top, left: rightPlus.left, height: tableRECT.height }}
        title="Add column"
      >
        <Plus className={`h-3.5 w-3.5 stroke-[2.5]`} />
      </button>

      {/* 4. DOLNY PLUS (Dodawanie wiersza) */}
      <button 
        type="button"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className={`absolute z-10  h-[25px] bg-white hover:bg-gray-100 border border-gray-300 flex items-center 
          cursor-pointer justify-center shadow-sm text-gray-400 hover:text-blue-500 transition-colors`}
        style={{ top: bottomPlus.top, left: bottomPlus.left, width: tableRECT.width }}
        title="Add row"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </>
  )
}