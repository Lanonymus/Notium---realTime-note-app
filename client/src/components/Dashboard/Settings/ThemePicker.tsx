import { useId } from "react";

type ColorMode = "auto" | "light" | "dark";
type ThemePickerProps = {
  value: ColorMode;
  onChange: (value: ColorMode) => void;
};

const modes = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

function ThemePreview({ mode, desktop = false }: { mode: ColorMode; desktop?: boolean }) {
  const half = `theme-half-${useId().replace(/:/g, "")}`;
  function scene(dark: boolean) {
    if (desktop) {
      const surface = dark ? "#1b1d21" : "#ffffff";
      const border = dark ? "#36383e" : "#dfe1e5";
      const muted = dark ? "#40444c" : "#dcdfe5";
      return (
        <g>
          <rect width="240" height="160" fill={dark ? "#292b30" : "#edeef0"} />
          <rect x="20" y="24" width="200" height="151" rx="10"
            fill={surface} stroke={border} strokeWidth="1.5" />
          <path d="M20 47H220M70 47V160" stroke={border} />
          {[31, 39, 47].map((x) => <circle key={x} cx={x} cy="36" r="2" fill={muted} />)}
          <rect x="84" y="32" width="80" height="8" rx="4"
            fill={dark ? "#2b2e34" : "#f0f1f3"} />
          <rect x="29" y="61" width="32" height="12" rx="4"
            fill={dark ? "#303c53" : "#e8eef9"} />
          <rect x="35" y="66" width="20" height="3" rx="1.5" fill="#819ac5" />
          <rect x="33" y="83" width="24" height="4" rx="2" fill={muted} />
          <rect x="33" y="96" width="19" height="4" rx="2" fill={muted} />
          <rect x="85" y="63" width="73" height="7" rx="3.5" fill={muted} />
          <rect x="85" y="78" width="105" height="4" rx="2"
            fill={dark ? "#2b2e34" : "#eceef1"} />
          <rect x="85" y="94" width="119" height="42" rx="7"
            fill={dark ? "#26292f" : "#f3f4f6"} />
          <rect x="95" y="105" width="46" height="4" rx="2" fill={muted} />
          <rect x="95" y="115" width="86" height="4" rx="2"
            fill={dark ? "#34383f" : "#e5e7eb"} />
          <rect x="85" y="145" width="35" height="10" rx="5"
            fill={dark ? "#667da9" : "#a7bce3"} />
        </g>
      );
    }
    return (
      <g>
        <rect width="180" height="160" fill={dark ? "#292b30" : "#edeef0"} />
        <rect x="24" y="29" width="132" height="153" rx="16"
          fill={dark ? "#1b1d21" : "#ffffff"}
          stroke={dark ? "#36383e" : "#dfe1e5"} strokeWidth="1.5" />
        <rect x="72" y="38" width="36" height="5" rx="2.5"
          fill={dark ? "#0f1012" : "#25272c"} />
        <rect x="44" y="62" width="72" height="10" rx="5"
          fill={dark ? "#34373d" : "#e9ebee"} />
        <rect x="44" y="82" width="91" height="5" rx="2.5"
          fill={dark ? "#2b2e34" : "#f0f1f3"} />
        <rect x="36" y="104" width="108" height="58" rx="10"
          fill={dark ? "#26292f" : "#f3f4f6"} />
        <rect x="48" y="116" width="44" height="5" rx="2.5"
          fill={dark ? "#40444c" : "#dcdfe5"} />
        <rect x="48" y="128" width="72" height="4" rx="2"
          fill={dark ? "#34383f" : "#e5e7eb"} />
        <rect x="48" y="140" width="28" height="9" rx="4.5"
          fill={dark ? "#667da9" : "#a7bce3"} />
      </g>
    );
  }
  return (
    <svg viewBox={desktop ? "0 0 240 160" : "0 0 180 160"} fill="none" aria-hidden="true"
      focusable="false" className="block h-full w-full">
      <defs><clipPath id={half}><rect x={desktop ? 120 : 90} width={desktop ? 120 : 90} height="160" /></clipPath></defs>
      {scene(mode === "dark")}
      {mode === "auto" && <g clipPath={`url(#${half})`}>{scene(true)}</g>}
    </svg>
  );
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const name = useId();
  return (
    <fieldset className="mb-4 w-full min-w-0 border-0 p-0">
      <legend className="mb-4 p-0 text-[13px] leading-relaxed text-gray-500">
        Choose your preferred color mode
      </legend>
      <div className="grid w-full max-w-[520px] grid-cols-3 gap-3 sm:gap-5 md:max-w-[620px]">
        {modes.map((mode) => {
          const selected = value === mode.value;
          return (
            <label key={mode.value} className="group relative min-w-0 cursor-pointer">
              <input type="radio" name={name} value={mode.value}
                checked={selected} onChange={() => onChange(mode.value)}
                className="peer sr-only" />
              <div className={`relative rounded-[19px] border-2 p-[3px]
                transition-colors duration-150 motion-reduce:transition-none
                peer-focus-visible:outline peer-focus-visible:outline-2
                peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#155dfc]
                ${selected ? "border-[#155dfc]" : "border-transparent group-hover:border-gray-300"}`}>
                {/* Responsive previews: mobile below 768px, desktop from 768px. */}
                <div className="aspect-[180/160] overflow-hidden rounded-[14px] md:hidden">
                  <ThemePreview mode={mode.value} />
                </div>
                <div className="hidden aspect-[240/160] overflow-hidden rounded-[14px] md:block">
                  <ThemePreview mode={mode.value} desktop />
                </div>
                <span aria-hidden="true"
                  className={`absolute bottom-2.5 left-2.5 flex h-5 w-5 items-center
                    justify-center rounded-full border-[1.5px] transition-colors
                    duration-150 motion-reduce:transition-none sm:h-6 sm:w-6
                    ${selected ? "border-white bg-[#155dfc] text-white"
                      : mode.value === "dark" ? "border-white/40 bg-[#292b30]"
                      : "border-gray-300 bg-white"}`}>
                  {selected && (
                    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                      <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </div>
              <span className={`mt-2 block text-center text-[13px] leading-5 sm:text-sm
                ${selected ? "font-semibold text-gray-900"
                  : "font-medium text-gray-500 group-hover:text-gray-800"}`}>
                {mode.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
