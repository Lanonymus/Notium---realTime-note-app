import { ReactNode } from "react";



type StatusBadgeProps = {
  children: ReactNode;
  tone: "green" | "blue";
  icon?: ReactNode;
};

export default function StatusBadge({ 
  children, 
  tone, 
  icon 
}: StatusBadgeProps) {
  return (
    <span
      className={`flex justify-center items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-[750] tracking-[0.45px] ${
        tone === "green" ? "bg-[#eaf8ee] text-[#159447]" : "bg-[#eef1ff] text-[#4f62d9]"
      }`}
    >
      {children}
    </span>
  );
}