import { Editor } from "@tiptap/core"
import { DOMSerializer } from "@tiptap/pm/model"


export const changeTableTextColor = (editor: Editor, color: string) => {
    const { state, view } = editor;
    const { tr, schema } = state;
    const $pos = state.selection.$anchor;

    // Pobieramy typ znacznika textStyle z konfiguracji edytora
    const markType = schema.marks.textStyle;
    if (!markType) {
        console.error("Brak rozszerzenia TextStyle w konfiguracji Tiptap!");
        return;
    };

    for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d);

        if (node.type.name === 'table') {
        const tableStart = $pos.start(d);

        node.descendants((child, pos) => {
            // Jeśli trafimy na komórkę...
            if (child.type.name === 'tableCell' || child.type.name === 'tableHeader') {
            // Obliczamy początek i koniec jej zawartości
            const cellContentStart = tableStart + pos + 1;
            const cellContentEnd = tableStart + pos + child.nodeSize - 1;
            
            // Nakładamy kolor (znacznik) na całą zawartość komórki w locie
            tr.addMark(
                cellContentStart, 
                cellContentEnd, 
                markType.create({ color })

            );
            }
        });

        // Wypychamy zmiany jednym błyskiem do DOM
        view.dispatch(tr);
        break;
        }
    }
}

export const changeTableBackground = (editor: Editor, color: string | null) => {
    const { state, view } = editor
    const { tr } = state
    // $anchor - kotwica obiekt gps to lokalizacji tego klikniecia / zaznaczenia
    const $pos = state.selection.$anchor

    for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d)

        if(node.type.name === "table") {
        const tableStart = $pos.start(d)

        node.descendants((child, pos) => {
            if(child.type.name === "tableHeader" || child.type.name === "tableCell") {
            const cellStart = tableStart + pos;

            tr.setNodeAttribute(cellStart, "backgroundColor", color)
            }
        })

        view.dispatch(tr);
        break;
        }
    }
}




export const changeAllTextAlignment = (editor: Editor, alignment: 'left' | 'center' | 'right') => {
    const { state, view } = editor;
    const { tr } = state;
    const $pos = state.selection.$anchor;

    for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d);

        if (node.type.name === 'table') {
        const tableStart = $pos.start(d);

        node.descendants((child, pos) => {
            // Szukamy węzłów blokowych, które mogą przyjąć wyrównanie (np. paragraf)
            // Ignorujemy same struktury tabeli (wiersze, komórki)
            if (
            child.isBlock && 
            child.type.name !== 'tableRow' && 
            child.type.name !== 'tableCell' && 
            child.type.name !== 'tableHeader'
            ) {
            // Obliczamy absolutną pozycję tego paragrafu w dokumencie
            const nodePos = tableStart + pos;
            
            // Zmieniamy atrybut wyrównania dla tego konkretnego paragrafu
            tr.setNodeAttribute(nodePos, 'textAlign', alignment);
            }
        });

        view.dispatch(tr);
        break;
        }
    }
}

export const clearTableContents = (editor: Editor) => {
    const { state, view } = editor
    const { tr } = state
    const $pos = state.selection.$anchor

    let tableNode = null
    let tableStart = 0

    for(let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d)
        if (node.type.name === "table") {
            tableNode = node
            tableStart = $pos.start(d)
            break;
        }
    }
    
    if (!tableNode) return

    tableNode.descendants((child, pos) => {
        
        if(child.isBlock && child.type.name !== "tableHeader" && child.type.name !== "tableCell" && child.type.name !== "tableRow") {
            const originalPos = tableStart + pos

            const updatedPos = tr.mapping.map(originalPos)
            
            let from = updatedPos + 1
            let to = updatedPos + child.nodeSize - 1
            if(from < to) {
                tr.delete(from, to)
            }
        }
    }) 

    if(tr.docChanged){
        view.dispatch(tr)
    }

}


export const duplicateTable = (editor: Editor) => {
    const { state, view } = editor
    const { tr, schema } = state
    const $pos = state.selection.$anchor

    let tableNode = null
    let insertPos = 0

    for(let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d)
        if( node.type.name === "table") {
            tableNode = node
            insertPos = $pos.after(d)
            break;
        }
    }

    if(!tableNode) return

    const emptyParapgraph = schema.nodes.paragraph.create()


    tr.insert(insertPos, [ emptyParapgraph, tableNode ])

    if(tr.docChanged){
        view.dispatch(tr)
    }
}




// 1. Szybki parser: Tiptap Table Node -> Markdown String
const tableToMarkdown = (tableNode: any) => {
  let markdown = '';
  let isFirstRow = true;

  // Iterujemy przez wiersze (tableRow)
  tableNode.forEach((row: any) => {
    let rowString = '|';
    let separatorString = '|';

    // Iterujemy przez komórki w wierszu (tableCell / tableHeader)
    row.forEach((cell: any) => {
      // Pobieramy czysty tekst, usuwamy entery (zastępujemy spacją), aby nie zepsuć struktury MD
      const cellText = cell.textContent.replace(/\n/g, ' ').trim();
      
      rowString += ` ${cellText || ' '} |`;
      
      // Jeśli to pierwszy wiersz nagłówkowy, budujemy separator typu |---|---|
      if (isFirstRow) {
        separatorString += ' --- |';
      }
    });

    markdown += `${rowString}\n`;
    
    // Wklejamy separator zaraz pod pierwszym wierszem
    if (isFirstRow) {
      markdown += `${separatorString}\n`;
      isFirstRow = false;
    }
  });

  return markdown;
};

// 2. Główna funkcja schowka
export const copyTableToClipboard = async (editor: Editor) => {
  const { state } = editor;
  const $pos = state.selection.$anchor;

  // Znajdujemy bazową tabelę
  let tableNode = null;
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (node.type.name === "table") {
      tableNode = node;
      break;
    }
  }

  if (!tableNode) return;

  // Przygotowanie warstwy 1: HTML dla edytora Tiptap (żeby działało wklejanie wewnątrz aplikacji)
  const domSerializer = DOMSerializer.fromSchema(state.schema);
  const domNode = domSerializer.serializeNode(tableNode);
  const tmpDiv = document.createElement('div');
  tmpDiv.appendChild(domNode);
  const htmlString = tmpDiv.innerHTML;

  // Przygotowanie warstwy 2: Markdown dla Agenta AI Notium
  const markdownString = tableToMarkdown(tableNode);

  try {
    // Wrzucamy pakiety do schowka systemowego
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([htmlString], { type: 'text/html' }),
        'text/plain': new Blob([markdownString], { type: 'text/plain' })
      })
    ]);
    
    console.log("Tabela pomyślnie skopiowana do schowka.");
  } catch (error) {
    console.error("Błąd zapisu do schowka:", error);
  }
};






