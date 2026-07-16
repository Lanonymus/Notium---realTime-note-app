import { Extension } from "@tiptap/core";


export const KeyBoardShortcuts = Extension.create({
    name: "keyboardShortcuts",

    addKeyboardShortcuts() {
        return {
            // Mod automatycznie dopasowywuje ctrl dla windowsa i Cmd dla macOS
            "Mod-P": () => {
                this.editor.chain().focus().setParagraph().run()
                return true;
            },
            "Mod-p": () => {
                this.editor.chain().focus().setParagraph().run()
                return true;
            },

            "Mod-1": () => {
                this.editor.chain().focus().toggleHeading({ level: 1 }).run()
                return true;
            },
            "Mod-2": () => {
                this.editor.chain().focus().toggleHeading({ level: 2 }).run()
                return true;
            },
            "Mod-3": () => {
                this.editor.chain().focus().toggleHeading({ level: 3 }).run()
                return true;
            },

            "Mod-Q": () => {
                this.editor.chain().focus().toggleBlockquote().run()
                return true;
            },
            "Mod-q": () => {
                this.editor.chain().focus().toggleBlockquote().run()
                return true;
            }
        }
    }
})