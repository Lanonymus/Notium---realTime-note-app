import { Dispatch, SetStateAction } from "react";



type SegmentedControlProps = {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  ariaLabel: string;    
}


export default function SegmentedControl({
  value,
  options,
  onChange,
  ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-full bg-[#f7f7f7] p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={active}
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-[14px] font-[550] transition-[background,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-[#155dfc] focus-visible:outline-offset-2 ${
              active
                ? "bg-white text-[#111] shadow-[0_2px_8px_#00000012]"
                : "text-[#969696] hover:text-[#555]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}