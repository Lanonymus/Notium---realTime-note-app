import { AnimatePresence, motion } from "framer-motion";

const field =
  "min-h-13 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-600";



export default function OtherAnswerInput({
  id,
  visible,
  value,
  onChange,
  label,
  placeholder,
  reducedMotion,
}: {
  id: string;
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  reducedMotion: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key={id}
          className="overflow-hidden text-left"
          initial={
            reducedMotion
              ? false
              : { height: 0, opacity: 0, y: -6, marginTop: 0 }
          }
          animate={{ height: "auto", opacity: 1, y: 0, marginTop: 12 }}
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { height: 0, opacity: 0, y: -6, marginTop: 0 }
          }
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-900">
            {label}
          </label>
          
          <input
            id={id}
            autoFocus
            type="text"
            maxLength={120}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={field}
            placeholder={placeholder}
            autoComplete="off"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}