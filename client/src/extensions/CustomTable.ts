import { Table } from "@tiptap/extension-table/table";
import { TableMap } from "@tiptap/pm/tables";
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { AnyCommands } from "@tiptap/react";
import { EditorState, Transaction } from "@tiptap/pm/state";


// rozszerzamy deklaracje typów Tiptapa, aby TS widział nowe komendy
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        customTableCommands: {
            moveColumn: (direction: 'left' | 'right') => ReturnType
            setTableTextColor: (color: string) => ReturnType
            setTableBackground: (color: string) => ReturnType
            setTableTextAlignment: (alignment: 'left' | 'center' | 'right') => ReturnType
            clearTableContents: () => ReturnType
            duplicateTable: () => ReturnType
            // + w przyszłości 
            // changeTableBackground
            // clearTableContents 
            // itp
        }
    }
} 



// Customowe rozszerzenie tabeli w Tiptap
export const CustomTable = Table.extend({
    name: 'customTable',


    addCommands() {
        return {
            // Zachowujemy wszystkie domyślne komendy z oryginalnego Table
            ...this.parent?.(),

            // Dodajemy naszą własną komendę
            moveColumn: (direction: 'left' | 'right') => ({ state, dispatch }) => {
                const { selection } = state
                const { $from } = selection

                let cellDepth = -1
                let tableDepth = -1

                for (let d = $from.depth; d > 0; d--) {
                    const name = $from.node(d).type.name
                    if ((name === 'tableCell' || name === 'tableHeader') && cellDepth === -1) {
                        cellDepth = d
                    }
                    if (name === 'customTable') {
                        tableDepth = d
                        break
                    }
                }

                if (cellDepth === -1 || tableDepth === -1) return false // return false oznacza, że komenda nie może być wykonana

                const tablePos = $from.before(tableDepth)
                const cellPos = $from.before(cellDepth)
                const relativeCellPos = cellPos - tablePos - 1
                console.log(relativeCellPos);
                

                const table = $from.node(tableDepth)
                const map = TableMap.get(table)


                let rect
                try {
                    rect = map.findCell(relativeCellPos)
                } catch (e) {
                    return false
                }
                console.log(rect);
                

                const colIndex = rect.left
                const targetCol = direction === 'left' ? colIndex - 1 : colIndex + 1

                if (targetCol < 0 || targetCol >= map.width) return false

                if (dispatch) {
                    const newRows: any[] = []

                    table.forEach((rowNode) => {
                        const cells: any[] = []
                        rowNode.forEach((cellNode) => {
                        cells.push(cellNode)
                        })

                        if (cells[colIndex] && cells[targetCol]) {
                        const temp = cells[colIndex]
                        cells[colIndex] = cells[targetCol]
                        cells[targetCol] = temp
                        }

                        newRows.push(rowNode.type.create(rowNode.attrs, cells, rowNode.marks))
                })

                const newTable = table.type.create(table.attrs, newRows, table.marks)
                const tr = state.tr.replaceWith(tablePos, tablePos + table.nodeSize, newTable)
                
                dispatch(tr)
                }

                return true // Sukces
            },
            

            // Funkcja do zmiany koloru tekstu w tabeli
            setTableTextColor: (color: string) => ({ state, dispatch}: {state: any, dispatch: any}) => {
                const { tr, schema } = state;
                const $pos = state.selection.$anchor;

                // Pobieramy typ znacznika textStyle z konfiguracji edytora
                const markType = schema.marks.textStyle;
                if (!markType) {
                    console.error("Brak rozszerzenia TextStyle w konfiguracji Tiptap!");
                    return false;
                };

                
                let applied = false;

                for (let d = $pos.depth; d > 0; d--) {
                    const node = $pos.node(d);

                    if (node.type.name === 'customTable') {
                        const tableStart = $pos.start(d);

                        node.descendants((child: any, pos: any) => {
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
                                applied = true;
                            }
                        });

                        // Wypychamy zmiany jednym błyskiem do DOM
                        if (applied && dispatch) {
                            console.log('test: ', tr);
                            
                            dispatch(tr)
                            break
                        }
                    }
                }

                return true;
            },

            // Funkcja do zmiany tła backgrounda tabeli
            setTableBackground: (color: string) => ({ state, dispatch} : { state: any, dispatch: any}) => {
                const { tr } = state
                // $anchor - kotwica obiekt gps to lokalizacji tego klikniecia / zaznaczenia
                const $pos = state.selection.$anchor

                if(dispatch) {
                    for (let d = $pos.depth; d > 0; d--) {
                        const node = $pos.node(d)

                        if(node.type.name === "customTable") {
                        const tableStart = $pos.start(d)

                        node.descendants((child: any, pos: any) => {
                            if(child.type.name === "tableHeader" || child.type.name === "tableCell") {
                            const cellStart = tableStart + pos;

                            tr.setNodeAttribute(cellStart, "backgroundColor", color)
                            }
                        })

                        break;
                        }
                    }                      
                }    
                return true;
            },
            
            // Funkcja do pozycjonowania tekstu
            setTableTextAlignment: (alignment: 'left' | 'center' | 'right') => ({ state, dispatch}: { state: any, dispatch: any}) => {
                const { tr } = state;
                const $pos = state.selection.$anchor;


                if(dispatch) {
                    for (let d = $pos.depth; d > 0; d--) {
                        const node = $pos.node(d);

                        if (node.type.name === 'customTable') {
                        const tableStart = $pos.start(d);

                        node.descendants((child: any, pos: AnyCommands) => {
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

                        dispatch(tr)
                        break;
                        }
                    }
                }

                return true;
            },

            // Funkcja do czyszczenia zawartości tabeli
            clearTableContents: () => ({ state, dispatch }: { state: any, dispatch: any }) => {
                const { tr } = state
                const $pos = state.selection.$anchor

                let tableNode = null
                let tableStart = 0

                for(let d = $pos.depth; d > 0; d--) {
                    const node = $pos.node(d)
                    if (node.type.name === "customTable") {
                        tableNode = node
                        tableStart = $pos.start(d)
                        break;
                    }
                }
                
                if (!tableNode) return false

                tableNode.descendants((child: any, pos: any) => {
                    
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
                    dispatch(tr)
                }

                return true;
            },

            duplicateTable: () => ({ state, dispatch}: { state: any, dispatch: any}) => {
                const { tr, schema } = state
                const $pos = state.selection.$anchor

                let tableNode = null
                let insertPos = 0

                for(let d = $pos.depth; d > 0; d--) {
                    const node = $pos.node(d)
                    if( node.type.name === "customTable") {
                        tableNode = node
                        insertPos = $pos.after(d)
                        break;
                    }
                }

                if(!tableNode) return false;

                const emptyParapgraph = schema.nodes.paragraph.create()


                tr.insert(insertPos, [ emptyParapgraph, tableNode ])

                if(tr.docChanged){
                    dispatch(tr)
                }

                return true;
            },
        }
    },
})




// 1. Rozszerzenie dla zwykłych komórek (td)
export const CustomTableCell = TableCell.extend({
    // name: 'customTableCell',


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
    // name: 'customTableHeader',

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