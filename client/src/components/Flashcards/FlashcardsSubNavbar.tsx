import { ArrowLeft } from "lucide-react";
import { FlashcardsSettingsDialog } from "./FlashcardsSettingsDialog";



type FlashcardsSubNavbarProps = {
    onSetIsTrackingProgress: (value: boolean) => void,
    isTrackingProgress: boolean,
    onSetStarredOnly: (value: boolean) => void,
    starredOnly: boolean,  
    isFlipped: boolean,
    onSetIsFlipped: (value: boolean) => void,   
    onSetSettingsIsFlipOn: (value: boolean) => void,
    onSetIsAutoAudio: (value: boolean) => void,
    isAutoAudio: boolean,    
    handleStartAgain: () => void,
}




export default function FlashcardsSubNavbar({
    onSetIsTrackingProgress,
    isTrackingProgress,    
    onSetStarredOnly,
    starredOnly,     
    isFlipped,
    onSetIsFlipped,  
    onSetSettingsIsFlipOn,
    onSetIsAutoAudio,
    isAutoAudio,
    
    handleStartAgain
}: FlashcardsSubNavbarProps) {                


    return (
        <>
            {/* TOP NAV */}
            <div className="flex items-center justify-between pt-7 pb-5">

                <button 
                    onClick={() => {
                        handleStartAgain()
                    }}                                
                    className="flex gap-1 items-center justify-center p-2.5 text-neutral-500 hover:text-neutral-900 group
                    hover:bg-neutral-100 rounded-full active:scale-[0.97] transition-all duration-200">                      
                    <ArrowLeft
                        className="
                            w-5 h-5
                            transition-transform duration-100
                            group-hover:-translate-x-1
                        "
                    />                                                     
                    <span>Back to Home</span>                 
                </button>                                

                
                <FlashcardsSettingsDialog 
                    onSetIsTrackingProgress={onSetIsTrackingProgress}
                    isTrackingProgress={isTrackingProgress}     
                    onSetStarredOnly={onSetStarredOnly}
                    starredOnly={starredOnly}                      
                    isFlipped={isFlipped}
                    onSetIsFlipped={onSetIsFlipped}   
                    onSetSettingsIsFlipOn={onSetSettingsIsFlipOn}     
                    onSetIsAutoAudio={onSetIsAutoAudio}
                    isAutoAudio={isAutoAudio}       
                    handleStartAgain={handleStartAgain}         
                />

            </div>        
        </>
    )
}