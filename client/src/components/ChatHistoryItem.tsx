import { Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Dostosuj ścieżkę do swoich komponentów shadcn

type ChatHistoryItemProps = {
  id: string;
  chatTitle: string;
  isActive: boolean;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void; // Nowy prop do obsługi usuwania
  delay?: number;
  emoji: string;
};

export default function ChatHistoryItem({
  id,
  chatTitle,
  isActive,
  onSelectChat,
  onDeleteChat,
  delay = 0,
  emoji = "👌",
}: ChatHistoryItemProps) {
  return (
    <div
      key={id}
      onClick={() => onSelectChat?.(id)}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-face-down w-full p-2.5 rounded-[10px] text-left transition-all duration-200 
                  flex items-center gap-3 group cursor-pointer border ${
                    isActive
                      ? "bg-blue-50/60 border-blue-200 text-blue-600 font-medium"
                      : "bg-white border-gray-200/60 hover:border-blue-300 hover:bg-gray-50/50 text-gray-600 hover:text-gray-900"
                  }`}
    >
      <div
        className={`p-1.5 rounded-md shrink-0 transition-colors ${
          isActive
            ? "bg-blue-100 text-blue-600"
            : "bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-600"
        }`}
      >
        {emoji}
      </div>

      <span className="text-[12px] truncate flex-1">{chatTitle}</span>

      {/* Przycisk usuwania z Dialogiem Shadcn */}
      <AlertDialog>
        <AlertDialogTrigger
            type="button"
            onClick={(e) => e.stopPropagation()} // Zapobiega przełączeniu czatu przy kliknięciu w kosz
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
            title="Usuń czat"
        >
            <Trash className="w-3.5 h-3.5" />
        </AlertDialogTrigger>

        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. The conversation <span className="text-gray-700 font-bold">&quot;{chatTitle}&quot;</span> will be permanently deleted from your history.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                onClick={() => onDeleteChat?.(id)}
                className="bg-red-500 hover:bg-red-600 text-white"
                >
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>

      </AlertDialog>
    </div>
  );
}