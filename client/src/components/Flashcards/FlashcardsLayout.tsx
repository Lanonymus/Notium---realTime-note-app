import { ArrowLeft, Brush, Check, ChevronLeft, ChevronRight, CornerDownLeft, Edit, GraduationCap, MessageSquare, MoveLeft, MoveRight, Palette, Pencil, Play, Plus, RotateCcw, Save, Settings, Share, Shuffle, Sparkles, Star, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import FlashcardItem from "./FlashcardItem";
import { SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import { useParams } from "react-router-dom";
import { div } from "framer-motion/m";
import { FlashcardsSettingsDialog } from "./FlashcardsSettingsDialog";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {v4 as uuidv4} from "uuid"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd";
import GenerateModeScreen from "./GenerateModeScreen";
import { RichEditor } from "./RichEditor";
import StudyModeScreen from "./StudyModeScreen";
import FlashcardsNavbar from "./FlashcardsNavbar";
import { PodcastGenerationSettings } from "../Podcast/PodcastGenerateScreen";
import { Flashcard, FlashcardGenerationState, FlashcardsSet, FlashcardState, levelTypes } from "./flashcardsTypes";
import { useLearningActivity } from "@/hooks/useLearningActivity";







export default function FlashcardsLayout() {
    const params = useParams() 
    const projectId: string | undefined = params.projectID   
    const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false)
    const [loadedFlashcardSet, setLoadedFlashcardSet] = useState<FlashcardsSet | null>(null) 
    const [isDataLoading, setIsDataLoading] = useState<boolean>(true)
    const [startTime, setStartTime] = useState("");
    const [finishTime, setFinishTime] = useState("");
    const [accuracy, setAccuracy] = useState<number | null>(null)

    // Poziomy
    const [tempFlashcards, setTempFlashcards] = useState<Flashcard[]>([])    
    const [newFlashcards, setNewFlashcards] = useState<Flashcard[]>([])
    const [learningFlashcards, setLearningFlashcards] = useState<Flashcard[]>([])
    const [masteredFlashcards, setMasteredFlashcards] = useState<Flashcard[]>([])    

    const [flashcardsState, setFlashcardsState] = useState<FlashcardState>("generateMode"); //generateMode // finished
    const [generationState, setGenerationState] = useState<FlashcardGenerationState>("none"); //extractedNotes // createdFlashcards

    const [slideDirection, setSlideDirection] = useState<"left" | "right" | "">("");
    const [flashcards, setFlashcards] = useState<Flashcard[]>([])

    // generate flashcards screen
    const [flashcardsCount, setFlashcardsCount] = useState<number>(15);
    // const [difficulty, setDifficulty] = useState<DifficultyLevel>("easy")
       // wartości zwiazane z levelem ciężkości
    const [level, setLevel] =
        useState<levelTypes>("Medium");
    const [additionalInstructions, setAdditionalInstructions] = useState<string>("")
    
    const [isIntroDone, setIsIntroDone] = useState(false);

    const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isContentGenerating, setIsContentGenerating] = useState(false);
    const editorTitleRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState<string>("")


    // tutaj wyskakuje błąd 
    const currentFlashcard = newFlashcards[currentCardIndex] || learningFlashcards[currentCardIndex] || masteredFlashcards[currentCardIndex];
    const [favoritedFlashcards, setFavoritedFlashcards] = useState<Flashcard[]>([])

    const [starredOnly, setStarredOnly] = useState<boolean>(false);        

    useLearningActivity({
        enabled: flashcardsState === "studyMode" && Boolean(loadedFlashcardSet),
        activityType: "flashcards",
        projectId,
        resourceId: loadedFlashcardSet?.id,
        disabledReason: flashcardsState === "finished" ? "completed" : "route_changed",
    });

    // Total amount of points
    const totalMaxPoints = starredOnly ?  favoritedFlashcards.length * 2 : flashcards.length * 2

    const currentPoints = 
        (masteredFlashcards.length * 2) +
        learningFlashcards.reduce((acc, card) => acc + (card.points || 0), 0);

    // Procentowy postęp sesji (0% - 100%)
    const sessionProgress = totalMaxPoints > 0 
        ? Math.floor((currentPoints / totalMaxPoints) * 100) 
        : 0;  
             



    const nextCard = () => {
        if (currentCardIndex < flashcards.length - 1) {
            setSlideDirection("right")
            setCurrentCardIndex((prev) => prev + 1);
            setIsFlipped(false);
        }
    };

    const previousCard = () => {
        if (currentCardIndex > 0) {
            setSlideDirection("left")            
            setCurrentCardIndex((prev) => prev - 1);
            setIsFlipped(false);
        }
    };

    const updateTitle = async (newTitle: string) => {
        try {
            const response = await fetch("http://localhost:8000/api/updateTitle", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    projectId,
                    newTitle
                })
            });

            if(!response.ok) {
                console.log("Failed to update title. Status:", response.status);
            }


        } catch (error) {
            console.error("Error updating title:", error);
        }
    }



    // <----------- GENEROWANIE FISZEK--------------->
    const generateFlashcards = async () => {
        try {
            const notesResponse = await fetch("http://localhost:8000/api/extractFiles", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    projectId: projectId,
                })
            });

            if(!notesResponse.ok) throw new Error("problem z pobraniem notatek")
            
            const notesData = await notesResponse.json()
            const notes = notesData.notes

            setGenerationState("extractedNotes")

            const response = await fetch("http://localhost:8000/api/generateFlashcards", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    projectId: projectId,
                    amount: flashcardsCount,
                    difficulty: level,
                    additionalInstructions: additionalInstructions,
                    notes: notes

                })
            });

            if(!response.ok) {
                console.log("Failed to generate flashcards, Status:", response.status);
            }

            const data = await response.json();
            const newFlashcardsSet: FlashcardsSet = data.newFlashcardsSet;

            
            if (!newFlashcardsSet) {
                console.error("No flashcards generated");
                return;
            }

            setGenerationState("createdFlashcards")

            console.log("wygenerowane dane fiszkek: ", newFlashcardsSet);
            

            // Wczytywanie danych
            setLoadedFlashcardSet(newFlashcardsSet)
            setFlashcards(newFlashcardsSet.flashcards)
            setNewFlashcards(newFlashcardsSet.newFlashcards)
            setTempFlashcards(newFlashcardsSet.tempFlashcards)


            console.log(newFlashcardsSet.flashcards);

            setFlashcardsState("editMode");
            setIsContentGenerating(false);

        } catch (error) {
            console.error("Error generating flashcards:", error);
        }        
    }



    // <----------------- LOADING FLASHCARDS SETS ------------------->
    const getFlashcardSets = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/getFlashcardSets", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    projectId: projectId,
                })
            });

            if(!response.ok) {
                console.log("Failed to load flashcards, Status:", response.status);
            }

            const data = await response.json();
            const FlashcardSets: FlashcardsSet[] = data.flashcardSets

            if (Array.isArray(FlashcardSets) && FlashcardSets.length > 0) {
                const lastFlashcardSet: FlashcardsSet = FlashcardSets[FlashcardSets.length - 1]

                const title = data.title;
                console.log("data", FlashcardSets, title);
                

                if(title) {
                    setTitle(title)
                }

                if (Array.isArray(lastFlashcardSet.flashcards) && lastFlashcardSet.flashcards.length > 0) {
                    console.log("załadowane dane fiszek: ", lastFlashcardSet);
                    

                    if (!lastFlashcardSet) {
                        console.error("No Data for flashcardSet");
                        return;
                    }

                    // ładowanie całego obiektu z wszystkimi danymi
                    console.log("ładowanie danych");
                    
                    setLoadedFlashcardSet(lastFlashcardSet)

                    setFlashcards(lastFlashcardSet.flashcards || [])
                    setTempFlashcards(lastFlashcardSet.tempFlashcards || [])
                    setNewFlashcards(lastFlashcardSet.newFlashcards || [])
                    setLearningFlashcards(lastFlashcardSet.learningFlashcards || [])
                    setMasteredFlashcards(lastFlashcardSet.masteredFlashcards || [])
                    setFavoritedFlashcards(lastFlashcardSet.favoritedFlashcards || [])
                  
                    setAccuracy(Math.round((lastFlashcardSet.correctAnswersCount / (lastFlashcardSet.correctAnswersCount + lastFlashcardSet.mistakesCount)) * 100) )
                    

                    setIsDataLoaded(true);
                    setStartTime(lastFlashcardSet.startTime ?? "");
                    setFinishTime(lastFlashcardSet.finishTime ?? "");
                    
                    if(lastFlashcardSet.masteredFlashcards.length === lastFlashcardSet.flashcards.length) {
                        setFlashcardsState("finished");
                    } else {
                        setFlashcardsState("editMode");
                    }
                }                
            }
            setIsDataLoading(false)

        } catch (error) {
            console.error("Error loading flashcards:", error);
        }           
    }



    // Ładujemy ostatnią sesję fiszek jeżeli istnieję
    useEffect(() => {
        if(isDataLoaded) return

        getFlashcardSets()
    }, [isDataLoaded])


    return (
        <>
            {/* ========================================================= */}
            {/* READY SCREEN                                              */}
            {/* ========================================================= */}
            <GenerateModeScreen
                flashcardsState={flashcardsState}
                flashcardsCount={flashcardsCount}
                onSetFlashcardsCount={(count) => setFlashcardsCount(count)}
                onSetFlashcardsState={(state) => setFlashcardsState(state)}       
                isDataLoading={isDataLoading}
                additionalInstructions={additionalInstructions}
                onSetAdditionalInstructions={setAdditionalInstructions}   
                onGenerateFlashcards={() => generateFlashcards()}  
                isContentGenerating={isContentGenerating}
                onSetIsContentGenerating={setIsContentGenerating}  
                level={level}
                onSetLevel={setLevel} 
                generationState={generationState}       
            />
            {/* ========================================================= */}
            {/* ACTIVE FLASHCARDS SCREEN                                  */}
            {/* ========================================================= */}

            {flashcardsState === "editMode" && (
                // background color bg-[#f7f8fa]
                <div className="relative h-full w-full bg-white text-[#282e3e] rounded-xl"> 

                    {/* HEADER */}
                    {/* background color bg-bg-[#f7f8fa]/90 */}
                    {editorTitleRef && (
                        <FlashcardsNavbar
                            isContentGenerating={isContentGenerating}
                            editorTitleRef={editorTitleRef}
                            title={title}
                            onSetTitle={setTitle}
                            onUpdateTitle={updateTitle}
                        />                        
                    )}

                    


                {/* CONTENT */}
                {/* bg-dot-pattern */}
                <div className="w-full h-full bg-dot-pattern ">
                    
                    <main className="max-w-[1040px] mx-auto px-6 lg:px-8 ">

                        {/* TOP META */}
                        <div className="flex items-center justify-between pt-8 pb-7">

                            <div className="p-3 flex flex-col justify-center  rounded-[9px]">
                                <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#9098aa] bg-white">
                                    Flashcards ({flashcards.length})
                                </p>

                                <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.02em] flex gap-2 items-center justify-center bg-white">
                                    <div className="p-[5px] rounded-[9px] bg-gray-50">
                                        <Brush size={25} className="text-gray-700"/>
                                    </div>
                                    <span>
                                        Customize your Flashcards
                                    </span>
                                </h1>
                            </div>

                        </div>


                        {/* LEARNING STATS */}
                        <div className="flex items-center justify-center mb-8">

                                <div 
                                    style={{ animationDelay: `${0.3}s`}}
                                    className="flex flex-col items-center justify-center 
                                    mb-8 animate-face-down">
                                    <div
                                        className="
                                            flex items-center
                                            h-10
                                            px-1.5 bg-white
                                        "
                                    >
                                        <div className="px-1">
                                            <div className="flex items-center p-1 gap-2 rounded-[9px]" >
                                                <div className="mt-[2px] w-2 h-2 rounded-full bg-blue-600" />
                                                <span className="text-[14px] font-semibold text-blue-600">
                                                    New
                                                </span>
                                                <span className="text-[14px] font-semibold text-blue-600">
                                                    {newFlashcards.length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-px h-4 mx-2 bg-gray-200" />

                                        <div className="px-1">
                                            <div className="flex items-center p-1 gap-2 rounded-[9px]" >
                                                <div className="mt-[2px] w-2 h-2 rounded-full bg-amber-600" />
                                                <span className="text-[14px] font-semibold text-amber-600">
                                                    Learning
                                                </span>
                                                <span className="text-[14px] font-semibold text-amber-600">
                                                    {learningFlashcards.length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-px h-4 mx-2 bg-gray-200" />

                                        <div className="px-1">
                                            <div className="flex items-center p-1 gap-2 rounded-[9px]" >
                                                <div className="mt-[2px] w-2 h-2 rounded-full bg-green-600" />
                                                <span className="text-[14px] font-semibold text-green-600">
                                                    Mastered
                                                </span>
                                                <span className="text-[14px] font-semibold text-green-600">
                                                    {masteredFlashcards.length}
                                                </span>
                                            </div>
                                        </div>                        
                                    </div>

                                    {/* PROGRESS */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="hidden sm:flex flex-col items-end gap-1">
                                            <div className="w-[350px] h-[9px] rounded-full bg-[#e5e7eb] overflow-hidden flex">
                                                <div 
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-150 ease-in-out" 
                                                    style={{ width: `${sessionProgress}%` }} />
                                            </div>
                                            <span className="text-[11px] font-medium text-[#8b93a5] bg-white">
                                                Session progress
                                            </span>
                                        </div>                                                           
                                    </div>                
                                </div>

                        </div>


                        {/* <------FLASHCARD CONTAINER--->*/}
                        <section className="flex flex-col items-center">

                            <div className="relative w-full max-w-[820px] h-[440px]">
                                {/* FAZA 1: ANIMACJA WEJŚCIOWA (OPADANIE STOSU) */}
                                {!isIntroDone ? (
                                    flashcards.map((flashcard, index) => {
                                        const reverseZIndex = flashcards.length - index;
                                        const delay = (flashcards.length - 1 - index) * 0.15;
                                        const isTopCard = index === 0;

                                        return (
                                            <div
                                                key={`intro-${index}`}
                                                className="absolute top-0 left-0 w-full h-full"
                                                style={{ zIndex: reverseZIndex }}
                                            >
                                                <div
                                                    className="w-full h-full animate-fall"
                                                    style={{ animationDelay: `${delay}s` }}
                                                    onAnimationEnd={() => {
                                                        if (isTopCard) setIsIntroDone(true);
                                                    }}
                                                >
                                                    <div className="w-full h-full" style={{ perspective: "1400px" }}>
                                                        <div className="relative w-full h-full [transform-style:preserve-3d]">
                                                            <div className="absolute inset-0 bg-white border-gray-200 rounded-[12px] border-2 flex flex-col items-center justify-center px-12">
                                                                <div className="max-w-[650px] text-center">
                                                                    <h2 className="text-[38px] lg:text-[44px] leading-[1.15] font-semibold tracking-[-0.035em] text-[#282e3e]">
                                                                        {flashcard.front}
                                                                    </h2>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    /* FAZA 2: AKTYWNA NAUKA (PRZESUWANIE POJEDYNCZEJ KARTY) */
                                    /* Magia dzieje się w key={currentCardIndex} - gdy zmieniasz kartę, React odświeża cały div i odpala animację! */
                                    <div
                                        key={currentCardIndex} 
                                        className={`absolute top-0 left-0 w-full h-full z-20 ${
                                            slideDirection === "right" ? "animate-slide-in-right" : 
                                            slideDirection === "left" ? "animate-slide-in-left" : ""
                                        }`}
                                    >
                                        <div
                                            className="w-full h-full cursor-pointer"
                                            style={{ perspective: "1400px" }}
                                            onClick={() => setIsFlipped((prev) => !prev)}
                                        >
                                            <div
                                                className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
                                                style={{
                                                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                                }}
                                            >
                                                {/* FRONT AKTYWNEJ KARTY */}
                                                <div className={`absolute inset-0 bg-white border-2 rounded-[12px]
                                                [backface-visibility:hidden] flex flex-col items-center justify-center shadow-[0px_2px_0px_#e5e7eb] 
                                                transition-shadow duration-300 ${isEditing ? "border-blue-600" : "border-gray-200/80"} `}>
                                                    <div className="absolute top-7 left-8">
                                                        <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#9aa2b2]">
                                                            Term
                                                        </span>
                                                    </div>

                                                    <div 
                                                        className="FlashcardsLayout h-full max-h-[340px] !w-full max-w-[1400px] px-10
                                                        overflow-y-auto flex items-center justify-center text-center
                                                        [&::-webkit-scrollbar]:w-[5px]
                                                        [&::-webkit-scrollbar]:h-[5px]
                                                        [&::-webkit-scrollbar-track]:bg-gray-100
                                                        [&::-webkit-scrollbar-thumb]:bg-gray-300
                                                        [&::-webkit-scrollbar-thumb]:rounded-[4px]                                                            
                                                    ">
                                                        <RichEditor 
                                                            value={currentFlashcard ? currentFlashcard.front : ""} 
                                                            isEditing={isEditing} 
                                                            isOnlyView={true}
                                                            additionalClassName="HugeText !text-[38px] lg:!text-[44px] !leading-[1.15] !font-normal !tracking-[-0.035em] !text-[#282e3e] [&_ul>li::before]:!w-3 [&_ul>li::before]:!h-3 [&_ul>li::before]:!top-[0.42em] [&_ul>li]:!pl-9"
                                                        />
                                                    </div>
                                                    <div className="absolute bottom-7 flex items-center gap-2">
                                                        <span className="text-[11px] text-[#a0a7b5]">
                                                            Click to reveal answer
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* BACK AKTYWNEJ KARTY */}
                                                <div className={`absolute inset-0 bg-white border-2 border-[#e1e4ea] rounded-[12px] [backface-visibility:hidden]
                                                [transform:rotateY(180deg)] flex flex-col items-center justify-center shadow-[0px_2px_0px_#e5e7eb]
                                                 ${isEditing ? "border-blue-600" : "border-gray-200/80"}`}>
                                                    <div className="absolute top-7 left-8">
                                                        <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#4255ff]">
                                                            Definition
                                                        </span>
                                                    </div>

                                                    <div 
                                                        className="FlashcardsLayout h-full max-h-[340px]  !w-full max-w-[1400px] px-10
                                                        overflow-y-auto flex items-center justify-center text-center
                                                        [&::-webkit-scrollbar]:w-[5px]
                                                        [&::-webkit-scrollbar]:h-[5px]
                                                        [&::-webkit-scrollbar-track]:bg-gray-100
                                                        [&::-webkit-scrollbar-thumb]:bg-gray-300
                                                        [&::-webkit-scrollbar-thumb]:rounded-[4px]                                                            
                                                    ">
                                                        <RichEditor 
                                                            value={currentFlashcard ? currentFlashcard.back : ""} 
                                                            isEditing={isEditing} 
                                                            isOnlyView={true}
                                                            additionalClassName="HugeText prose prose-sm !text-[38px] lg:!text-[44px] !leading-[1.15] !font-normal !tracking-[-0.035em] !text-[#282e3e] [&_ul>li::before]:!w-3 [&_ul>li::before]:!h-3 [&_ul>li::before]:!top-[0.42em] [&_ul>li]:!pl-9"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* NAVIGATION */}
                            <div className="flex items-center gap-3 mt-6 bg-white">

                                <button
                                    onClick={previousCard}
                                    disabled={currentCardIndex === 0}
                                    className="
                                        w-9 h-9
                                        flex items-center justify-center
                                        rounded-lg
                                        border border-[#e1e4ea]
                                        bg-white
                                        text-[#697287]
                                        hover:text-[#282e3e]
                                        hover:border-[#cdd2dc]
                                        disabled:opacity-30
                                        disabled:hover:border-[#e1e4ea]
                                        transition-all
                                    "
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>


                                <div
                                    className="
                                        min-w-[64px]
                                        text-center
                                        text-[12px]
                                        font-medium
                                        text-[#7c8496]
                                    "
                                >
                                    <span className="font-semibold text-[#282e3e]">
                                        {String(currentCardIndex + 1).padStart(2, "0")}
                                    </span>

                                    <span className="mx-1 text-[#b3b8c3]">
                                        /
                                    </span>

                                    {String(flashcards.length).padStart(2, "0")}
                                </div>


                                <button
                                    onClick={nextCard}
                                    disabled={currentCardIndex === flashcards.length - 1}
                                    className="
                                        w-9 h-9
                                        flex items-center justify-center
                                        rounded-lg
                                        border border-[#e1e4ea]
                                        bg-white
                                        text-[#697287]
                                        hover:text-[#282e3e]
                                        hover:border-[#cdd2dc]
                                        disabled:opacity-30
                                        disabled:hover:border-[#e1e4ea]
                                        transition-all
                                    "
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                            </div>


                            <div className="w-full flex justify-between items-center">
                                {/* PRIMARY ACTION */}
                                {/* <button
                                    onClick={() => setIsFlipped((prev) => !prev)}
                                    className="
                                        mt-5
                                        h-11
                                        px-7
                                        rounded-lg
                                        bg-[#4255ff]
                                        hover:bg-[#3448ef]
                                        text-white
                                        text-[13px]
                                        font-semibold
                                        shadow-[0_2px_5px_rgba(66,85,255,0.18)]
                                        hover:shadow-[0_5px_14px_rgba(66,85,255,0.2)]
                                        transition-all
                                        active:scale-[0.98]
                                    "
                                >
                                    {isFlipped ? "Hide Answer" : "Show Answer"}
                                </button> */}

                                {/* <--------- Edit Button ------> */}
                                <button
                                    onClick={() => {
                                        setIsEditing((prev) => !prev)
                                    }}
                                    className="
                                        py-3 px-7 rounded-lg bg-gray-50 border-1 border-gray-200 text-[13px]
                                        font-medium flex items-center text-gray-900 
                                        shadow-[2px_2px_0px_#e5e7eb] 
                                        transition-all gap-1
                                        active:scale-[0.98] hover:bg-gray-100
                                    "
                                >
                                    <div>
                                        {isEditing ? <Check className="w-4 h-4 mr-2 inline-block text-green-700" /> : <Edit className="w-4 h-4 mr-2 inline-block" />}
                                    </div>
                                    {isEditing ? "Save Changes" : "Edit Flashcards"}
                                </button>           


                                        {/* shadow-[0px_3px_0px_#1c398e]  */}
                                {/* <--------- START Flashcards Session Button------> */}
                                <button
                                    onClick={() => {
                                        setIsFlipped(false)
                                        setFlashcardsState("studyMode")
                                    }}
                                    className="
                                        px-7 py-[14px] rounded-[12px] bg-blue-700 hover:bg-blue-700/90  text-[13px]
                                        font-medium flex items-center text-white
                                        transition-all  
                                        active:scale-[0.98] cursor-pointer
                                    "
                                >
                                    <div>
                                        <Play className="w-4 h-4 mr-2 inline-block" />
                                    </div>
                                    {"Start Studying"}
                                </button>                                                         
                            </div>

                        </section>







                        {/* <----------------------------KARTY EDYCJI 📑♠️--------------------------> */}
                        <section className="mt-14 pb-16">
                            
                            {/* NEW FLASHCARDS SECTION  */}                            
                            {newFlashcards && newFlashcards.length > 0 && (
                                <>
                                    <div className="w-full flex items-center bg-white">
                                        <div className="h-[3px] flex-1 bg-blue-200"/>
                                        <span className="shrink-0 px-5 font-medium">{newFlashcards.length} New Cards</span>
                                        <div className="h-[3px] flex-1 bg-blue-200"/>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-5 w-full flex items-center justify-center">
                                            <button
                                                onClick={() => {
                                                    const newCard: Flashcard = {
                                                        id: uuidv4(), 
                                                        front: "", 
                                                        back: "",
                                                        state: "New",
                                                        points: 0
                                                    }

                                                    setFlashcards(prev => [newCard, ...prev])
                                                }}
                                                style={{ animationDelay: "0.1s" }} 
                                                className="animate-face-down  px-3 py-2 rounded-[9px] hover:bg-gray-100 bg-gray-50 border-gray-200
                                                border-1 shadow-[2px_2px_0px_#e5e7eb] active:translate-y-[3px] duration-200 flex items-center
                                                active:shadow-[0px_0px_0px_#e5e7eb] justify-center gap-2 cursor-pointer">
                                                <Plus  size={16} className="text-gray-900" />
                                                <span className="text-[13px] font-medium text-gray-900">Add New Card</span>
                                            </button>
                                        </div>
                                    )}                                    

                                    {newFlashcards.map((flashcard, index) => (
                                        <FlashcardItem 
                                            key={flashcard.id} 
                                            currentFlashcard={flashcard} 
                                            isEditing={isEditing}
                                            onSetFlashcards={setFlashcards}
                                            flashcards={flashcards}
                                            favoritedFlashcards={favoritedFlashcards}
                                            onSetFavoritedFlashcards={setFavoritedFlashcards}
                                        />
                                    ))}
                                </>
                            )}

                            

                            {/* learningFlashcards SECTION  */}                            
                            {learningFlashcards && learningFlashcards.length > 0 && (
                                <>
                                    <div className="w-full flex items-center bg-white mt-5">
                                        <div className="h-[3px] flex-1 bg-amber-400"/>
                                        <span className="shrink-0 px-5 font-medium">{learningFlashcards.length} Learning Cards</span>
                                        <div className="h-[3px] flex-1 bg-amber-400"/>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-5 w-full flex items-center justify-center">
                                            <button
                                                onClick={() => {
                                                    const newCard: Flashcard = {
                                                        id: uuidv4(), 
                                                        front: "", 
                                                        back: "",
                                                        state: "New",
                                                        points: 0
                                                    }

                                                    setFlashcards(prev => [newCard, ...prev])
                                                }}
                                                style={{ animationDelay: "0.1s" }} 
                                                className="animate-face-down  px-3 py-2 rounded-[9px] hover:bg-gray-100 bg-gray-50 border-gray-200
                                                border-1 shadow-[2px_2px_0px_#e5e7eb] active:translate-y-[3px] duration-200 flex items-center
                                                active:shadow-[0px_0px_0px_#e5e7eb] justify-center gap-2 cursor-pointer">
                                                <Plus  size={16} className="text-gray-900" />
                                                <span className="text-[13px] font-medium text-gray-900">Add New Card</span>
                                            </button>
                                        </div>
                                    )}                                      

                                    {learningFlashcards.map((flashcard, index) => (
                                        <FlashcardItem 
                                            key={flashcard.id} 
                                            currentFlashcard={flashcard} 
                                            isEditing={isEditing}
                                            onSetFlashcards={setFlashcards}
                                            flashcards={flashcards}
                                            favoritedFlashcards={favoritedFlashcards}
                                            onSetFavoritedFlashcards={setFavoritedFlashcards}
                                        />
                                    ))}
                                </>
                            )}   

                            {/* masteredFlashcards SECTION  */}                            
                            {masteredFlashcards && masteredFlashcards.length > 0 && (
                                <>
                                    <div className="w-full flex items-center bg-white mt-5">
                                        <div className="h-[3px] flex-1 bg-green-500"/>
                                        <span className="shrink-0 px-5 font-medium">{masteredFlashcards.length} Mastered Cards</span>
                                        <div className="h-[3px] flex-1 bg-green-500"/>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-5 w-full flex items-center justify-center">
                                            <button
                                                onClick={() => {
                                                    const newCard: Flashcard = {
                                                        id: uuidv4(), 
                                                        front: "", 
                                                        back: "",
                                                        state: "New",
                                                        points: 0
                                                    }

                                                    setFlashcards(prev => [newCard, ...prev])
                                                }}
                                                style={{ animationDelay: "0.1s" }} 
                                                className="animate-face-down  px-3 py-2 rounded-[9px] hover:bg-gray-100 bg-gray-50 border-gray-200
                                                border-1 shadow-[2px_2px_0px_#e5e7eb] active:translate-y-[3px] duration-200 flex items-center
                                                active:shadow-[0px_0px_0px_#e5e7eb] justify-center gap-2 cursor-pointer">
                                                <Plus  size={16} className="text-gray-900" />
                                                <span className="text-[13px] font-medium text-gray-900">Add New Card</span>
                                            </button>
                                        </div>
                                    )}                                      

                                    {masteredFlashcards.map((flashcard, index) => (
                                        <FlashcardItem 
                                            key={flashcard.id} 
                                            currentFlashcard={flashcard} 
                                            isEditing={isEditing}
                                            onSetFlashcards={setFlashcards}
                                            flashcards={flashcards}
                                            favoritedFlashcards={favoritedFlashcards}
                                            onSetFavoritedFlashcards={setFavoritedFlashcards}
                                        />
                                    ))}
                                </>
                            )}                                                          


                            {/* CARDS - FLASHCARDS GO HERE */}



                    </section>
                    </main>
                </div>
            </div>
        )}




        {/* <------------------------ STUDY MODE - ACTIVE GAME ------------------------> */}
        {/* <------------------------ STUDY MODE - ACTIVE GAME ------------------------> */}
        <StudyModeScreen
            flashcardsState={flashcardsState}
            onSetFlashcardsState={setFlashcardsState}
            isContentGenerating={isContentGenerating}
            startTime={startTime}
            finishTime={finishTime}
            onSetStartTime={setStartTime}
            onSetFinishTime={setFinishTime}
            loadedAccuracy={accuracy}

            editorTitleRef={editorTitleRef}
            title={title}
            onSetTitle={setTitle}
            updateTitle={updateTitle}
            
            isIntroDone={isIntroDone}
            onSetIsIntroDone={setIsIntroDone}
            flashcards={flashcards}
            onSetFlashcards={setFlashcards}
            isEditing={isEditing}
            onSetIsEditing={setIsEditing}
            isFlipped={isFlipped} 
            onSetIsFlipped={setIsFlipped}    
            favoritedFlashcards={favoritedFlashcards}       
            onSetFavoritedFlashcards={setFavoritedFlashcards}
            onUpdateFlashcard={(updatedFlashcard) => setFlashcards(prev => prev.map(card => card.id === updatedFlashcard.id ? updatedFlashcard : card))}
            
            newFlashcards={newFlashcards} 
            tempFlashcards={tempFlashcards}
            onSetTempFlashcards={setTempFlashcards}
            onSetNewFlashcards={setNewFlashcards}
            learningFlashcards={learningFlashcards}
            onSetLearningFlashcards={setLearningFlashcards}
            masteredFlashcards={masteredFlashcards}
            onSetMasteredFlashcards={setMasteredFlashcards}     
            onSetStarredOnly={setStarredOnly}
            starredOnly={starredOnly}  
            
            // Wszystkie dane o secie
            loadedFlashcardSet={loadedFlashcardSet} 
            
            
            
        />        





        </>
    );
}
