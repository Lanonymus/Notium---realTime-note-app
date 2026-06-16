import { useEffect, useRef, useState } from "react"

import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBoardIcon   } from '@hugeicons/core-free-icons';
import { ArrowDown01Icon   } from '@hugeicons/core-free-icons';
import useFonts from "../hooks/useFonts";
import FontPreview from "./FontPreview";
import { HexColorPicker } from "react-colorful";


export default function ColorInput({ onColorChange, cColor }) {


    const [showColor, setShowColor] = useState(false)
    const [showGenerator, setShowGenerator] = useState(false)
    const [color, setColor] = useState("#000000")

  useEffect(() => {
    if(cColor) {
      setColor(cColor)
    }
  },[cColor])

    const allColors = [
    // rząd 1 – jasne odcienie
    "#F28B82", // jasny czerwony
    "#FBBC04", // jasny pomarańczowy
    "#FFF475", // jasny żółty
    "#CCFF90", // jasna limonka/zielony
    "#A7FFEB", // jasny turkus
    "#CBF0F8", // jasny niebieski
    "#D7AEFB", // jasny fiolet

    // rząd 2 – średnio jasne
    "#E57373", // średni czerwony
    "#FFA726", // średni pomarańcz
    "#FFD54F", // średni żółty
    "#81C784", // zielony
    "#4DD0E1", // turkus
    "#64B5F6", // niebieski
    "#BA68C8", // fiolet

    // rząd 3 – głębsze, dojrzałe kolory
    "#D32F2F", // czerwony
    "#F57C00", // głęboki pomarańczowy
    "#FBC02D", // mocny żółty
    "#388E3C", // ciemniejszy zielony
    "#0097A7", // morski
    "#1976D2", // niebieski intensywny
    "#7B1FA2", // fiolet głęboki

    // rząd 4 – ciemniejsze, eleganckie
    "#B71C1C", // ciemny czerwony
    "#E65100", // ciemny pomarańczowy
    "#F57F17", // ciemny żółty
    "#1B5E20", // ciemny zielony
    "#006064", // ciemny morski
    "#0D47A1", // ciemny niebieski
    "#4A148C", // ciemny fiolet
    ];



    const rows = 4
    const columns = 7
    

  const ColorRef = useRef(null)

  // klik poza refem - wykryje czy kilkamy w kontener poza refem
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ColorRef.current && !ColorRef.current.contains(e.target)) {
        setShowColor(false)
        setShowGenerator(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])




  return (
      <div
        ref={ColorRef}
        className={`
          border-1 border-gray-300  text-gray-800
          relative cursor-pointer rounded-[4px] hover:bg-gray-50
          ${showColor ? "border-gray-400" : ""}
        `}
      >

          {/* <input
            type="text"
            value={color}
            onChange={(e) => {
              setColor(e.target.value)
            }}
            className="focus:outline-none ml-2 text-[16px] w-[50px]"
          /> */}
          <div className="flex items-center gap-2 pr-4 w-[115px] pl-3 h-full select-none"
            onClick={() => {
                setShowColor(!showColor)
            }}
            >
            <div className="w-[17px] h-[17px] outline-1 outline-gray-300 rounded-[3px] flex justify-center items-center">
                <div className="w-[15px] h-[15px] rounded-[3px]" style={{ background: color}}></div>
            </div>
            <div className="font-Quicksand font-bold text-[14px]">{color}</div>
          </div>
          {/* <div className="py-1 h-full px-1 w-[30px] hover:bg-gray-100">
            <HugeiconsIcon
              onMouseDown={(e) => {
                e.preventDefault()
                setShowColor(!showColor)
              }}
              className="text-gray-800"
              icon={ArrowDown01Icon  }
            />
          </div> */}


        {/* Basic Colors */}
        <div className={`absolute left-1/2 translate-x-[-50%]
            outline-1 outline-gray-300 rounded-[3px] p-2
            bg-white duration-150 shadow-xl shadow-gray-300
            z-3 w-auto
            
            ${showColor 
            ? "opacity-100 pointer-events-auto top-[45px]" 
            : "opacity-0 pointer-events-none top-[30px]"}
            `}>
            <div
            className={` grid gap-2 w-full h-auto border-b-1 border-gray-200 pb-2`}
            style={{
                gridTemplateColumns: `repeat(${columns}, 25px)`,
                gridTemplateRows: `repeat(${rows}, 25px)`,
            }}
            >
                {Array.from({ length: allColors.length}).map((_, i) => (
                    
                    <div key={i+"div"} className="p-[1px] outline-1 outline-gray-300 rounded-[3px]
                    flex justify-center items-center hover:scale-110 duration-150 hover:outline-gray-400
                    group relative">
                        <div 
                            key={i} 
                            onClick={() => {
                                setColor(allColors[i])
                                setShowColor(false)
                                onColorChange(allColors[i])
                            }} 
                            className={`w-full h-full rounded-[3px]`}
                            style={{ background: allColors[i]}}
                            >
                        </div>
                        {/* <div className="absolute opacity-0 group-hover:opacity-100 bg-white px-3 outline-1
                        oultine-gray-100 w-[100px] py-1 pointer-events-none rounded-[3px] text-[10px] text-gray-300
                        -top-[35px]">{allColors[i]}</div> */}
                    </div>
                    
                ))}

            </div>
            <div className="mt-2 w-full h-[45px] flex  justify-between
            items-center gap-3 text-gray-800 text-[15px] font-Inter hover:bg-gray-50
            outline-gray-200 outline-1 px-2 py-1 rounded-[4px]"
            onClick={() => setShowGenerator(!showGenerator)}
            >
                <div className="font-Quicksand font-bold">More colors</div>
                <HugeiconsIcon className="text-gray-800" icon={ArrowDown01Icon} />
            </div>
        </div>

        {/* Custom colors - pallete */}
        <div
        className={`absolute left-1/2 translate-x-[-50%]
            outline-1 outline-gray-200 rounded-[3px] py-2
            bg-white duration-150 shadow-xl shadow-gray-300
            z-30 w-auto
            ${showGenerator
            ? "opacity-100 pointer-events-auto top-[255px]"
            : "opacity-0 pointer-events-none top-[150px]"
            }`}
        >
        <div className="w-[238px] h-auto flex justify-center items-center">
            <HexColorPicker  
                color={color} 
                onChange={(newValue) => {
                    setColor(newValue)
                    onColorChange(newValue)
                }} 
                className="shadow-md"
                style={{ width: "220px", height: "220px" }}
            />
        </div>
        </div>

      </div>
  )
}