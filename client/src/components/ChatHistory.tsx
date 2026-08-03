import { useState } from "react";
import { Plus, MessageSquare, ChevronDown, Clock, Sparkles } from "lucide-react";
import ChatHistoryItem from "./ChatHistoryItem";


type ChatMetaData = {
  id: string
  emoji: string,
  title: string
}

type ChatHistoryProps = {
  chatHistory: ChatMetaData[];
  onNewChat?: () => void;
  onSelectChat?: (id: string) => void;
  activeChatId?: string;
};



export default function ChatHistory({
  chatHistory,
  onNewChat,
  onSelectChat,
  activeChatId,
}: ChatHistoryProps) {

  const [showAll, setShowAll] = useState(false);

  // Wyświetlamy 4 elementy domyślnie lub wszystkie po kliknięciu "Pokaż więcej"
  const visibleChats = showAll ? chatHistory : chatHistory.slice(0, 4);

  return (
    <div className="w-full max-w-[600px] ml-auto mr-auto h-full flex flex-col p-4 justify-between gap-4 mt-11">
      {/* Góra: Przycisk Nowy Czat + Nagłówek */}
      <div className="flex flex-col gap-3"> 
        
        {/* Przycisk "+ Nowy czat" dopasowany do przycisków w Notium */}
        <button
          onClick={onNewChat}
          className="w-full p-3 bg-white border border-gray-200 rounded-[10px] 
                     hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 
                     transition-all duration-200 cursor-pointer text-left group 
                     flex items-center justify-center gap-2.5"
        >
          <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600 transition-colors shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[13px] font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
            New chat
          </span>
        </button>

        {/* Etykieta sekcji */}
        <div className="flex items-center justify-between px-1 mt-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Recent
            </span>
          </div>
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {chatHistory.length}
          </span>
        </div>

        {/* Lista ostatnich czatów */}
        <div className="flex flex-col gap-1.5">
          {visibleChats.map((chatTitle, index) => {

            const isActive = chatTitle.id === activeChatId;
            console.log("chatTitle:", chatTitle);
            

            return (
              <ChatHistoryItem
                key={chatTitle.id}
                id={chatTitle.id}
                chatTitle={chatTitle.title}
                isActive={isActive}
                onSelectChat={onSelectChat}
                delay={(index + 1) * 65}
                emoji={chatTitle.emoji} // Example: different icons for active/inactive chats
              />
            );
          })}
        </div>
      </div>

      {/* Dół: Przycisk "View more / Pokaż więcej" */}
      {chatHistory.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 px-3 bg-gray-100/70 hover:bg-gray-200/60 text-gray-600 
                     text-[12px] font-medium rounded-[10px] transition-colors 
                     flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{showAll ? "show less" : "show more"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              showAll ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}