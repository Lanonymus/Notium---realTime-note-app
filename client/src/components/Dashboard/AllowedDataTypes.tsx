import type { ButtonHTMLAttributes, ReactNode } from "react";

export default function AllowedDataTypes({
  icon,
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`nh-source-button flex min-h-[43px] w-full items-center justify-center gap-[9px] rounded-full border-2
         border-[#e5e5e5] bg-white px-[9px] py-[10px] text-[13px] font-semibold whitespace-nowrap
          text-[#222] transition-colors duration-150 hover:bg-[#f8f8f8] active:translate-y-[2px] [&>svg]:shrink-0
           @max-[1250px]/home:gap-[5px] @max-[1250px]/home:px-[5px] @max-[1250px]/home:text-[11px] @max-[1250px]/home:[&>svg]:w-[17px]
            @max-[1050px]/home:gap-[9px] @max-[1050px]/home:text-[14px] @max-[720px]/home:text-[13px] ${className}
            shadow-[0px_2px_0px_#e5e5e5] active:shadow-none`}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
