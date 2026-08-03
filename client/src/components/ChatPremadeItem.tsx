


type ChatPremadeItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  delay: number
};

export default function ChatPremadeItem({ icon, title, description, onClick, delay = 0 }: ChatPremadeItemProps) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="p-3.5 animate-face-down bg-white border border-gray-200 rounded-[10px] hover:border-blue-400 
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 
                cursor-pointer text-left group flex items-start gap-3"
    >
      <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600 transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
          {title}
        </span>
        <span className="text-[11px] text-gray-400 line-clamp-1">
          {description}
        </span>
      </div>
    </button>
  );
}