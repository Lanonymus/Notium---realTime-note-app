import Color from "@tiptap/extension-color"
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style';
// import Image from "@tiptap/extension-image"
import imageResize from "tiptap-extension-resize-image"
import { useEffect, useRef, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { ImageDeleteWatcher } from "./extensions/ImageDeleteWatcher";
import TextAlign from "@tiptap/extension-text-align"
import setImageAlignment from "./ImagePositioning";
import { CustomRemoteCursors } from "./extensions/CustomRemoteCursors";
import { CustomHighlight } from "./extensions/CustomHighlight";
import ToolBar from "./components/ToolBar";
import { useEditorWebSocket } from "./hooks/useEditorWebSocket";
import BubbleMenuText from "./components/BubbleMenuText";
import { KeyBoardShortcuts } from "./extensions/KeyBoardShortcuts";
import { Link } from "@tiptap/extension-link"
import { TableRow } from "@tiptap/extension-table-row"
import AdvancedTableControls from "./components/AdvancedTableControls";
import { Focus } from "@tiptap/extension-focus"
import { CustomTableCell, CustomTableHeader } from "./extensions/CustomTableCellBgColor";
import { Table, TableHeader } from "@tiptap/extension-table"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import Chat from "./components/Chat";
import InlineAiChat from "./components/InlineAiChat";
import { AiBlock } from "./extensions/AiBlock";
import { Slice } from "@tiptap/pm/model"
import { CellSelection } from "@tiptap/pm/tables"
import { PanelImperativeHandle } from "react-resizable-panels";
import animatePanelSize from "./components/Functions/AnimatePanelSize";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessagesSquare } from "lucide-react";
import FontFamily from "@tiptap/extension-font-family"
import { FontSize } from "./extensions/FontSize";


type TipTapEditorProps = {
  roomId: number | null,
  token: string | null
}

type CursorData = {
  from: number,
  to: number,
  name: string,
  color: string
}


type AiContextRange = {
  from: number,
  to: number
}

