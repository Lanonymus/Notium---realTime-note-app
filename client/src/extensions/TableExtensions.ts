import { TableRow } from "@tiptap/extension-table";
import { CustomTable } from "./CustomTable";
import { CustomTableCell, CustomTableHeader } from "./CustomTable";




export const TableExtensions = [
    CustomTable.configure({
        resizable: true,
        HTMLAttributes: {
            class: 'border-separate border-spacing-0 table-auto w-full my-[25px] !rounded-[4px]', // bazowe klasy Tailwinda dla tabeli
    },
    }),
    TableRow,
    CustomTableCell.configure({
    HTMLAttributes: {
        class: 'border border-gray-300 p-2 min-w-[50px] relative hover:ring-2 hover:ring-inset hover:ring-blue-500 transition-shadow cursor-pointer',
    }
    }),
    CustomTableHeader.configure({
    HTMLAttributes: {
        class: 'bg-gray-100 font-bold border border-gray-300 p-2 text-left relative hover:ring-2 hover:ring-inset hover:ring-blue-500 transition-shadow cursor-pointer',
    },
    })
]