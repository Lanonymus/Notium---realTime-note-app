import { AiBlock } from "@/extensions/AiBlock";
import { CustomHighlight } from "@/extensions/CustomHighlight";
import { CustomImage } from "@/extensions/CustomImage";
import { ImageDeleteWatcher } from "@/extensions/ImageDeleteWatcher";
import { KeyBoardShortcuts } from "@/extensions/KeyBoardShortcuts";
import { TableExtensions } from "@/extensions/TableExtensions";
import { mergeClassNames } from "@base-ui/react";
import { Focus } from "@tiptap/extension-focus";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect } from "react";



interface RichEditorProps {
    value: string,
    onChange?: (html: string) => void,
    isEditing: boolean,
    placeholder?: string,
    onFocus?: (editor: Editor) => void,
    isOnlyView?: boolean,
    additionalClassName?: string, // Nowe pole,
    studyMode?: boolean,
    alwaysNativeEditor?: boolean
}

export function RichEditor({ value, onChange, isEditing, onFocus, isOnlyView, additionalClassName, studyMode, alwaysNativeEditor } : RichEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
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
            Placeholder.configure({
                placeholder: "„Naciśnij '/' aby dodać nagłówek, obraz, tabelę lub wywołać AI...”",
                includeChildren: true,
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
        content: value,
        editable: isOnlyView ? false : isEditing,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
        },
        onFocus: ({ editor }) => {
            onFocus?.(editor);
        },
        onSelectionUpdate: ({ editor }) => {
            onFocus?.(editor)
        },
        // W konfiguracji Tiptap (editorProps)
        editorProps: {
        attributes: {
            // Użycie dynamicznych klas zamiast sztywnych
            class: `focus:outline-none prose prose-sm ${additionalClassName} dark:prose-invert max-w-none min-h-[120px] p-3`,
        },
        },
    })


    // podczas zmiany fiszki aktywnej (przełączenie id lub zmiana treści)
    useEffect(() => {
        if(editor && value !== editor.getHTML()) {
            editor.commands.setContent(value)
        }
    },[value, editor])

    // blokada możliwośc edytowania
    useEffect(() => {
        if(editor) {
            editor.setEditable(isOnlyView ? false : isEditing)
        }
    },[isEditing, editor, isOnlyView])

    
    if(alwaysNativeEditor || isOnlyView) {
        return (
            <div>
                <EditorContent editor={editor}/>            
            </div>
        )
    }
    
    if(isEditing ) {
        return (
            <div>
                <EditorContent editor={editor}/>            
            </div>
        )
    }
    
    if(studyMode) {
        return (
            <div
                className={`
                ${isOnlyView || studyMode ? `text-[38px] lg:text-[44px] leading-[1.15] font-normal tracking-[-0.035em] text-[#282e3e]`
                : `min-h-[120px] text-[15px] leading-6 text-[#282e3e] prose prose-sm max-w-none`} 
                
                `}
                dangerouslySetInnerHTML={{ __html: value || "<span className='text-gray-400'>Empty</span>"}}
            />
        )
    }    
}

