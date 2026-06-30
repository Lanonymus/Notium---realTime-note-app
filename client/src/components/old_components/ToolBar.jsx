import Bold from "./Bold";
import Code from "./Code";
import ColorInput from "./ColorInput";
import FontSearcher from "./FontSearcher";
import FontSizeInput from "./FontSizeInput";
import Italic from "./Italic";


export default function ToolBar({ 
  toolbarRef,
  onFontSelect,
  onFontSizeChange,
  onBold,
  onCode,
  onItalic,  
  onColorChange,
  useCurrentTextStyle
}) {

  const style = useCurrentTextStyle()
  // console.log("Current styling: ", style.fontColor, style.fontFamily, style.fontSize);

  const currentFont = style.fontFamily
  const currentFontColor = style.fontColor
  const currentFontSize = style.fontSize
  const bold = style.bold
  const italic = style.italic
  const code = style.code
  
  

  return (
    <div className="w-fit h-35px flex gap-4" ref={toolbarRef} tabIndex={-1}>


        <div className="flex">
          <FontSearcher cFont={currentFont} onFontSelect={onFontSelect}/>
          <FontSizeInput cFontSize={currentFontSize} onFontSizeChange={onFontSizeChange}/>
        </div>

        <div className="flex" onMouseDown={(e) => e.preventDefault()}>
          <Bold cBold={bold} onBold={onBold}/>
          <Code cCode={code} onCode={onCode}/>
          <Italic cItalic={italic} onItalic={onItalic}/>
        </div>

        <ColorInput cColor={currentFontColor} onColorChange={onColorChange}/>        
    </div>
  )
}