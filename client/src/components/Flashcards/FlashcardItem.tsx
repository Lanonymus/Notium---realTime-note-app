import { BoldIcon, ItalicIcon, ListIcon, Star, Trash2, UnderlineIcon } from "lucide-react";
import { Flashcard } from "./FlashcardsLayout";
import { RichEditor } from "./RichEditor";
import { Editor } from "@tiptap/react";
import { useState } from "react";
import FlashcardToolbar from "./FlashcardToolbar";
import handleImageFlashcards from "./handleImageFlashcards";
import { useParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import FlashcardToolBarPlaceholder from "./FlashcardToolBarPlaceholder";



type FlashcardItemProps = {
    currentFlashcard: Flashcard,
    isEditing: boolean,
    onSetFlashcards: (updatedCards: Flashcard[]) => void,
    flashcards: Flashcard[],
    favoritedFlashcards: Flashcard[],
    onSetFavoritedFlashcards: (updatedCard: Flashcard[]) => void
}


export default function FlashcardItem({ 
    currentFlashcard,
    isEditing,
    onSetFlashcards,
    flashcards,
    favoritedFlashcards,
    onSetFavoritedFlashcards

} : FlashcardItemProps) {

    const params = useParams() 
    const projectID: string | undefined = params.projectID
    
    const [activeEditor, setActiveEditor] = useState<Editor | null>(null)
    const isThisCardFavorited = favoritedFlashcards.some(card => card.id === currentFlashcard.id)

    const handleFieldChange = (field: "front" | "back", value: string) => {
        const updatedCards = flashcards.map((card) =>
            card.id === currentFlashcard.id 
            ? {...card, [field]: value}
            : card    
        )
        // console.log("updatedCards: ", updatedCards);
        

        onSetFlashcards(updatedCards)
    }




    return (
        <>
        <div 
            className="pt-8"
        >

                <div
                    className="
                        overflow-hidden
                        rounded-[9px]
                        border border-[#e1e4ea]
                        bg-white
                    "
                >

                    <div className="relative flex bg-gray-50 items-center justify-between">

                        {/* zakrycie / kurtyna / powłoka blokująca edytowanie */}
                        {!isEditing  && (
                            <div className="absolute inset-0 bg-gray-200/30 z-9999 cursor-not-allowed"/>
                        )}

                        {activeEditor ? (
                            <div className="w-full">
                                <FlashcardToolbar 
                                    editor={activeEditor}
                                    handleImageUpload={(file) => handleImageFlashcards(file, activeEditor, projectID!)}
                                    isEditing={isEditing}
                                />
                            </div>
                        ): (
                            <div className="w-full">
                                <FlashcardToolBarPlaceholder/>
                            </div>                            
                        )}

                        <div className="flex items-center justify-center mr-2">

                            <Tooltip>
                                <TooltipTrigger render={                                                                       
                                    <div
                                        onClick={() => {
                                            const updatedCards = flashcards.filter(card => card.id !== currentFlashcard.id)
                                            onSetFlashcards(updatedCards)
                                        }} 
                                        className="p-2 hover:bg-red-100 rounded-[9px] group cursor-pointer">
                                        <Trash2 size={16} className="text-gray-500 group-hover:text-red-700"/>
                                    </div>                                                                             
                                }/>
                                
                                <TooltipContent>
                                    <p>Delete the Card</p>
                                </TooltipContent>
                            </Tooltip>                             


                            <Tooltip>
                                <TooltipTrigger render={                                                                       
                                    <div
                                        onClick={() => {
                                            const updatedCards = isThisCardFavorited
                                                ? favoritedFlashcards.filter(card => card.id !== currentFlashcard.id)
                                                : [...favoritedFlashcards, currentFlashcard];

                                            onSetFavoritedFlashcards(updatedCards);
                                        }}                                      
                                        className="p-2 hover:bg-gray-100 rounded-[9px] group cursor-pointer">
                                        
                                        <motion.div
                                            animate={isThisCardFavorited ? { scale: [1, 1.4, 0.9, 1], rotate: [0, 15, -15, 0] } : { scale: 1, rotate: 0 }}
                                            transition={{ duration: 0.35, ease: "easeOut" }}
                                        >
                                            <Star 
                                                size={16} 
                                                className={`transition-colors duration-200 group-hover:text-amber-400 ${
                                                    isThisCardFavorited ? "text-amber-400 fill-amber-400" : "text-gray-500"
                                                }`}
                                            />
                                        </motion.div>
                                    </div>                                                                             
                                }/>
                                
                                <TooltipContent>
                                    <p>{isThisCardFavorited ? "Remove from Favorites" : "Add to Favorites"}</p>
                                </TooltipContent>
                            </Tooltip>                          

                        </div>

                    </div>
                       



                    {/* FIELDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2">

                        {/* FRONT */}
                        <div className="pl-6 pt-6 pr-2 md:border-r border-[#e8eaf0] rounded-bl-[9px] focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600">
                            <label className="block mb-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#9aa2b2]">
                                Front
                            </label>

                            <RichEditor
                                value={currentFlashcard.front}
                                onChange={(html) => handleFieldChange("front", html)}
                                isEditing={isEditing}
                                onFocus={(editor) => setActiveEditor(editor)}
                                alwaysNativeEditor={true}
                            />
                        </div>


                        {/* BACK */}
                        <div className="pl-6 pt-6 pr-2 ring-blue-600 focus-within:ring-2 ring-inset rounded-br-[9px]">
                            <label className="block mb-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#9aa2b2]">
                                Back
                            </label>

                            <RichEditor
                                value={currentFlashcard.back}
                                onChange={(html) => handleFieldChange("back", html)}
                                isEditing={isEditing}
                                onFocus={(editor) => setActiveEditor(editor)}
                                alwaysNativeEditor={true}                             
                            />
                        </div>

                    </div>
                </div>
            </div>                                            
           
        </>       
    )
}