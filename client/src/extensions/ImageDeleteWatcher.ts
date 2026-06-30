import { Extension } from '@tiptap/core'

export const ImageDeleteWatcher = Extension.create({
  name: 'imageDeleteWatcher',

  // 1. Definiujemy opcje, które rozszerzenie może przyjąć z zewnątrz
  addOptions() {
    return {
      onImageDelete: (url: string) => {},
    }
  },

  // 2. Wbudowany w Tiptapa "nasłuchiwacz" na każdy ruch w edytorze
  onTransaction({ transaction }) {
    // Jeśli transakcja nic nie zmieniła w dokumencie (np. to było tylko kliknięcie/przesunięcie kursora), to przerywamy
    if (!transaction.docChanged) {
      return
    }

    const isDrop = transaction.getMeta("uiEvent") === "drop"

    if(isDrop) return

    // 3. Analizujemy "kroki" tej transakcji
    transaction.steps.forEach((step: any) => {
      // Interesują nas tylko kroki, które mają początek i koniec (czyli modyfikują jakiś obszar)
      if (step.from !== undefined && step.to !== undefined && step.from < step.to) {
        
        // 4. KLUCZ: Przeszukujemy stan dokumentu "PRZED" tą transakcją
        transaction.before.nodesBetween(step.from, step.to, (node: any) => {
          // Jeśli znajdziemy węzeł typu 'image' i ma on źródło (URL)...
          if (node.type.name === 'image' && node.attrs.src) {
            
            // ...wołamy funkcję, którą przekazałeś w TipTapEditor.tsx!
            this.options.onImageDelete(node.attrs.src)
          }
        })
      }
    })
  },
})