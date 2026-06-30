import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin } from '@tiptap/pm/state';

type remoteCursor = {
    from: number,
    to: number,
    name: string,
    color: string
}

type RemoteCursorStorage = {
  customRemoteCursors: {
    cursors: Record<string, remoteCursor>
  }
}

export const CustomRemoteCursors = Extension.create({
  name: 'customRemoteCursors',

  // 1. Definiujemy dynamiczny storage zamiast statycznych opcji
  addStorage() {
    return {
      cursors: {} as Record<string, remoteCursor>,
    };
  },

  addProseMirrorPlugins() {
    // 2. Wyciągamy referencję do edytora, aby móc odczytywać storage w locie
    const editor = this.editor;
    
    return [
      new Plugin({
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, oldState) {
            return oldState.map(tr.mapping, tr.doc);
          }
        },
        props: {
          // Funkcja decorations() wywoła się na nowo po każdym editor.view.dispatch()
          decorations(state) {
            const decorations: Decoration[] = [];
            
            // 3. Pobieramy zawsze "świeże" dane wprost ze storage
            // Typowanie editor.storage nie zna naszych pól dynamicznych, więc rzutujemy.
            const storage = (editor.storage as any) as RemoteCursorStorage;
            const cursors = storage.customRemoteCursors?.cursors ?? {};

            Object.keys(cursors).forEach((token) => {
                const cursor = cursors[token];
                if (!cursor) return;

                // 🛡️ Zabezpieczenie (BARDZO WAŻNE): 
                // Ignoruj kursor, jeśli wykracza poza aktualną długość dokumentu.
                // (Zapobiega crashom aplikacji "RangeError", gdy ktoś usunie tekst)
                const docSize = state.doc.content.size;
                if (
                  cursor.from < 0 || cursor.from > docSize ||
                  cursor.to   < 0 || cursor.to   > docSize
                ) return;

                // 1. SELEKCJA (ZAZNACZENIE TEKSTU): Jeśli użytkownik zaznaczył obszar
                if (cursor.from !== cursor.to) {
                    const start = Math.min(cursor.from, cursor.to);
                    const end = Math.max(cursor.from, cursor.to);

                    decorations.push(
                        Decoration.inline(start, end, {
                        class: 'collaboration-cursor__selection',
                        style: `background-color: ${cursor.color}33;`, // Dodajemy "33" na końcu koloru HEX, aby dać mu ~20% przezroczystości (alfa)
                        })
                    );
                }

                decorations.push(
                    Decoration.widget(cursor.from, () => {
                    const label = document.createElement('span');
                    label.className = 'collaboration-cursor__caret';
                    label.style.borderColor = cursor.color;

                    const textAttr = document.createElement('span');
                    textAttr.className = 'collaboration-cursor__label';
                    textAttr.style.backgroundColor = cursor.color;
                    textAttr.innerText = cursor.name;

                    label.appendChild(textAttr);
                    return label;
                    })
                );
                });

            return DecorationSet.create(state.doc, decorations);
          }
        }
      })
    ];
  }
});