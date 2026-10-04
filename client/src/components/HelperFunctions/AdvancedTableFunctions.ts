import { Editor } from "@tiptap/core"
import { DOMSerializer, Node } from "@tiptap/pm/model"





// 1. Szybki parser: Tiptap Table Node -> Markdown String
export const tableToMarkdown = (tableNode: any) => {
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
export const copyTableToClipboard = async (editor: Editor, tableNode: Node) => {
  const { state } = editor;
  
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
}






