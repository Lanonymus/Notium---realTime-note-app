import { MessageSquare, Share } from "lucide-react";
import { SetStateAction, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Spinner } from "../ui/spinner";
import DifficultyProgressBar from "../Podcast/PodcastProgressBar";
import FlashcardsProgressBar from "./FlashcardsProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import CreatingScreen from "../CreatingScreen";
import { FlashcardGenerationState } from "./flashcardsTypes";

const DIFFICULTY_CONFIG = [
  { level: 1, label: "Easy", emoji: "👶", badgeBg: "bg-green-50 text-green-700 border-green-600" },
  { level: 2, label: "Medium", emoji: "📚", badgeBg: "bg-blue-50 text-blue-700 border-blue-600" },
  { level: 3, label: "Hard", emoji: "🎓",  badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-600" },
  { level: 4, label: "Extreme", emoji: "🧠", badgeBg: "bg-purple-50 text-purple-700 border-purple-600" },
];


const SharpLightning = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M13 2L3 14h7v8l11-12h-7V2z" />
    </svg>
);

type FlashcardState = "generateMode" | "editMode" | "studyMode"  | "normalMode" | "finished";
// type DifficultyLevel = "easy" | "medium" | "hard" | "extreme";

type GenerateModeScreenProps = {
    flashcardsState: FlashcardState,
    flashcardsCount: number,
    onSetFlashcardsCount: (value: number) => void,
    onSetFlashcardsState: (value: FlashcardState) => void,
    isDataLoading: boolean,
    additionalInstructions: string,
    onSetAdditionalInstructions: (value: string) => void,
    onGenerateFlashcards: () => void,
    isContentGenerating: boolean,
    onSetIsContentGenerating: (value: boolean) => void,
    level: string;
    onSetLevel: React.Dispatch<SetStateAction<levelTypes>>;  
    generationState: FlashcardGenerationState    
        
}

const LEVELS = [
  {
    id: "Easy",
    label: "Easy",
    description: "Simple keywords, short flashcard descriptions",
  },
  {
    id: "Medium",
    label: "Medium",
    description: "Simple sentences and simple answers",
  },
  {
    id: "Hard",
    label: "Hard",
    description: "Advanced sentences and more descriptive answers. ",
  },
  {
    id: "Extreme",
    label: "Extreme",
    description: "Proffesional terminology, very accurate descriptions, and more complex flashcards",
  },
] as const;

type levelTypes = "Easy" | "Medium" | "Hard" | "Extreme";