function TipTapEditor({ roomId, token} : TipTapEditorProps) {
  const lastCursorSendTime = useRef<number>(0)
  const cursorTimeOutLastUpdate = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorData>>({})  
  const [title, setTitle] = useState<string>("Project Title")
  const [aiContextRange, setAiContextRange] = useState<AiContextRange | null>(null)
  const [aiContextText, setAiContextText] = useState<string>("")
  const [userSelectedContent, setUserSelectedContent] = useState<Slice | null>(null)
  const [showInlineAiBubble, setShowInlineAiBubble] = useState<boolean>(false)
  const newContext = useRef<string>("")
  const [aiChatContext, setAiChatContext] = useState<string>("No context provided")
  const aiChatPanelRef = useRef<PanelImperativeHandle | null>(null)
  const editorPanelRef = useRef<PanelImperativeHandle | null>(null)
  const panelSizes = useRef({ editor: 65, ai: 35 });
  const [ isEditorMaximized, setIsEditorMaximized ] = useState(false)
  const [ isAiChatMaximized, setIsAiChatMaximized ] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-mono text-sm',
          }
        }
      }),
      CustomHighlight,
      TextStyle,
      FontFamily,
      FontSize,
      AiBlock,
      Color,
      KeyBoardShortcuts,
      Focus.configure({ 
        className: 'has-focus',
        mode: "all", // nakłada dodatkowa klase focus na paragrafy / komórki / wiersze
      }),
      TextAlign.configure({
        types: ["paragraph", "heading", "imageResize"]

      }),
      Link.configure({
        openOnClick: false, // zapobiega automatycznym otwieraniu linków po dodaniu podkreslenia
        autolink: false, // zmienia wpisane url na link
        HTMLAttributes: {
          class: 'text-blue-600 underline decoration-blue-500 hover:text-blue-800 transition-colors cursor-pointer',
        }
      }),
      imageResize.configure({
        inline: true, //
        allowBase64: false // chcemy tylko linki 
      }),
      Placeholder.configure({
        placeholder: "„Naciśnij '/' aby dodać nagłówek, obraz, tabelę lub wywołać AI...”",
        includeChildren: true,
      }),
      CustomRemoteCursors.configure({
        cursors: remoteCursors
      }),
      ImageDeleteWatcher.configure({
        onImageDelete: async (url: string) => {
          console.log("📷 Wbudowany system wykrył usunięcie zdjęcia! URL:", url);
          try {
            const response = await fetch("http://localhost:8000/api/delete-image", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: url})
            })

            const result = await response.json();
            console.log(result);
            

          } catch (error) {
            console.error("Error deleting image:", error);
          }
        }
      }),

      // Tabela
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-separate border-spacing-0 table-auto w-full my-4', // bazowe klasy Tailwinda dla tabeli
        },
      }),
      TableRow,
      CustomTableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 min-w-[50px] relative hover:ring-2 hover:ring-inset hover:ring-blue-500 transition-shadow cursor-pointer',
        }
      }),
      CustomTableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-bold border border-gray-300 p-2 text-left relative hover:ring-2 hover:ring-inset hover:ring-blue-500 transition-shadow cursor-pointer',
        },
      })
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none outline-none h-full"
      }
    },

    onUpdate: ({ editor }) => {
      const dataJSON = editor.getJSON();
      // console.log("Editor content: ", dataJSON);

        
        sendPayLoad({
          type: "UPDATE_DOC",
          editorContent: dataJSON,
          uuid: uuidRef.current 
        })
      
    },
    onSelectionUpdate: ({ editor }) => {


      // console.log("Selection updated: ", editor.state.selection)
      const sendCursorPayLoad = () => {
        const { from, to } = editor.state.selection
        sendPayLoad({
          type: "UPDATE_CURSOR",
          uuid: uuidRef.current,
          state: {
            from,
            to,
            name: "Jakub",
            color: "#34d399"
          }
        })
      }

      // Resetowanie zegara który czeka na ostatnią aktualizację
      if(cursorTimeOutLastUpdate.current) {
        clearTimeout(cursorTimeOutLastUpdate.current)
      }

      cursorTimeOutLastUpdate.current = setTimeout(() => {
        sendCursorPayLoad()
      }, 150)
      

      const now = Date.now()
      if (now - lastCursorSendTime.current < 50) return

      lastCursorSendTime.current = now
      sendCursorPayLoad()
      
    }
    // onTransaction: ({ editor, transaction}) => {
    
    //   if (!transaction.docChanged) {
    //     return; 
    //   }

    //   const isHistoryIgnored = transaction.getMeta('addToHistory') === false;
    
    // console.log('--- Nowa Transakcja ---');
    // console.log('Czy ignorowana w historii?:', isHistoryIgnored ? 'TAK 🚫' : 'NIE ✅');
    // console.log('Liczba kroków w transakcji:', transaction.steps.length);
    // // Możesz też zobaczyć jakie zmiany zaszły w treści
    // console.log('Doc size:', transaction.doc.content.size);

    // }
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if(!file) {
      console.log("No file provided");
      return
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch("http://localhost:8000/api/upload-media", {
        method: "POST",
        body: formData
      })
      if(!response.ok) {
        console.log("Error during sending an image")
      }

      const data = await response.json()

      if(data.url) {
        editor?.chain().focus().setImage({ src: data.url}).run()
      }

    } catch (err) {
      console.error("Error during sending an image")
    }

  }



    const fullScreenAiPanel = () => {
      animatePanelSize(editorPanelRef, panelSizes.current.editor * 12, 0, 800); 
    };

    const fullScreenEditorPanel = () => {
      animatePanelSize(aiChatPanelRef, panelSizes.current.ai * 12, 0, 800); 
    };

    const halfScreenAiPanel = () => {
      animatePanelSize(aiChatPanelRef, panelSizes.current.ai * 12 , 500, 800); 
    };

    const halfScreenEditorPanel = () => {
      animatePanelSize(aiChatPanelRef, panelSizes.current.ai * 12, 500, 800); 
    };


    
  const { sendPayLoad, uuidRef } = useEditorWebSocket({ editor, roomId, token, setRemoteCursors})


  useEffect(() => {
    if(editor && !editor.isDestroyed) {
      (editor.storage as any).customRemoteCursors.cursors = remoteCursors;

      // ZABEZPIECZENIE: przed czyszczeniem przyszłości przez tworzenie teorytycznie nowej transakcji
      const tr = editor.state.tr.setMeta("addToHistory", false)
      editor.view.dispatch(tr)
    }
  }, [remoteCursors, editor])

  // ta funkcja dzieje się po kliknięciu na ask notium guzik
  useEffect(() => {
    if(editor && !editor.isDestroyed) {

      if(showInlineAiBubble && aiContextRange) {
        editor.chain().focus()
          .setTextSelection(aiContextRange)
          .setHighLight({ color: "#BFD8FF", borderRadius: "0px"})
          .run()
      } else if (!showInlineAiBubble && aiContextRange) {
        editor.chain().focus()
          .setTextSelection(aiContextRange)
          .unsetHighLight()
          .run()
      
        // resetowanie przy zmianie stanu inlineAi
        setTimeout(() => {
          setAiContextRange(null)
          setAiContextText("");
          setUserSelectedContent(null)
        }, 0);
      }

      setTimeout(() => {
        editor.commands.setMeta('sharedAiMenu', 'updatePosition')
      }, 0)
    }
  }, [showInlineAiBubble, editor])



  useEffect(() => {
      const handleCloseAi = () => {

        console.log("czyszczenie po zamknięciu okna inline ai");
        

        setShowInlineAiBubble(false);
        setAiContextRange(null);
        setAiContextText("");
        setUserSelectedContent(null)
        newContext.current = ""
      };

      window.addEventListener('close-ai-menu', handleCloseAi);
      return () => window.removeEventListener('close-ai-menu', handleCloseAi);
    }, []);

  // Modyfikowanie outputu
  useEffect(() => {
      console.log("test czy wogle się modifykacja guzik dzieje coś?");
      

      const handleShowInlineAi = (event: Event) => {
          console.log('🔛wykonano włączenie inline ai');

          
          const customEvent = event as CustomEvent
          const tempNewContext = customEvent.detail.newContext
          newContext.current = tempNewContext
          // console.log("kontekst podczas klikania na modify🙏: ", newContext.current);
          
          setTimeout(() => {           
              setShowInlineAiBubble(true)
              console.log("czy inline ai jest aktywyny: ", showInlineAiBubble);
          }, 0)
      }

      window.addEventListener('open-inline-ai-chat', handleShowInlineAi)            

      return () => window.removeEventListener('open-inline-ai-chat', handleShowInlineAi)
  }, [])






  if (!editor) {
    return <p>Ładowanie edytora...</p>;
  }

  
  return (
  <>

    <ToolBar editor={editor} handleImageUpload={handleImageUpload}/>
    
    {editor && (
      <BubbleMenu
        className="z-999"
        editor={editor}
        // Dynamicznie zmieniamy pozycję: standardowe menu nad tekstem (top), menu AI pod tekstem (bottom-start)
        options={{ 
          placement: showInlineAiBubble ? "bottom-start" : "top",
          offset: showInlineAiBubble ? 8 : 10 // Lekki offset dla obu trybów
        }}
        pluginKey="sharedAiMenu"
        // pluginKey={}
        shouldShow={({ editor }) => {
          // wymuszamy pokazanie jeśli generujemy odpowiedź od ai bo wtedy zaznaczenie się traci
          if(showInlineAiBubble) return true

          // Bąbelek w ogóle się pokazuje tylko wtedy, gdy jest zaznaczony jakiś tekst
          return !editor.state.selection.empty;
        }}
      >
        {/* REAKCYJNE PRZEŁĄCZANIE ZAWARTOŚCI */}
        {!showInlineAiBubble ? (
          
          // --- TRYB A: Zwykłe menu formatowania tekstu ---
          <BubbleMenuText 
            editor={editor} 
            onGenerateWithAiClick={() => {
              const { from, to } = editor.state.selection
              const contextText = editor.state.doc.textBetween(from, to)
              const slice = editor.state.doc.slice(from, to)
              console.log('kontekst: ', slice);
              

              setAiContextText(contextText)
              setUserSelectedContent(slice)

              setAiContextRange({ from, to })
              
              setShowInlineAiBubble(true)
            }} 
            onAskAiClick={() => {
              console.log("kliknięto pytanie do ai");
              const { selection } = editor.state
              let contextText = ""

              if (selection instanceof CellSelection) {
                let contextList: string[] = []
                let tableHeaders: string[] = []
                
                selection.forEachCell((node) => {
                  // Zabezpieczenie przed enterami w komórkach (Markdown ich nie lubi)
                  const text = node.textContent.trim().replace(/\n/g, " ")
                  
                  if (node.type.name === 'tableHeader') {
                    if (text) {
                      tableHeaders.push(`| ${text} |`)
                    }
                  } else {
                    if (text) {
                      contextList.push(`| ${text} |`)
                    }
                  }
                })

                // 1. Dodawanie nagłówków (tylko jeśli istnieją)
                if (tableHeaders.length > 0) {
                  contextText = "Nagłówki tabeli\t" + tableHeaders.join("\t") + "\n"
                }

                // 2. Dodawanie zawartości komórek
                if (contextList.length > 0 && tableHeaders.length > 0) {
                  for (let i = 0; i < contextList.length; i++) {
                    contextText += "\t" + contextList[i]
                    
                    // Przełamanie wiersza na podstawie liczby nagłówków
                    if ((i + 1) % tableHeaders.length === 0) {
                      contextText += "\n"
                    }
                  }
                } else {
                  // Fallback na wypadek zaznaczenia komórek bez nagłówków
                  contextText += contextList.join(" | ")
                }

              } else {
                const { from, to } = selection
                contextText = editor.state.doc.textBetween(from, to, " ")
              }
              setAiChatContext(contextText)

              console.log("selekcja: ", selection);
              console.log('zaznaczony tekst w komórkach (Ask AI):\n', contextText);              
            }}
            
          />

        ) : (
          <InlineAiChat
            editor={editor}
            aiContextText={aiContextText}
            userSelectedContent={userSelectedContent}
            showInlineAiBubble={showInlineAiBubble}
            closeInlineAiBubble={() => {
              setShowInlineAiBubble(false)
            }}
            openInlineAiBubble={() => {
              setShowInlineAiBubble(true)
            }}
            newContext={newContext}
          />

        )}
      </BubbleMenu>
    )}


  {editor && (
    <BubbleMenu
      editor={editor}
      // options={{ duration: 100, animation: "fade"}}
      shouldShow={({ editor }) => editor.isActive('imageResize')}
    >
      <div className="flex items-center gap-x-1 bg-white p-1.5 rounded-lg shadow-lg border border-gray-200">
        <button
          onClick={() => setImageAlignment('left', editor)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            editor.isActive('imageResize', { class: 'float-left mr-4 mb-2 clear-none' }) 
              ? 'bg-emerald-100 text-emerald-700 font-semibold' 
              : 'hover:bg-gray-100'
          }`}
        >
          Left
        </button>
        
        <button
          onClick={() => setImageAlignment('center', editor)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            editor.isActive('imageResize', { class: 'block mx-auto clear-both my-4' }) 
              ? 'bg-emerald-100 text-emerald-700 font-semibold' 
              : 'hover:bg-gray-100'
          }`}
        >
          Center
        </button>
        
        <button
          onClick={() => setImageAlignment('right', editor)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            editor.isActive('imageResize', { class: 'float-right ml-4 mb-2 clear-none' }) 
              ? 'bg-emerald-100 text-emerald-700 font-semibold' 
              : 'hover:bg-gray-100'
          }`}
        >
          Right
        </button>
      </div>
    </BubbleMenu>
  )}
    
  <div className="h-screen w-screen flex flex-col items-center pt-15 pb-5 bg-white">
    {/* Główny kontener na cały obszar roboczy (np. 80% szerokości ekranu) */}
    <div className="w-[85%] h-full  flex flex-col pb-15">

      <input 
        type="text" 
        onChange={(e) => setTitle(e.target.value)} 
        value={title} 
        placeholder="Project Title" 
        className="text-3xl placeholder-gray-300 placeholder:font-medium font-bold py-2 mb-2
          outline-transparent focus:outline-2 focus:outline-dashed focus:outline-gray-300 w-full"
      />
           
      <div className="h-full w-full relative">
        
        <Button 
          variant={"outline"} 
          className={`absolute z-999 top-[0px] right-[0px] mt-4 ${isEditorMaximized ? "mr-8" : "mr-4"} transition-all duration-200 h-[35px]`} 
          onClick={() => {
            if (isEditorMaximized) {
              halfScreenEditorPanel() 
              setIsEditorMaximized(false)

            } else {
              fullScreenEditorPanel() 
              setIsEditorMaximized(true)
            }
          }}>
          {isEditorMaximized ? (
            <MessagesSquare className="w-4 h-4 stroke-gray-800" />
          ) : (
            <ArrowRight className="w-4 h-4 stroke-gray-800" />
          )}

        </Button>

        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
                
                <ResizablePanel defaultSize={65} minSize={0}  panelRef={editorPanelRef}  onResize={(size) => {
                  panelSizes.current.editor = size.asPercentage
                  window.dispatchEvent(new CustomEvent('panel-resize'))
                }} className={`flex flex-col bg-white`}>
                  <div className={`relative prose prose-slate max-w-none w-full overflow-y-auto flex-1
                    prose-markers:text-slate-900 border border-gray-200 rounded-[6px] py-2 px-10 
                    
                  selection:bg-blue-500/30 selection:text-inherit
                  [&_.tiptap]:selection:bg-blue-500/30

                    [&::-webkit-scrollbar]:w-[5px]
                    [&::-webkit-scrollbar]:h-[5px]
                    [&::-webkit-scrollbar-track]:bg-gray-100
                    [&::-webkit-scrollbar-thumb]:bg-gray-300
                    [&::-webkit-scrollbar-thumb]:rounded-[4px]
                    `}>
                    
                    {/* Zaawansowany system kontroli tabeli */}
                    {editor && <AdvancedTableControls editor={editor} />}

                    <EditorContent editor={editor} />
                  </div>
                    
                </ResizablePanel>

                {/* --- UCHWYT --- */}
                {/* Usunąłem sztywną szerokość w-[15px] na rzecz standardowego, ładnego paska shadcn */}
                <ResizableHandle withHandle={true} className="bg-white! w-[9px]  hover:bg-blue-100  transition-colors 
                  [&>div]:h-[55px] [&>div]:cursor-col-resize! cursor-col-resize!" />

                {/* --- PRAWY PANEL (AI) --- */}
                <ResizablePanel 
                  defaultSize={35}
                  minSize={0}
                  onResize={(size) => panelSizes.current.ai = size.asPercentage} // AKTUALIZACJA STANU 
                  panelRef={aiChatPanelRef} 
                  className={`w-full h-full bg-[#FAFAFA] flex flex-col relative border-1 border-gray-200`} 
                  // onResize={(size) => setAiChatPanel(size.asPercentage)}
                >
                  <Chat 
                    editor={editor} 
                    context={aiChatContext}
                    onResetContext={() => {
                      setAiChatContext("No context provided")
                    }}  
                    onMaximizePanel={() => {
                      if (isAiChatMaximized) {
                        halfScreenAiPanel()
                        setIsAiChatMaximized(false)
                      } else {
                        fullScreenAiPanel()
                        setIsAiChatMaximized(true)
                      }
                    }}
                  />
                </ResizablePanel>

              </ResizablePanelGroup>
      </div>
    
      
    </div>
  </div>


  </>
  )
}


export default TipTapEditor