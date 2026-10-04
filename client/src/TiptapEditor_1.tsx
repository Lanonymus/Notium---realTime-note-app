import Color from "@tiptap/extension-color"
import { useEditor, EditorContent, Editor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect, useRef, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { ImageDeleteWatcher } from "./extensions/ImageDeleteWatcher";
import TextAlign from "@tiptap/extension-text-align"
import { CustomRemoteCursors } from "./extensions/CustomRemoteCursors";
import { CustomHighlight } from "./extensions/CustomHighlight";
import ToolBar from "./components/Toolbar/ToolBar";
import { useEditorWebSocket } from "./hooks/useEditorWebSocket";
import BubbleMenuText from "./components/BubbleMenuText/BubbleMenuText";
import { KeyBoardShortcuts } from "./extensions/KeyBoardShortcuts";
import { Link } from "@tiptap/extension-link"
import { TableRow } from "@tiptap/extension-table-row"
import AdvancedTableControls from "./components/Table/AdvancedTableControls";
import { Focus } from "@tiptap/extension-focus"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import Chat from "./components/Chat";
import InlineAiChat from "./components/InlineAiChat";
import { AiBlock } from "./extensions/AiBlock";
import { Slice } from "@tiptap/pm/model"
import { CellSelection } from "@tiptap/pm/tables"
import { PanelImperativeHandle } from "react-resizable-panels";
import animatePanelSize from "./components/Functions/AnimatePanelSize";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUp, MessagesSquare } from "lucide-react";
import FontFamily from "@tiptap/extension-font-family"
import { FontSize } from "./extensions/FontSize";
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useParams} from "react-router-dom"
import { CustomImage } from "./extensions/CustomImage";
import { getMediaUrl } from "./components/GetMediaUrl";
import ImageBubbleMenu from "./components/ImageBubbleMenu";
import { CustomTable } from "./extensions/CustomTable";
import { TableExtensions } from "./extensions/TableExtensions";


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

