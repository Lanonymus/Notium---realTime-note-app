
type Choice = { value: string; label: string; detail?: string; src?: string };


function Tick({ checked = false }: { checked?: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-blue-600 bg-blue-600" : "border-gray-200"}`}
      aria-hidden="true"
    >
      {checked && (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
          <path
            d="m4 10 4 4 8-8"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}


export default function Choices({
  options,
  value,
  onChange,
  columns = false,
  illustrated = false,
  label,
}: {
  options: Choice[];
  value: string;
  onChange: (v: string) => void;
  columns?: boolean;
  illustrated?: boolean;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid w-full gap-3 ${illustrated ? "grid-cols-2 sm:grid-cols-4" : columns ? "sm:grid-cols-2" : "grid-cols-1"}`}
    >
      {options.map((item, index) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === item.value}
          tabIndex={
            value ? (value === item.value ? 0 : -1) : index === 0 ? 0 : -1
          }
          key={item.value}
          onKeyDown={(e) => {
            if (
              [
                "ArrowRight",
                "ArrowDown",
                "ArrowLeft",
                "ArrowUp",
                "Home",
                "End",
              ].includes(e.key)
            ) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? options.length - 1
                    : (index +
                        (e.key === "ArrowRight" || e.key === "ArrowDown"
                          ? 1
                          : -1) +
                        options.length) %
                      options.length;
              onChange(options[next].value);
              (
                e.currentTarget.parentElement?.children[
                  next
                ] as HTMLButtonElement
              )?.focus();
            }
          }}
          
          onClick={() => onChange(item.value)}
          className={`relative flex min-h-[64px] gap-3 ${label === "Streak goal" ?  "rounded-[20px]" : "rounded-[12px]" } border-2 p-4 text-left 
            transition-[border-color,background-color,transform]
             active:scale-[0.99]  focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600
              ${illustrated ? "min-h-[175px] flex-col items-center justify-center text-center sm:min-h-[200px]" : "items-center"}
               ${value === item.value ? "border-blue-600 bg-blue-50" : 
               "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"}`}
        >
          {item.src && (
            <img src={item.src} alt="goal image" className="w-[70px] h-auto shrink-0"/>
          )}
          <span className="flex-1">
            <span className="block text-sm font-semibold text-gray-900">
              {item.label}
            </span>
            {item.detail && (
              <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                {item.detail}
              </span>
            )}
          </span>
          <span className={illustrated ? "absolute right-3 top-3" : ""}>
            <Tick checked={value === item.value} />
          </span>
        </button>
      ))}
    </div>
  );
}