import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

// 1. Rozszerzenie dla zwykłych komórek (td)
export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // Zachowaj domyślne atrybuty Tiptapa (np. colspan, rowspan)
      backgroundColor: {
        default: null,
        // Jak silnik ma odczytać kolor z gotowego kodu HTML (np. przy wczytywaniu bazy danych)?
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor,
        // Jak silnik ma wyrenderować kolor z powrotem do drzewa DOM przeglądarki?
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {}
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          }
        },
      },
    }
  },
})

// 2. Rozszerzenie dla komórek nagłówkowych (th)
export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {}
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          }
        },
      },
    }
  },
})