function TipTapEditor() {
  const params = useParams() 
  const projectID: string | undefined = params.projectID
  const lastCursorSendTime = useRef<number>(0)
  const cursorTimeOutLastUpdate = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorData>>({})  
  const [title, setTitle] = useState<string>("")  

  // Zapytania do AI
  const [aiContextText, setAiContextText] = useState<string>("")
  const [aiContextRange, setAiContextRange] = useState<AiContextRange | null>(null)
  const [action, setAction] = useState<string | null>(null)

  const [userSelectedContent, setUserSelectedContent] = useState<Slice | null>(null)
  const [showInlineAiBubble, setShowInlineAiBubble] = useState<boolean>(false)
  const [showHighlighterPicker, setShowHighlighterPicker] = useState<boolean>(false)
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
      ...TableExtensions,
      CustomImage,
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
      Placeholder.configure({
        placeholder: "„Naciśnij '/' aby dodać nagłówek, obraz, tabelę lub wywołać AI...”",
        includeChildren: true,
      }),
      CustomRemoteCursors.configure({
        cursors: remoteCursors
      }),
      ImageDeleteWatcher.configure({
        onImageDelete: async (src: string, projectID: string, fileName: string) => {

          if(src.startsWith("blob:")) {
            console.log("Usunięcie zdjęcia placeholdera z blob:")
            return
          }
          
          if(!projectID || !fileName) {
            console.log("Nie można usunąć zdjęcia bez projectID lub fileName");
            return;
          }

          const url = `editor/${projectID}/${fileName}`

          console.log(`📷 Wbudowany system wykrył usunięcie zdjęcia! URL: ${url}`);


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


  const handleImageUpload = async (file: File) => {
    if (!file || !editor || !projectID) {
      console.log("No file provided, editor not ready or missing projectID");
      return;
    }

    // 1. Czysta nazwa pliku bez prefiksów katalogu
    const fileName = `${Date.now()}_${file.name}`;
    const tempUrl = URL.createObjectURL(file);
    

    // 2. Wstawienie placeholderu z atrybutami docId i fileName
    editor
      .chain()
      .focus()
      .setImage({
        src: tempUrl,
        isUploading: true,
        progress: 0,
        docId: projectID,
        fileName: fileName
      } as any)
      .run();

    let nodePos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.src === tempUrl) {
        nodePos = pos;
        return false;
      }
    });

    const formData = new FormData();
    // 1. Najpierw pola tekstowe
    formData.append('fileName', fileName);
    formData.append('projectID', projectID);
    // 2. Na końcu plik
    formData.append('file', file);



    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8000/api/upload-media', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && nodePos !== null) {
        const percentComplete = (event.loaded / event.total) * 100;

        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === tempUrl) {
            editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                progress: percentComplete
              });
              return true;
            });
            return false;
          }
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {

          // Używamy adresu zwróconego z backendu lub wygenerowanego z helpera
          const finalMediaUrl = getMediaUrl(projectID, fileName);

          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "image" && node.attrs.src === tempUrl) {
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  src: finalMediaUrl,
                  isUploading: false,
                  progress: 100
                });
                return true;
              });
              return false;
            }
          });
        } catch (e) {
          console.error("Błąd podczas parsowania odpowiedzi serwera:", e);
        } finally {
          URL.revokeObjectURL(tempUrl);
        }
      } else {
        console.error("Błąd podczas wysyłania obrazu:", xhr.statusText);
        removeTempImage(tempUrl);
        URL.revokeObjectURL(tempUrl);
      }
    };

    xhr.onerror = () => {
      console.error("Error during sending an image");
      removeTempImage(tempUrl);
      URL.revokeObjectURL(tempUrl);
    };

    xhr.send(formData);

    function removeTempImage(targetUrl: string) {
      editor?.state.doc.descendants((node, pos) => {
        // Poprawiono: node.attrs.src zamiast node.attrs.str
        if (node.type.name === "image" && node.attrs.src === targetUrl) {
          editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
          return false;
        }
      });
    }
  };






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


    
  const { sendPayLoad, uuidRef, isContentLoaded } = useEditorWebSocket(
    { 
      editor,
      setTitle,
      projectID,
      setRemoteCursors
    }
  )


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

      // jeżeli jest akcja jakaś to nie chcemy zaznaczać tekstu żeby utrzymać zaznaczaenie
      if(action) return

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
  }, [showInlineAiBubble, editor, action])



  useEffect(() => {
      const handleCloseAi = () => {

        console.log("czyszczenie po zamknięciu okna inline ai");
        

        setShowInlineAiBubble(false);
        setAiContextRange(null);
        setAiContextText("");
        setUserSelectedContent(null)
        setAction(null)
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

    

    {/* <-----------TEXT BUBBLE MENU-----------> */}
    {editor && (
      <BubbleMenu
        className="z-3"
        editor={editor}
        // Dynamicznie zmieniamy pozycję: standardowe menu nad tekstem (top), menu AI pod tekstem (bottom-start)
        options={{ 
          placement: showInlineAiBubble ? "bottom-start" : "top",
          offset: showInlineAiBubble ? 8 : 10 // Lekki offset dla obu trybów
        }}
        pluginKey="sharedAiMenu"
        // pluginKey={}
        shouldShow={({ editor }) => {
          if(editor.isActive('image')) return false
          // wymuszamy pokazanie jeśli generujemy odpowiedź od ai bo wtedy zaznaczenie się traci
          if(showInlineAiBubble) return true
          if(!editor.state.selection.empty) return true
          // if(showHighlighterPicker) return true

          // Bąbelek w ogóle się pokazuje tylko wtedy, gdy jest zaznaczony jakiś tekst
          // return !editor.state.selection.empty;
          return showHighlighterPicker

        }}
      >
        {/* REAKCYJNE PRZEŁĄCZANIE ZAWARTOŚCI */}
        {!showInlineAiBubble ? (
          
          // --- TRYB A: Zwykłe menu formatowania tekstu ---
          <BubbleMenuText 
            editor={editor} 
            onOpenHighlighterPicker={() => {
              setShowHighlighterPicker(true)
              console.log('true');
              
            }}
            onCloseHighlighterPicker={() => {
              setShowHighlighterPicker(false)
              console.log('false');
              
            }}
            onGenerateWithAiClick={(action: string | null) => {
              const { from, to } = editor.state.selection
              const contextText = editor.state.doc.textBetween(from, to)
              const slice = editor.state.doc.slice(from, to)
              console.log('context: ', slice);
              console.log('action:', action);
              
              
              setAiContextText(contextText)
              setUserSelectedContent(slice)

              setAiContextRange({ from, to })
              
              setShowInlineAiBubble(true)
              setAction(action)
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
            action={action}
          />

        )}
      </BubbleMenu>
    )}
    


    {editor && (<ImageBubbleMenu editor={editor} />)}
    


{/* 1. GŁÓWNY KONTENER*/}
  <div className="h-screen w-full flex flex-col bg-white overflow-hidden relative">


    {/* 2. TOOLBAR: shrink-0 sprawia, że pasek trzyma swój wymiar */}
    <div className="shrink-0">
      <ToolBar editor={editor} sendPayLoad={sendPayLoad} setTitle={setTitle} isContentLoaded={isContentLoaded} title={title} uuid={uuidRef.current} handleImageUpload={handleImageUpload}/>
    </div>

    {/* 3. KONTENER GŁÓWNY: Zamiast h-full dajemy flex-1 min-h-0 oraz opcjonalny padding p-4 */}
    <div className="flex-1 min-h-0 w-full flex flex-col items-center bg-white pb-5 pt-3">
      
      {/* Obszar roboczy */}
      <div className="w-full px-7 h-full flex flex-col">

            
        {/* 4. KONTENER EDYTOR + AI: flex-1 min-h-0 idealnie wypełnia resztę ekranu */}
        <div className="flex-1 min-h-0 w-full relative">
          
          <Button 
            variant={"outline"} 
            className={`absolute z-10 top-[0px] right-[0px] mt-4 ${isEditorMaximized ? "mr-8" : "mr-4"} transition-all duration-200 h-[35px]`} 
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
            
            {/* PANELA EDYTORA */}
            <ResizablePanel 
              defaultSize={55} 
              minSize={0}  
              panelRef={editorPanelRef}  
              onResize={(size) => {
                panelSizes.current.editor = size.asPercentage
                window.dispatchEvent(new CustomEvent('panel-resize'))
              }} 
              className="flex flex-col bg-white"
            >
              {!isContentLoaded ? (   
                <div className="pt-8 flex w-full h-full flex-col gap-8 pb-10">
                  
                  {/* 1. PIERWSZY AKAPIT (Wstęp) */}
                  <div className="flex flex-col gap-2.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>

                  {/* 2. SEKCJA Z NAGŁÓWKIEM I LISTĄ */}
                  <div className="flex flex-col gap-4 mt-2">
                    {/* Nagłówek (H2/H3 - grubszy i krótszy) */}
                    <Skeleton className="h-6 w-[35%]" /> 
                    
                    <div className="flex flex-col gap-2.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[85%]" />
                    </div>

                    {/* Imitacja listy punktowanej */}
                    <div className="flex flex-col gap-3 mt-1 ml-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-[70%]" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-[85%]" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-[50%]" />
                      </div>
                    </div>

                  </div>

                  {/* 5. ZAKOŃCZENIE (Krótki akapit) */}
                  <div className="flex flex-col gap-2.5 mt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[75%]" />
                  </div>

                  {/* 1. PIERWSZY AKAPIT (Wstęp) */}
                  <div className="flex flex-col gap-2.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>      

                  <div className="flex flex-col gap-3 mt-1 ml-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-[85%]" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-[50%]" />
                    </div>
                  </div>    

                  {/* Nagłówek (H2/H3 - grubszy i krótszy) */}
                  <Skeleton className="h-8 w-[35%]" /> 
                                                           

                </div>      
              ) : (
                <div className={`relative prose prose-slate max-w-none w-full overflow-y-auto flex-1
                  prose-markers:text-slate-900 rounded-[1px] py-2 pl-[0px] pr-[40px]
                  
                  selection:bg-blue-500/30 selection:text-inherit
                  [&_.tiptap]:selection:bg-blue-500/30

                  [&::-webkit-scrollbar]:w-[5px]
                  [&::-webkit-scrollbar]:h-[5px]
                  [&::-webkit-scrollbar-track]:bg-gray-100
                  [&::-webkit-scrollbar-thumb]:bg-gray-300
                  [&::-webkit-scrollbar-thumb]:rounded-[4px]
                `}>
                  {editor && <AdvancedTableControls 
                    editor={editor} 
                    onAskNotium={(tableContent: string) => {
                      setAiChatContext(tableContent)
                    }}
                  />}
                    <EditorContent editor={editor}  />
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle withHandle={true} className="bg-white! w-[9px] hover:bg-blue-100 transition-colors 
              [&>div]:h-[55px] [&>div]:cursor-col-resize! cursor-col-resize!" />

            {/* PANEL CHATU AI */}
            <ResizablePanel 
              defaultSize={45}
              minSize={0}
              onResize={(size) => panelSizes.current.ai = size.asPercentage}
              panelRef={aiChatPanelRef} 
              className="w-full h-full bg-[#FAFAFA] flex flex-col relative border-1 border-gray-200
                  [&::-webkit-scrollbar]:w-[5px]
                  [&::-webkit-scrollbar]:h-[5px]
                  [&::-webkit-scrollbar-track]:bg-gray-100
                  [&::-webkit-scrollbar-thumb]:bg-gray-300
                  [&::-webkit-scrollbar-thumb]:rounded-[4px]              
              " 
            >
              <Chat 
                projectID={projectID}
                editor={editor} 
                context={aiChatContext}
                isContentLoaded={isContentLoaded}
                onResetContext={() => setAiChatContext("No context provided")}  
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

  </div>

  


  </>
  )
}


export default TipTapEditor