import { MessageSquare } from "lucide-react";

type ChatHistoryItemProps = {
    id: string,
    chatTitle: string
    isActive: boolean;
    onSelectChat?: (chatId: string) => void;
    delay?: number; // Optional delay prop for animation
    emoji: string // Icon prop to pass the icon component
};


export default function ChatHistoryItem({
    id,
    chatTitle,
    isActive,
    onSelectChat,
    delay = 0, // Default delay to 0 if not provided,
    emoji = "👌"
} : ChatHistoryItemProps) {
    return (
        <button
        key={id}
        onClick={() => onSelectChat?.(id)}
        style={{ animationDelay: `${delay}ms` }} // Apply the delay for animation
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
            {/* <MessageSquare className="w-3.5 h-3.5" /> */}
            {emoji}
        </div>
        <span className="text-[12px] truncate flex-1">
            {chatTitle}
        </span>
        </button>
    )
}