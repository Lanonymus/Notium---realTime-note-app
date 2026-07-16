import { AiBlockView } from "@/components/AiBlockView"
import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

export interface AiBlockAttributes {
    id: number,
    content: string,
    status: "streaming" | "completed"
}



export const AiBlock = Node.create({
    name: "aiBlock",
    group: "block", // traktujemy jako niezależny blok typu paragraf
    atom: false, // użytkownik nie może kliknąć w środek
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            id: { default: null },
            content: { default: "" },
            status: { default: "streaming"},
            userSelectedContent: { default: null }
        }
    },

    parseHTML() {
        return [{ tag: `div[data-type="ai-block"]`}]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-block'}), 0]
    },


    addNodeView() {
        return ReactNodeViewRenderer(AiBlockView)
    }

}) 