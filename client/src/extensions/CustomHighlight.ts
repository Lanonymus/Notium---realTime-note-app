import { Mark, mergeAttributes } from "@tiptap/core";



export const CustomHighlight = Mark.create({
    name: "customHighLight",

    addOptions() {
        return {
            defaultColor: "#fef08a"
        }
    },


    parseHTML() {
        return [
            {
                tag: "mark"
            }
        ]
    },

    renderHTML({ HTMLAttributes}) {

        return [
            "mark",
            mergeAttributes(HTMLAttributes, {
                style: `background-color: ${this.options.defaultColor}; border-radius: 4px; padding: 0 4px; `
            }),
            0
        ]
    },

    addCommands() {
        return {
            toggleHighLight: () => ({ commands }: { commands: any }) => {
                return commands.toggleMark(this.name)
            }
        }
    }
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customHighLight: {
      toggleHighLight: () => ReturnType,
    }
  }
}