export default function GenerateModeScreen({ 
    flashcardsState,
    flashcardsCount,
    onSetFlashcardsCount,
    isDataLoading,
    additionalInstructions,
    onSetAdditionalInstructions, 
    onGenerateFlashcards,
    isContentGenerating,
    onSetIsContentGenerating,  
    level,
    onSetLevel,
    generationState
    
}: GenerateModeScreenProps) {


    const currentLevel = LEVELS.find((item) => item.id === level)!;
    // Indeks jest wyliczany z level: suwak i ustawienia generowania mają jeden stan.
    const difficultyIndex = LEVELS.findIndex((item) => item.id === level);    

    const stages = {
        "none": 0,
        "extractedNotes": 1,
        "createdFlashcards": 2
    }
    
    const TIPS = [
        "You can edit flashcards at any point",
        "Check out settings to improve experience",
        "You can customize your flashcards in edit mode",
        "Turning off the tracking mode let's you view the flashcards",
    ];

    const STAGES = [
        { label: "Notes", description: "Organizing notes" },
        { label: "Flashcards", description: "Creating flashcards" },
    ];


    return (
        <>

        {isContentGenerating && (
            <div className="h-full">
            <CreatingScreen
                customDictStages={stages}
                generationState={generationState}
                customTips={TIPS}
                customObjectStages={STAGES}
                estimatedWaitTime={12}
                kind={"Quiz"}
            />
            </div>
        )}


        {isDataLoading && (
            <div className="relative h-full w-full flex flex-col items-center justify-center p-6 pt-12 bg-white rounded-2xl shadow-sm border border-neutral-100">
                
                {/* Górny pasek akcji (Share & Upgrade) */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Skeleton className="w-20 h-10 rounded-full" />
                    <div className="w-[2px] h-5 bg-gray-100 ml-2 mr-4" />
                    <Skeleton className="w-32 h-10 rounded-[7px]" />
                </div>

                {/* Główny kontener formularza */}
                <div className="max-w-md w-full flex flex-col items-center text-center space-y-8 my-auto">
                    
                    {/* 1. Ilustracja (Zielona ramka) */}
                    <Skeleton className="w-[200px] sm:w-[220px] h-[200px] rounded-2xl" />

                    {/* 2. Tytuł i opis (Czerwone ramki na tekst) */}
                    <div className="space-y-4 w-full flex flex-col items-center">
                        <Skeleton className="w-3/4 h-8 sm:h-10 rounded-lg" />
                        <div className="space-y-2 w-full flex flex-col items-center">
                            <Skeleton className="w-4/5 h-4 rounded-md" />
                            <Skeleton className="w-3/5 h-4 rounded-md" />
                        </div>
                    </div>

                    {/* Sekcja opcji */}
                    <div className="w-full text-left">
                        
                        {/* 3. Liczba fiszek (Wybór przycisków) */}
                        <div className="flex items-center justify-between bg-neutral-50/50 p-3 rounded-xl border border-neutral-100">
                            <Skeleton className="w-24 h-4 ml-1 rounded-md" />
                            {/* Miejsce na grupę przycisków "10 Cards, 15 Cards..." */}
                            <Skeleton className="w-[200px] h-8 rounded-lg" />
                        </div>

                        <div className="my-3 w-full h-[1px] bg-gray-50"/>

                        {/* 4. Poziom trudności (Slider) */}
                        <div className="w-full">
                            {/* Etykiety nad sliderem */}
                            <div className="mb-2.5">
                                <Skeleton className="w-20 h-4 mb-2 rounded-md" />
                                <Skeleton className="w-48 h-3 rounded-md" />
                            </div>
                            {/* Kontener slidera */}
                            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-3.5 py-4">
                                <Skeleton className="w-full h-2 mb-4 mt-1 rounded-full" />
                                <div className="flex items-center justify-between px-1">
                                    <Skeleton className="w-8 h-3 rounded-md" />
                                    <Skeleton className="w-12 h-3 rounded-md" />
                                    <Skeleton className="w-8 h-3 rounded-md" />
                                    <Skeleton className="w-14 h-3 rounded-md" />
                                </div>
                            </div>
                        </div>

                        <div className="my-3 w-full h-[1px] bg-gray-50"/>                    

                        {/* 5. Dodatkowe instrukcje (Textarea) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <Skeleton className="w-40 h-4 rounded-md" />
                                <Skeleton className="w-12 h-3 rounded-md" />
                            </div>
                            {/* Obszar tekstowy */}
                            <Skeleton className="w-full h-[88px] rounded-[9px]" />
                        </div>

                    </div>

                    {/* 6. Przycisk akcji (Generate Flashcards) */}
                    <Skeleton className="w-full h-[52px] rounded-[9px]" />

                </div>
            </div>
        )}

        {flashcardsState === "generateMode" && !isDataLoading && (

            
            <div className="relative h-full w-full flex flex-col items-center justify-center p-6 pt-12 bg-white rounded-2xl shadow-sm border border-neutral-100">
                
                {/* Górny pasek akcji */}
                <div className="absolute top-4 right-4 w-fit h-fit flex justify-center items-center gap-2">
                    <div className="flex items-center">
                        <button className="flex text-[16px]  items-center gap-2 p-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full 
                            active:scale-[0.97] transition-all duration-200">                     
                            <Share className="w-5 h-5" />                     
                            <span>Share</span>                 
                        </button>                

                        <div className="w-[2px] h-5 bg-gray-200 ml-2 mr-4" />

                        <button
                            className="
                                flex items-center justify-center gap-2.5
                                px-3 py-[9px]
                                bg-blue-600 hover:bg-blue-500
                                rounded-[7px] cursor-pointer
                                transition-all duration-200
                                active:scale-[0.97]
                            "
                        >
                            <SharpLightning className="w-[18px] h-[18px] text-white" />

                            <span className="text-white text-[12px] font-medium tracking-wide">
                                Upgrade to Pro
                            </span>
                        </button>
                    </div>  
                </div>

                {/* Główny kontener formularza */}
                <div className="max-w-md w-full flex flex-col items-center text-center space-y-8 my-auto">
                
                {/* Ilustracja */}
                <div className="w-fit h-fit rounded-2xl flex items-center justify-center">
                    <img
                    src="/flashcards.png"
                    className="w-[200px] sm:w-[220px] h-auto object-contain drop-shadow-sm"
                    alt="Flashcards Illustration"
                    />
                </div>

                {/* Tytuł i opis */}
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                    Create your Flashcards
                    </h1>
                    <p className="text-neutral-500 text-sm leading-relaxed max-w-sm mx-auto">
                    Test yourself on key concepts, track your progress, and master your topics effortlessly.
                    </p>
                </div>

                {/* Sekcja opcji */}
                <div className="w-full  text-left">
                    
                    {/* 1. Liczba fiszek */}
                    <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 ml-1">
                            Flashcards
                        </span>

                        <div className="relative flex gap-1 bg-neutral-200/60 p-1 rounded-lg">
                        {[10, 15, 20].map((num) => (
                            <button
                                key={num}
                                onClick={() => onSetFlashcardsCount(num)}
                                className={`relative px-4 py-[6px] text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer ${
                                    flashcardsCount === num ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
                                }`}
                            >
                            {/* Przesuwane tło pod aktywnym przyciskiem */}
                            {flashcardsCount === num && (
                                <motion.div
                                layoutId="activeCountTab"
                                className="absolute inset-0 bg-white rounded-md shadow-sm"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            {/* Tekst przycisku (z z-10, aby był nad tłem) */}
                            <span className="relative z-10">{num} Cards</span>
                            </button>
                        ))}
                        </div>

                    </div>

                    <div className="my-3 w-full h-[1px] bg-gray-50"/>




                    {/* 2. Difficulty Level Slider */}
                    <FlashcardsProgressBar 
                        level={level} 
                        onSetLevel={onSetLevel}
                        currentLevel={currentLevel}
                        difficultyIndex={difficultyIndex}

                    />


                    <div className="my-3 w-full h-[1px] bg-gray-50"/>                    

                    {/* 3. Redesigned Textarea */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 ml-1">
                            <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                            Additional Instructions
                            </span>
                            <span className="text-[10px] text-neutral-400 font-normal lowercase">optional</span>
                        </label>

                        <div className="relative">
                            <textarea
                                value={additionalInstructions}
                                onChange={(e) => onSetAdditionalInstructions(e.target.value)}
                                placeholder="e.g., Focus on dates and definitions, keep answers short and concise..."
                                rows={3}
                                className="w-full p-3.5 text-sm bg-neutral-50 border border-neutral-100 rounded-[9px] text-neutral-900
                                    placeholder:text-neutral-400 resize-none transition-all duration-200 focus:bg-white 
                                    focus:border-blue-600 ring-1 ring-transparent focus:ring-blue-600 focus:outline-none 
                                    
                                    [&::-webkit-scrollbar]:w-[5px]
                                    [&::-webkit-scrollbar]:h-[5px]
                                    [&::-webkit-scrollbar-track]:bg-gray-100
                                    [&::-webkit-scrollbar-thumb]:bg-gray-300
                                    [&::-webkit-scrollbar-thumb]:rounded-[4px]

                                  "
                            />
                        </div>
                    </div>

                </div>

                {/* Przycisk akcji (CTA) */}
                <button
                    onClick={() => {
                        onGenerateFlashcards()
                        onSetIsContentGenerating(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-[9px]
                     py-3.5 font-semibold text-sm transition-all duration-200 active:scale-[0.99] cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
                >
                    {isContentGenerating ? <Spinner className="w-4 h-4 text-white" /> : null}
                    <span>Generate Flashcards</span>
                </button>

                </div>
            </div>
            )}        
        </>      

    )    
}