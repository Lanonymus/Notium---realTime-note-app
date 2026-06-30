import { useEffect, useRef, useState } from "react"

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon  } from '@hugeicons/core-free-icons';
import { ArrowRight01Icon  } from '@hugeicons/core-free-icons';
import useFonts from "../../hooks/useFonts";
import FontPreview from "./FontPreview";


export default function FontSearcher({ onFontSelect, cFont }) {

  const fontsData = useFonts()
  let fontsNames = []
  if(fontsData !== null) {
    // console.log(fontsData);
    
    // fontsData.map(family => console.log(family)
    fontsNames = Object.keys(fontsData)
    // console.log(fontsNames);
    
    
  }
  const [showFonts, setShowFonts] = useState(false)
  const [fontSearch, setFontSearch] = useState("Roboto")
  const [searching, setSearching] = useState(false)
  const [previewFont, setPreviewFont] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if(cFont) {
      setFontSearch(cFont)
    }
  },[cFont])


  const getFontFromName = (fontName) => {
    const fontUrl = fontsData[fontName].fonts.regular

    // Generowanie dynamiczne regułe css z linka czcionki .ttf
    const fontFace = `
      @font-face {
        font-family: "${fontName}";
        src: url("${fontUrl}");
      }
    `;

    // Dodajemy do dokumenty style tylko raz
    // dodajemy do dokumentu style tylko raz
    if (!document.getElementById(`font-${fontName}`)) {
      const style = document.createElement("style");
      style.id = `font-${fontName}`;
      style.appendChild(document.createTextNode(fontFace));
      document.head.appendChild(style);
    }

      return fontName
    
  }
  

  const fontRef = useRef(null)

  // klik poza refem - wykryje czy kilkamy w kontener poza refem
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fontRef.current && !fontRef.current.contains(e.target)) {
        setShowFonts(false)
        setSearching(false)
        setPreviewFont(null); // schowaj preview
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  

  // filtrowanie
  const filteredFonts = searching
    ? fontsNames.filter((f) => f.toLowerCase().includes(fontSearch.toLowerCase()))
    : fontsNames

  // warunek kiedy pokazać w ogóle
  const shouldShowDropdown = showFonts || searching

  return (
      <div
        ref={fontRef}
        className={`
          border-1 border-gray-300  text-gray-800
          relative cursor-pointer rounded-tl-[4px] rounded-bl-[4px]
          ${showFonts ? "border-gray-400" : ""}
        `}
      >
        <div className="flex w-[150px] justify-between">
          <input
            type="text"
            value={fontSearch}
            onChange={(e) => {
              setFontSearch(e.target.value)
              setSearching(true)
            }}
            onBlur={() => {
                setTimeout(() => {
                    setSearching(false)
                }, 100);
            }}
            className="focus:outline-none w-[100px] ml-2 text-[16px]"
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
            max-h-[550px] w-[150px] overflow-y-auto z-3
  
            ${shouldShowDropdown 
              ? "opacity-100 pointer-events-auto top-[45px]" 
              : "opacity-0 pointer-events-none top-[30px]"}
          `}
        >
          {filteredFonts.length > 0 ? (
            filteredFonts.map((fontName) => (
              <div
                key={fontName}
                className="py-[5px] hover:bg-gray-100 text-gray-600 text-[14px] relative"
                onMouseEnter={(e) => {
                  // gdzie pokazać preview
                  const rect = e.target.getBoundingClientRect();
                  setPreviewFont(fontName);
                  setPreviewPosition({
                    top: rect.top,
                    left: rect.right + 5
                  });
                }}
                onMouseLeave={() => setPreviewFont(null)}
                onClick={() => {
                  setFontSearch(fontName);
                  setShowFonts(false);
                  setSearching(false);
                  onFontSelect?.(fontName) // przekazujemy wybraną czcionke wyżej w hierarchi
                }}
              >
                <div className="flex justify-between px-2" style={{ fontFamily: getFontFromName(fontName)}}>
                  {fontName}
                  <HugeiconsIcon icon={ArrowRight01Icon} />
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 text-gray-400 text-[14px]">No fonts found :(</div>
          )}
        </div>
        {/* Preview wyprowadzony do PORTALA */}
        <FontPreview
          fontFamily={previewFont}
          visible={!!previewFont}
          position={previewPosition}
          text="This is an example text to show how this font looks in larger scale"
        />

      </div>
  )
}