import { motion } from "framer-motion";


type ToggleProps = {

  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}


export default function Toggle({
  checked,
  onChange,
  label,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[50px] shrink-0 rounded-full p-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#155dfc] focus-visible:outline-offset-3 ${
        checked ? "bg-blue-600" : "bg-[#f0f0f0]"
      }`}
    >
      <motion.span
        className="block size-6 rounded-full bg-white shadow-[0_1px_4px_#00000018]"
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}