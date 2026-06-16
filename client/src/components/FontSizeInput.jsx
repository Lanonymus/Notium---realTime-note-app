import { useEffect, useRef, useState } from "react"

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon  } from '@hugeicons/core-free-icons';
import { ArrowRight01Icon  } from '@hugeicons/core-free-icons';
import FontSizePreview from "./FontSizePreview";


export default function FontSizeInput({ onFontSizeChange, cFontSize }) {

  const fontSizesList = Array.from({ length: 47 }, (_, i) => i + 4);  


  const [showFonts, setShowFonts] = useState(false)
  const [previewFontSize, setPreviewFontSize] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [fontSize, setFontSize] = useState(15)
  // const fontSize = useStore((state) => state.lastFontSize)
  // const setFontSize = useStore((state) => state.setLastFontSize)

  useEffect(() => {
    if(cFontSize) {
      setFontSize(cFontSize)
    }
  },[cFontSize])


  const fontRef = useRef(null)

  // klik poza refem - wykryje czy kilkamy w kontener poza refem
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fontRef.current && !fontRef.current.contains(e.target)) {
        setShowFonts(false)
        setPreviewFontSize(null); // schowaj preview
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])


  return (
      <div
        ref={fontRef}
        className={`
          border-1 border-gray-300  text-gray-800
          relative cursor-pointer border-l-0 rounded-tr-[4px] rounded-br-[4px] ${showFonts ? "border-l-1" : ""} 
          ${showFonts ? "border-gray-400" : ""}
        `}
      >
        <div className="flex justify-between">
          <input
            type="text"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value)
            }}
            className={`focus:outline-none w-[25px] ml-2 text-[16px]`}
          />
          <div className="py-1 h-full px-1 hover:bg-gray-100">
            <HugeiconsIcon
              onMouseDown={(e) => {
                e.preventDefault()
                setShowFonts(!showFonts)
              }}
              className="text-gray-800"
              icon={ArrowDown01Icon}
            />
          </div>
        </div>

        {/* dropdown */}
        <div
          className={`
            scrollable-fonts
            absolute left-1/2 translate-x-[-50%]
            outline-1 outline-gray-300 rounded-[3px] py-3
            bg-white duration-150 shadow-xl shadow-gray-300
            max-h-[550px] w-[100px] overflow-y-auto z-3
  
            ${showFonts 
              ? "opacity-100 pointer-events-auto top-[45px]" 
              : "opacity-0 pointer-events-none top-[30px]"}
          `}
        >
            {fontSizesList.map((fontSize) => (
              <div
                key={fontSize}
                className="py-[5px] hover:bg-gray-100 text-gray-600 text-[14px] relative"
                onMouseEnter={(e) => {
                  // gdzie pokazać preview
                  const rect = e.target.getBoundingClientRect();
                  setPreviewFontSize(fontSize);
                  setPreviewPosition({
                    top: rect.top,
                    left: rect.right + 5
                  });
                }}
                onMouseLeave={() => setPreviewFontSize(null)}
                onClick={() => {
                  setFontSize(fontSize);
                  setShowFonts(false);
                  onFontSizeChange?.(fontSize) // Przekazujemy wielkość czcionki
                }}
              >
                <div className="flex justify-between px-2">
                  {fontSize}
                  <HugeiconsIcon icon={ArrowRight01Icon} />
                </div>
              </div>
                ))
            }
          
        </div>
        {/* Preview wyprowadzony do PORTALA */}
        <FontSizePreview
          fontSize={previewFontSize}
          visible={!!previewFontSize}
          position={previewPosition}
          text="This is an example text to show how this font looks in larger scale"
        />

      </div>
  )
}