export default function ToolTip({ info = "" }) {
    return (
        <div className="select-none pointer-events-none absolute top-[20px] opacity-0 group-hover:top-[40px] group-hover:opacity-100
        duration-150 left-1/2 -translate-x-1/2 z-[50]">
            <div className="relative bg-white text-gray-500 text-xs px-3 py-2 rounded shadow-md border border-gray-300">
                {info}
                {/* Daszek */}
                <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-[45deg] bg-white border-t border-l border-gray-300" />
            </div>
        </div>
    );
}
