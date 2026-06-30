import Color from "@tiptap/extension-color"
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style';
// import Image from "@tiptap/extension-image"
import imageResize from "tiptap-extension-resize-image"
import { useEffect, useRef, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import BubbleMenuButtons from "./BubbleMenuButtons";
import { ImageDeleteWatcher } from "./extensions/ImageDeleteWatcher";
import TextAlign from "@tiptap/extension-text-align"
import setImageAlignment from "./ImagePositioning";
import { CustomRemoteCursors } from "./extensions/CustomRemoteCursors";
import { CustomHighlight } from "./extensions/CustomHighlight";
import ToolBar from "./components/ToolBar";
import { useEditorWebSocket } from "./hooks/useEditorWebSocket";

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


function TipTapEditor({ roomId, token} : TipTapEditorProps) {
  const lastCursorSendTime = useRef<number>(0)
  const cursorTimeOutLastUpdate = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorData>>({})  

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
      Color,
      TextAlign.configure({
        types: ["paragraph", "heading", "imageResize"]

      }),
      imageResize.configure({
        inline: true,
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
      })

    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none outline-none h-full"
      }
    },

    onUpdate: ({ editor }) => {
      const dataJSON = editor.getJSON();
      console.log("Editor content: ", dataJSON);

        
        sendPayLoad({
          type: "UPDATE_DOC",
          editorContent: dataJSON,
          uuid: uuidRef.current 
        })
      
    },
    onSelectionUpdate: ({ editor }) => {


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
  })

  const { sendPayLoad, uuidRef } = useEditorWebSocket({ editor, roomId, token, setRemoteCursors})


  useEffect(() => {
    if(editor && !editor.isDestroyed) {
      (editor.storage as any).customRemoteCursors.cursors = remoteCursors;
      editor.view.dispatch(editor.state.tr)
    }
  }, [remoteCursors, editor])


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

  if (!editor) {
    return <p>Ładowanie edytora...</p>;
  }

  
  return (
  <>

    <ToolBar editor={editor} handleImageUpload={handleImageUpload}/>

   {editor && (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 300, animation: "fade"}}
      shouldShow={({ editor }) => {
        const hasSelection = !editor.state.selection.empty

        const isCorrectBlock = editor.isActive("paragraph") || editor.isActive("heading")

        return hasSelection && isCorrectBlock
      }}
    >
      <BubbleMenuButtons editor={editor}/>
    </BubbleMenu> 
    )}

  {editor && (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, animation: "fade"}}
      size="small"
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
          Do lewej
        </button>
        
        <button
          onClick={() => setImageAlignment('center', editor)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            editor.isActive('imageResize', { class: 'block mx-auto clear-both my-4' }) 
              ? 'bg-emerald-100 text-emerald-700 font-semibold' 
              : 'hover:bg-gray-100'
          }`}
        >
          Wyśrodkuj
        </button>
        
        <button
          onClick={() => setImageAlignment('right', editor)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            editor.isActive('imageResize', { class: 'float-right ml-4 mb-2 clear-none' }) 
              ? 'bg-emerald-100 text-emerald-700 font-semibold' 
              : 'hover:bg-gray-100'
          }`}
        >
          Do prawej
        </button>
      </div>
    </BubbleMenu>
  )}
    
    <div className="h-screen w-screen flex justify-center">
      <div className="prose prose-slate max-w-none w-[90%] h-[500px] border prose-markers:text-slate-900
    border-gray-300 rounded-b-md p-3 focus-within:border-slate-500 transition-all line-height-1.5">
        <EditorContent editor={editor} />
      </div>
    </div>
  </>
  )
}


export default TipTapEditor