import { createPortal } from "react-dom";

export default function FontPreview({ fontFamily, position, visible, text }) {
  if (!visible) return null;

  return createPortal(
    <div
      className="fixed text-[13px] w-[200px] h-auto rounded-[3px] p-3
    bg-white outline outline-gray-300 shadow-xl shadow-gray-300 z-[999]"
      style={{
        top: position.top,
        left: position.left,
        fontFamily: fontFamily
      }}
    >
      {text}
    </div>,
    document.body
  );
}
