import { Mark, mergeAttributes } from "@tiptap/core";

export const CustomHighlight = Mark.create({
  name: "customHighLight",

  addOptions() {
    return {
      defaultColor: "#fef08a", // Żółty jako fallback,
      defaultBorderRadius: "4px"
    }
  },

  // 👇 1. REJESTRACJA ATRYBUTU: Informuje Tiptapa, że ten Mark może przechowywać kolor
  addAttributes() {
    return {
      color: {
        default: this.options.defaultColor,
        // Parsuje kod HTML i wyciąga istniejący kolor ze stylów inline (np. przy wklejaniu tekstu)
        parseHTML: element => element.style.backgroundColor || this.options.defaultColor,
        // Generuje styl inline dla renderowanego znacznika <mark>
        renderHTML: attributes => {
          if (!attributes.color) return {};
          return {
            style: `background-color: ${attributes.color};`,
          };
        },
      },

      borderRadius: {
        default: this.options.defaultBorderRadius,
        parseHTML: element => element.style.borderRadius || this.options.defaultBorderRadius,
        renderHTML: attributes => {
          if (!attributes.borderRadius) return {};
          return {
            style: `border-radius: ${attributes.borderRadius}; padding: 0 4px`
          }
        }
      }

    };
  },

  parseHTML() {
    return [
      {
        tag: "mark"
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      // 👇 2. MERGE ATTRIBUTES: Łączy podstawowe atrybuty (w tym nasz wygenerowany styl koloru)
      mergeAttributes(HTMLAttributes),
      0
    ]
  },

  // 👇 3. AKTUALIZACJA KOMEND: Pozwalamy metodom przyjmować opcjonalny obiekt z kolorem
  addCommands() {
    return {
      setHighLight: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes)
      },
      toggleHighLight: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes)
      },
      unsetHighLight: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  }
})

// 👇 4. TYPOWANIE: Aktualizacja interfejsu TypeScript, aby podpowiadał argument 'color'
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customHighLight: {
      setHighLight: (attributes?: { color?: string, borderRadius?: string }) => ReturnType,
      toggleHighLight: (attributes?: { color?: string, borderRadius?: string }) => ReturnType,
      unsetHighLight: () => ReturnType,
    }
  }
}