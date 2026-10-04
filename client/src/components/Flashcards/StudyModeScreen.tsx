import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Clock3, CornerDownLeft, Edit, GraduationCap, Layers3, MessageSquare, MoveLeft, MoveRight, Pencil, Play, Plus, RotateCcw, Save, Settings, Share, Shuffle, Sparkles, Star, Target, Volume2, X } from "lucide-react";
import { FlashcardsSettingsDialog } from "./FlashcardsSettingsDialog";
import { AnimatePresence, motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import React, { Ref, use, useEffect, useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { RichEditor } from "./RichEditor";
import ScoreChartFlashcards from "./ScoreChartFlashcards"
import FlashcardsNavbar from "./FlashcardsNavbar";
import FlashcardsSubNavbar from "./FlashcardsSubNavbar";
import { useParams } from "react-router-dom";
import useFlashcardAutosave from "./useFlashcardAutosave";
import { Flashcard, FlashcardsSet, FlashcardState } from "./flashcardsTypes";
import FlashcardsFinished from "./FlashcardsFinished";




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

const CustomSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-blue-700' : 'bg-slate-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);


type UndoSnapshot = {
    tempFlashcards: Flashcard[];
    newFlashcards: Flashcard[];
    learningFlashcards: Flashcard[];
    masteredFlashcards: Flashcard[];
    currentCardIndex: number;
    mistakesCount: number;
    correctAnswersCount: number;
    isFlipped: boolean;
};


type StudyModeScreenProps = {
    flashcardsState: FlashcardState,
    onSetFlashcardsState: (value: FlashcardState) => void,
    isContentGenerating: boolean,

    startTime: string,
    finishTime: string,
    onSetStartTime: (value: string) => void;
    onSetFinishTime: (value: string) => void;    
    loadedAccuracy: number | null,

    editorTitleRef: Ref<HTMLInputElement> | undefined,
    title: string,
    onSetTitle: (newTitle: string) => void,
    updateTitle: (value: string) => void,

    isIntroDone: boolean,
    onSetIsIntroDone: (value: boolean) => void,
    flashcards: Flashcard[],
    isEditing: boolean,
    onSetIsEditing: (value: boolean) => void,
    isFlipped: boolean,
    onSetIsFlipped: (value: boolean) => void,  
    favoritedFlashcards: Flashcard[],
    onSetFavoritedFlashcards: (value: Flashcard[]) => void,
    onUpdateFlashcard: (updatedCard: Flashcard) => void,
    onSetFlashcards: (cards: Flashcard[]) => void,  
    newFlashcards: Flashcard[],
    onSetNewFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>,
    tempFlashcards: Flashcard[],
    onSetTempFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>,  
    learningFlashcards: Flashcard[],
    onSetLearningFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>,
    masteredFlashcards: Flashcard[],
    onSetMasteredFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>,
    onSetStarredOnly: (value: boolean) => void,
    starredOnly: boolean,   
    
    loadedFlashcardSet: FlashcardsSet | null
}


export default function StudyModeScreen({
    flashcardsState,
    onSetFlashcardsState,
    isContentGenerating,
    loadedAccuracy,

    startTime,
    finishTime, 
    onSetStartTime,
    onSetFinishTime, 

    editorTitleRef,
    title,
    onSetTitle,
    updateTitle,

    isIntroDone,
    onSetIsIntroDone,
    flashcards,
    isEditing,
    onSetIsEditing,
    isFlipped,
    onSetIsFlipped,

    favoritedFlashcards,
    onSetFavoritedFlashcards,
    onUpdateFlashcard,
    onSetFlashcards,
    newFlashcards,
    onSetNewFlashcards,
    tempFlashcards,
    onSetTempFlashcards,
    learningFlashcards,
    onSetLearningFlashcards,
    masteredFlashcards,
    onSetMasteredFlashcards,
    
    onSetStarredOnly,
    starredOnly,
    loadedFlashcardSet           
    
}: StudyModeScreenProps) {
    const params = useParams() 
    const projectId: string | undefined = params.projectID

    // progress - smart tracking
    const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false)

    const [mistakesCount, setMistakesCount] = useState<number>(0)
    const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0)
    const accuracy = loadedAccuracy ? loadedAccuracy : Math.round((correctAnswersCount / (correctAnswersCount + mistakesCount)) * 100) || 0;

    const [settingsIsFlipOn, setSettingsIsFlipOn] = useState<boolean>(false)
    const [isRandomCardOn, setIsRandomCardOn] = useState<boolean>(false)
    const [isAutoAudio, setIsAutoAdio] = useState<boolean>(false)

    const [lastSnapshot, setLastSnapshot] = useState<UndoSnapshot | null>(null);    


    const [currentCardIndex, setCurrentCardIndex] = useState<number>(loadedFlashcardSet?.currentCardIndex || 0)   
    const tempFlashcardsSavedIndex = useRef<number | null>(null) 
    const [isTrackingProgress, setIsTrackingProgress] = useState<boolean>(true);      
    const currentFlashcard = !isTrackingProgress ? flashcards[currentCardIndex] : tempFlashcards[currentCardIndex]
    
    const isThisCardFavorited = currentFlashcard ? favoritedFlashcards.some(card => card.id === currentFlashcard.id) : false

    // Animacja swipe left / right jak na tinderze używając framer motion
    // Stan do wymuszania animacji wylotu przez przyciski
    const [leaveDirection, setLeaveDirection] = useState<"left" | "right" | null>(null);
    const [slideDirection, setSlideDirection] = useState<"left" | "right" | "">("");    

    // Śledzenie fizycznego przeciągnięcia myszką/palcem
    // specjalna zmienna które nie powoduje rerenderów bo normalnie 
    // usestate zabił by wydajność
    const x = useMotionValue(0);
    
    // Transformacje: obrót i przezroczystość nakładek płynnie reagują na ruch 'x'
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacityRight = useTransform(x, [0, 150], [0, 1]); // Zielona nakładka przy ruchu w prawo
    const opacityLeft = useTransform(x, [0, -150], [0, 1]); // Czerwona nakładka przy ruchu w lewo

    // Total amount of points
    const totalMaxPoints = starredOnly ?  favoritedFlashcards.length * 2 : flashcards.length * 2

    const currentPoints = 
        (masteredFlashcards.length * 2) +
        learningFlashcards.reduce((acc, card) => acc + (card.points || 0), 0);

    // Procentowy postęp sesji (0% - 100%)
    const sessionProgress = totalMaxPoints > 0 
        ? Math.floor((currentPoints / totalMaxPoints) * 100) 
        : 0;        

    const masteryPercentage = Math.round((masteredFlashcards.length / (starredOnly ? favoritedFlashcards.length : flashcards.length)) * 100);
    
   

    // Główna funkcja wyzwalana zarówno przez swipe, jak i przyciski
    const handleSwipeAction = (direction: "left" | "right", skipAnotherCard = false) => {
        setLeaveDirection(direction);
        
        // Czekamy chwilę na zakończenie animacji i zmieniamy kartę
        setTimeout(() => {
            setLeaveDirection(null);
            x.set(0); // Reset pozycji
            
            if (direction && !skipAnotherCard) {
                anotherCard()
            }

        }, 300);
    };

    // Wczytywanie danych
    useEffect(() => {
        if(!isDataLoaded && loadedFlashcardSet) {
        
            onSetTempFlashcards(loadedFlashcardSet.tempFlashcards)
            setMistakesCount(loadedFlashcardSet.mistakesCount)
            setCurrentCardIndex(loadedFlashcardSet.currentCardIndex)
            console.log("ostatni index: ", loadedFlashcardSet.currentCardIndex);
            
            setCorrectAnswersCount(loadedFlashcardSet.correctAnswersCount)

            setIsTrackingProgress(loadedFlashcardSet.settings.isTrackingProgress)
            setSettingsIsFlipOn(loadedFlashcardSet.settings.settingsIsFlipOn)            
            onSetStarredOnly(loadedFlashcardSet.settings.starredOnly)
            setIsAutoAdio(loadedFlashcardSet.settings.isAutoAudio)
            setIsRandomCardOn(loadedFlashcardSet.settings.isRandomCardOn)

            setIsDataLoaded(true)

        }

    },[isDataLoaded, loadedFlashcardSet])


    const snapshot: FlashcardsSet | null = loadedFlashcardSet
        ? {
            ...loadedFlashcardSet,
            flashcards,
            tempFlashcards,
            newFlashcards,
            learningFlashcards,
            masteredFlashcards,
            favoritedFlashcards,
            currentCardIndex,
            mistakesCount,
            correctAnswersCount,
            startTime,
            finishTime,
            settings: {
                isTrackingProgress,
                settingsIsFlipOn,
                starredOnly,
                isAutoAudio,
                isRandomCardOn,
            },
        }
        : null;

    const { status, error, retry } = useFlashcardAutosave({
        projectId,
        snapshot,
        enabled: isDataLoaded && loadedFlashcardSet !== null,
    });   
    
    // console.log(status, error, retry);
    


    // synchronizacja kiedy propsy się zmienią
    // Dodaj ten hook na początku komponentu obok innych useRef
    const prevSourceIdsRef = useRef<Set<string>>(new Set());

    // Główny Smart Sync Effect
    useEffect(() => {
        // 1. Określamy źródło prawdy na podstawie trybu
        const sourceList = starredOnly ? favoritedFlashcards : flashcards;
        const currentSourceIds = new Set(sourceList.map(c => c.id));

        if (!isDataLoaded) {
            prevSourceIdsRef.current = currentSourceIds;
            return;
        }        
        const prevIds = prevSourceIdsRef.current;
        
        // Sprawdzamy, czy wygenerowano ZUPEŁNIE NOWE fiszki (brak wspólnych ID)
        let hasOverlap = false;

        for (let id of currentSourceIds) {
            if (prevIds.has(id)) {
                hasOverlap = true;
                break;
            }
        }

        // To jest kompletnie nowa generacja, jeśli zbiór ID jest w 100% inny
        const isCompletelyNew = prevIds.size > 0 && currentSourceIds.size > 0 && !hasOverlap;

        if (isCompletelyNew || prevIds.size === 0) {
            // ---> TWARDY RESET (Nowa generacja fiszek lub start komponentu) <---
            const initialCards = sourceList.map(card => ({ ...card, state: "New" as const, points: 0 }));
            onSetTempFlashcards(initialCards);
            onSetNewFlashcards(initialCards);
            onSetLearningFlashcards([]);
            onSetMasteredFlashcards([]);
            setCurrentCardIndex(0);
            console.log("resecik");
            
        } else {
            // ---> MIĘKKI MERGE (Zwykła edycja, dodanie lub usunięcie fiszki) <---
            const syncCards = (currentList: Flashcard[]) => {
                return currentList
                    .map(card => {
                        const freshCard = sourceList.find(c => c.id === card.id);
                        // Aktualizujemy tylko front/back, chroniąc stan punktów i przegródek!
                        return freshCard ? { ...card, front: freshCard.front, back: freshCard.back } : null;
                    })
                    .filter(Boolean) as Flashcard[]; // Pozbywamy się usuniętych kart
            };

            // Dodajemy nowe fiszki rzucone ręcznie (ikoną plusa w edit mode)
            const freshlyAddedCards = sourceList
                .filter(c => !prevIds.has(c.id))
                .map(c => ({ ...c, state: "New" as const, points: 0 }));

            onSetTempFlashcards(prev => [...syncCards(prev), ...freshlyAddedCards]);
            onSetNewFlashcards(prev => [...syncCards(prev), ...freshlyAddedCards]);
            onSetLearningFlashcards(prev => syncCards(prev));
            onSetMasteredFlashcards(prev => syncCards(prev));
            
            // Bezpiecznik indexu w przypadku ewentualnego skasowania karty
            setCurrentCardIndex(prev => Math.min(prev, Math.max(0, sourceList.length - 1)));
        }

        // Zapisujemy listę ID na poczet kolejnego cyklu re-renderu
        prevSourceIdsRef.current = currentSourceIds;

    }, [flashcards, favoritedFlashcards, starredOnly, isDataLoaded]);






    // Reset progessu + same ulubione fiszki do powtórki
    useEffect(() => {
        if (starredOnly) {
            if (favoritedFlashcards.length > 0) {
                const updatedFavoritedFlashcards: Flashcard[] = favoritedFlashcards.map((card): Flashcard => ({
                    ...card,
                    state: "New",
                    points: 0,
                }))
                onSetTempFlashcards(updatedFavoritedFlashcards)
                onSetNewFlashcards(updatedFavoritedFlashcards)
                onSetLearningFlashcards([])
                onSetMasteredFlashcards([])
                setCurrentCardIndex(0)
            } else {
                alert("0 Favorited flashcards")
            }
        } else {
            if (flashcards.length > 0) {
                const updatedFavoritedFlashcards: Flashcard[] = flashcards.map((card): Flashcard => ({
                    ...card,
                    state: "New",
                    points: 0,
                }))
                onSetTempFlashcards(updatedFavoritedFlashcards)
                onSetNewFlashcards(updatedFavoritedFlashcards)
                onSetLearningFlashcards([])
                onSetMasteredFlashcards([])
                setCurrentCardIndex(0)
            }          
        }

        
    }, [starredOnly])






    useEffect(() => {
        if(!isTrackingProgress) {
            tempFlashcardsSavedIndex.current = currentCardIndex
            setCurrentCardIndex(0)
        } else {
            if(tempFlashcardsSavedIndex.current) {
                setCurrentCardIndex(tempFlashcardsSavedIndex.current)
            }
        }
    }, [isTrackingProgress])


    const handleStartAgain = (hardReset?: boolean) => {
        
        let allSessionFlashcards: Flashcard[] = []

        if (tempFlashcards.length > 0) {
            const resetedTemp: Flashcard[] = tempFlashcards.map((card) => ({
                ...card,
                state: "New",
                points: 0,
            }));

            allSessionFlashcards = [...allSessionFlashcards, ...resetedTemp]
            
        }       
        
        
        if (masteredFlashcards.length > 0) {
            const resetedMastered: Flashcard[] = masteredFlashcards.map((card) => ({
                ...card,
                state: "New",
                points: 0,
            }));

            allSessionFlashcards = [...allSessionFlashcards, ...resetedMastered]
        }

        if(hardReset) {
            const resetedFlashcards: Flashcard[] = flashcards.map((card) => ({
                ...card,
                state: "New",
                points: 0,
            }));

            onSetTempFlashcards(resetedFlashcards)
            onSetNewFlashcards(resetedFlashcards)
            onSetLearningFlashcards([])
            onSetMasteredFlashcards([])
            setCurrentCardIndex(0) 
            resetTimer();
            setLastSnapshot(null);


        }

        onSetFlashcards(allSessionFlashcards)
        onSetFlashcardsState("editMode")


    };

    const saveUndoSnapshot = () => {
        const copyCards = (cards: Flashcard[]) =>
            cards.map(card => ({ ...card }));

        setLastSnapshot({
            tempFlashcards: copyCards(tempFlashcards),
            newFlashcards: copyCards(newFlashcards),
            learningFlashcards: copyCards(learningFlashcards),
            masteredFlashcards: copyCards(masteredFlashcards),
            currentCardIndex,
            mistakesCount,
            correctAnswersCount,
            isFlipped,
        });

        
    };    

    const resetTimer = () => {
        onSetStartTime("");
        onSetFinishTime("");
    };


    // Restart the Flashcards and go to generate another set
    // const handleRestart = () => {

    //     onSetFlashcardsState("generateMode")
    //     resetTimer();        
    //     onSetTempFlashcards([])
    //     onSetNewFlashcards([])
    //     onSetLearningFlashcards([])
    //     onSetMasteredFlashcards([])
    //     setCurrentCardIndex(0) 
    //     onSetFlashcards([])
    //     onSetFavoritedFlashcards([])
    //     onSetIsFlipped(false)
    //     onSetStarredOnly(false)
    //     onSetIsEditing(false)
    //     setMistakesCount(0)

    // };    

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100; // Minimalny dystans przeciągnięcia, żeby zaliczyć akcję
        if (info.offset.x > threshold) {
            handleSwipeAction("right");
        } else if (info.offset.x < -threshold) {
            handleSwipeAction("left");
        }
    };    

    const handleRandomCard = () => {
        const randomCardIndex = Math.floor(Math.random() * tempFlashcards.length)
        setCurrentCardIndex(randomCardIndex)
    }

    const handleRandomCardWithoutTracking = () => {
        const randomCardIndex = Math.floor(Math.random() * flashcards.length)
        setCurrentCardIndex(randomCardIndex)        
    }

    const handleGoBack = () => {
        // Nie cofamy podczas trwającej animacji.
        if (!lastSnapshot || leaveDirection !== null) return;

        onSetTempFlashcards(lastSnapshot.tempFlashcards);
        onSetNewFlashcards(lastSnapshot.newFlashcards);
        onSetLearningFlashcards(lastSnapshot.learningFlashcards);
        onSetMasteredFlashcards(lastSnapshot.masteredFlashcards);

        setCurrentCardIndex(lastSnapshot.currentCardIndex);
        setMistakesCount(lastSnapshot.mistakesCount);
        setCorrectAnswersCount(lastSnapshot.correctAnswersCount);
        onSetIsFlipped(lastSnapshot.isFlipped);

        x.set(0);
        setLeaveDirection(null);

        // Jedno cofnięcie na ostatnią odpowiedź.
        setLastSnapshot(null);

        
    };


    const anotherCard = () => {

        if (!startTime) {
            onSetStartTime(new Date().toISOString());
        }
 

        console.log("currentCardIndex: ", currentCardIndex);
        
        if(currentCardIndex === tempFlashcards.length - 1) {
            setCurrentCardIndex(0)
            console.log("index reset: ", 0);
            
        } else {
            if(isRandomCardOn) {
                handleRandomCard()
            } else {
                const newCardIndex = currentCardIndex + 1
                setCurrentCardIndex(newCardIndex)

                // jeżeli w ógle jest audio to puszcamy dźwięk
                if(isAutoAudio) {
                    const newCard = flashcards[newCardIndex]

                    // jeżeli jest włączony tylko term no to logiczne że chcemy cały czas puszczam przód
                    if (!settingsIsFlipOn) {
                        onSetIsFlipped(false); // Resetuj stan flip na false, jeśli settingsIsFlipOn jest false
                        handleSpeak(newCard.front)
                    } else {
                        handleSpeak(newCard.back)
                    }
                }             
            }
                        
        }

        
    }


    // Funkcje do śledzenia indeksu podczas normalnego przeglądania kart bez trackingu progressu
    const nextCard = () => {
        if(isRandomCardOn) {
            handleRandomCardWithoutTracking()
        } else {
            if (currentCardIndex < flashcards.length - 1) {
                setSlideDirection("right")

                const newCardIndex = currentCardIndex + 1
                setCurrentCardIndex(newCardIndex);

                // jeżeli w ógle jest audio to puszcamy dźwięk
                if(isAutoAudio) {
                    const newCard = flashcards[newCardIndex]

                    // jeżeli jest włączony tylko term no to logiczne że chcemy cały czas puszczam przód
                    if (!settingsIsFlipOn) {
                        onSetIsFlipped(false); // Resetuj stan flip na false, jeśli settingsIsFlipOn jest false
                        handleSpeak(newCard.front)
                    } else {
                        handleSpeak(newCard.back)
                    }
                }

            } else {
                setCurrentCardIndex(0)
            }
        }
    }
    

    const previousCard = () => {
        if(isRandomCardOn) {
            handleRandomCardWithoutTracking()
        } else {
            if (currentCardIndex > 0) {
                setSlideDirection("right")

                const newCardIndex = currentCardIndex - 1
                setCurrentCardIndex(newCardIndex);


                // jeżeli w ógle jest audio to puszcamy dźwięk
                if(isAutoAudio) {
                    const newCard = flashcards[newCardIndex]

                    // jeżeli jest włączony tylko term no to logiczne że chcemy cały czas puszczam przód
                    if (!settingsIsFlipOn) {
                        onSetIsFlipped(false); // Resetuj stan flip na false, jeśli settingsIsFlipOn jest false
                        handleSpeak(newCard.front)
                    } else {
                        handleSpeak(newCard.back)
                    }
                }       
            } else {
                setCurrentCardIndex(flashcards.length - 1)
            }
        }

    };    


    // przedłużenie streaku lub rozpoczęcie - uniwersalne
    const extendStreak = async () => {

        try {
            const response = await fetch("http://localhost:8000/api/extendStreak", {
                method: "POST",
                credentials: "include",
        });
        
        if (!response.ok) return console.log("Problem with extending streak");
            console.log("Succesfuly extended daily streak");
        } catch (error) {
            console.log("Problem with extending daily streak from quiz", error);
        }  
    }  


    const addCompletedActivity = async ({
        attemptId,
        activityType,
        projectId,
        resourceId,
        correctAnswers,
        totalQuestions,
        }: {
        attemptId: string;
        activityType: "notes" | "quiz" | "flashcards" | "podcast";
        projectId?: string;
        resourceId?: string;
        correctAnswers?: number;
        totalQuestions?: number;
    }) => {
    const response = await fetch(
        "http://localhost:8000/api/activity/complete",
        {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            attemptId,
            activityType,
            projectId,
            resourceId,
            correctAnswers,
            totalQuestions,
        }),
        },
    );

    if (!response.ok) {
        throw new Error("Could not register completed activity");
    }

    return response.json();
    };    


    const completeFlashcards = async () => {
        const attemptIdRef = crypto.randomUUID();

        await addCompletedActivity({
            attemptId: attemptIdRef,
            activityType: "flashcards",
            projectId,
            resourceId: loadedFlashcardSet?.id,
        });        
    }

    const handleCardRemoval = (updatedTempCards: Flashcard[]) => {
        if (!settingsIsFlipOn) {
            onSetIsFlipped(false); // Resetufconsole.log(status, error, retry);j stan flip na false, jeśli settingsIsFlipOn jest false
        }

        // Zakończenie nauki
        if (updatedTempCards.length === 0) {
            completeFlashcards()
            extendStreak()
            onSetFinishTime(new Date().toISOString());
            onSetFlashcardsState("finished");
            return;
        }

        // Jeśli usunięto ostatni element w tablicy, cofnij indeks na początek
        if (currentCardIndex >= updatedTempCards.length) {
            setCurrentCardIndex(0);
        } 
        
        // W przeciwnym razie currentCardIndex pozostaje bez zmian, 
        // ponieważ kolejna karta automatycznie wskoczyła na obecne miejsce.
    };    



    // Shortcuts
    // 1. Wydzielone akcje dla czytelności kodu i obsługi zdarzeń
    const toggleFavorite = () => {
        if (!currentFlashcard) return;
        const isThisCardFavorited = favoritedFlashcards.some(card => card.id === currentFlashcard.id);
        const updatedCards = isThisCardFavorited
            ? favoritedFlashcards.filter(card => card.id !== currentFlashcard.id)
            : [...favoritedFlashcards, currentFlashcard];
        onSetFavoritedFlashcards(updatedCards);
    };



    const handleDontKnow = () => {
        if (!currentFlashcard || leaveDirection !== null) return;

        // ROBIMY SNAPSHOTA OSTATNIEJ WERSJI WRAZIE GDY UŻYTKOWNIK BĘDZIE CHCIAŁ COFNAĆ
        saveUndoSnapshot();

        if (currentFlashcard.state === "New") {
            const updatedCard: Flashcard = { ...currentFlashcard, state: "Learning", points: 0 };
            
            onSetLearningFlashcards(prev => [...prev, updatedCard]);
            onSetNewFlashcards(prev => prev.filter(card => card.id !== currentFlashcard.id));
            onSetTempFlashcards(prev => prev.map(c => c.id === currentFlashcard.id ? updatedCard : c));
        } else if (currentFlashcard.state === "Learning" && currentFlashcard.points === 1) {
            const updatedCard: Flashcard = { ...currentFlashcard, points: 0 };
            
            onSetLearningFlashcards(prev => prev.map(c => c.id === currentFlashcard.id ? updatedCard : c));
            onSetTempFlashcards(prev => prev.map(c => c.id === currentFlashcard.id ? updatedCard : c));
        }

        setMistakesCount(prev => prev + 1);
        handleSwipeAction("left");
    };


    const handleIKnow = () => {
        if (!currentFlashcard || leaveDirection !== null) return;

        // ROBIMY SNAPSHOTA OSTATNIEJ WERSJI WRAZIE GDY UŻYTKOWNIK BĘDZIE CHCIAŁ COFNAĆ
        saveUndoSnapshot();

        if (currentFlashcard.state === "New") {
            const updatedCard: Flashcard = { ...currentFlashcard, state: "Learning", points: 1 };

            onSetLearningFlashcards(prev => [...prev, updatedCard]);
            onSetNewFlashcards(prev => prev.filter(card => card.id !== currentFlashcard.id));
            onSetTempFlashcards(prev => prev.map(c => c.id === currentFlashcard.id ? updatedCard : c));

            handleSwipeAction("right");
        } else if (currentFlashcard.state === "Learning") {
            if (currentFlashcard.points === 1) {
                const updatedCard: Flashcard = { ...currentFlashcard, state: "Mastered", points: 2 };

                onSetMasteredFlashcards(prev => [...prev, updatedCard]);
                onSetLearningFlashcards(prev => prev.filter(card => card.id !== currentFlashcard.id));

                const nextTemp = tempFlashcards.filter(card => card.id !== currentFlashcard.id);
                onSetTempFlashcards(nextTemp);
                handleCardRemoval(nextTemp);
                handleSwipeAction("right", true);
            } else {
                const updatedCard: Flashcard = { ...currentFlashcard, points: 1 };

                onSetLearningFlashcards(prev => prev.map(c => c.id === currentFlashcard.id ? updatedCard : c));
                onSetTempFlashcards(prev => prev.map(c => c.id === currentFlashcard.id ? updatedCard : c));
                handleSwipeAction("right");
            }
        }

        setCorrectAnswersCount(prev => prev + 1);
    };



    // 2. Main Keyboard Shortcuts Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignoruj skróty, jeśli użytkownik pisze w inpucie, textarea lub edytorze
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable ||
                target.closest('[contenteditable="true"]')
            ) {
                return;
            }

            // Działaj tylko w trybie nauki (studyMode)
            if (flashcardsState !== "studyMode") return;

            switch (e.code) {
                case "Space":
                    e.preventDefault();
                    onSetIsFlipped(!isFlipped);

                    if(isAutoAudio && currentFlashcard) {
                        handleSpeak(isFlipped ? currentFlashcard.back : currentFlashcard.front)
                    }    
                    break;

                case "KeyE":
                    e.preventDefault();
                    onSetIsEditing(!isEditing);
                    break;

                case "KeyF":
                    e.preventDefault();
                    toggleFavorite();
                    break;

                case "KeyS":
                    e.preventDefault();
                    if(isTrackingProgress) {
                        handleRandomCard()
                    } else {
                        handleRandomCardWithoutTracking()
                    }
                    break;                    

                case "ArrowLeft":
                    e.preventDefault();
                    if (isTrackingProgress) {
                        handleDontKnow();
                    } else {
                        previousCard();
                    }
                    break;

                case "ArrowRight":
                    e.preventDefault();
                    if (isTrackingProgress) {
                        handleIKnow();
                    } else {
                        nextCard();
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        flashcardsState,
        isFlipped,
        isEditing,
        isTrackingProgress,
        currentCardIndex,
        currentFlashcard,
        favoritedFlashcards,
        tempFlashcards,
    ]);

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };

        loadVoices();

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);    


    // Funkcja wyciągająca czysty tekst z HTML i wywołująca Web Speech API
    const handleSpeak = (htmlContent: string) => {
        if (!('speechSynthesis' in window)) {
            alert("Your browser does not support speech synthesis.");
            return;
        }

        // Stopuj poprzednie czytanie, jeśli kliknięto przycisk ponownie
        window.speechSynthesis.cancel();

        // 1. Oczyszczanie tekstu z tagów HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent || "";
        const cleanText = tempDiv.textContent || tempDiv.innerText || "";

        if (!cleanText.trim()) return;

        // 2. Konfiguracja Utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Wybór najbardziej naturalnego głosu (Google / Natural / Microsoft Neural)
        const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices() 
        
        // Priorytet dla głosów neuronowych/online, potem zwykłych angielskich
        const preferredVoice = availableVoices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online'))
        ) || availableVoices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Subtelne korekty dla bardziej naturalnego brzmienia (nie-robotycznego)
        utterance.rate = 0.95; // Lekko zwolnione dla lepszej dykcji
        utterance.pitch = 1.0;  // Naturalna wysokość tonu

        window.speechSynthesis.speak(utterance);
    };    
    

    return (
        <>

            {/* <-----------------STUDY MODE-----------------> */}
            {flashcardsState === "studyMode" && (
                <div className="relative h-full w-full bg-white text-[#282e3e] rounded-xl overflow-hidden"> 

                    {/* TOP META - HEADER*/}
                    {/* background color bg-bg-[#f7f8fa]/90 */}
                    <FlashcardsNavbar
                        isContentGenerating={isContentGenerating}
                        editorTitleRef={editorTitleRef}
                        title={title}
                        onSetTitle={onSetTitle}
                        onUpdateTitle={updateTitle}
                    /> 


                    {/* CONTENT */}
                    <div className="w-full h-full">
                        <main className="max-w-[844px] mx-auto px-6 lg:px-8 ">

                          
                            {/* SUB NAVBAR SETTINGS */}
                            <FlashcardsSubNavbar
                                onSetIsTrackingProgress={setIsTrackingProgress} 
                                isTrackingProgress={isTrackingProgress} 
                                onSetStarredOnly={onSetStarredOnly} 
                                starredOnly={starredOnly}                                 
                                isFlipped={isFlipped} 
                                onSetIsFlipped={onSetIsFlipped} 
                                onSetSettingsIsFlipOn={setSettingsIsFlipOn} 
                                handleStartAgain={handleStartAgain}    
                                onSetIsAutoAudio={setIsAutoAdio}
                                isAutoAudio={isAutoAudio}                        
                            />                    

                            {/* <--------------- LEARNING STATS - NAVIGATION ------------> */}
                            {isTrackingProgress ? (

                                <div 
                                    style={{ animationDelay: `${0.3}s`}}
                                    className="flex flex-col items-center justify-center mb-8 animate-face-down">

                                        {/* Saving progress */}
                                        {/* {status === "saving" && <span>Zapisywanie…</span>}

                                        {status === "saved" && <span>Zapisano</span>}

                                        {status === "error" && (
                                            <div role="alert">
                                                <span>{error}</span>
                                                <button onClick={retry}>Ponów zapis</button>
                                            </div>
                                        )} */}
                                    <div
                                        className="
                                            flex items-center
                                            h-10
                                            px-1.5
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
                                            <span className="text-[11px] font-medium text-[#8b93a5]">
                                                Session progress
                                            </span>
                                        </div>                                                           
                                    </div>                
                                </div>
                            ) : (
                                <div className="mb-18"></div>
                            )}

                            {/* <------FLASHCARD CONTAINER--->*/}
                            <section className="flex flex-col items-center">

                                
                                <div className="relative w-full max-w-[820px] h-[440px]">
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
                                                            if (isTopCard) onSetIsIntroDone(true);
                                                        }}
                                                    >
                                                        <div className="w-full h-full" style={{ perspective: "1400px" }}>
                                                            <div className="relative w-full h-full [transform-style:preserve-3d]">
                                                                <div className="absolute inset-0 bg-white border-2 border-gray-200/80 rounded-[16px] flex flex-col items-center justify-center px-12">
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
                                        


                                        // AnimatePresence pozwala animowac niszczone elementy przed zniknięciem z ekranu
                                        <AnimatePresence mode="popLayout">
                                            <motion.div
                                                key={currentCardIndex}
                                                style={{ x, rotate }}
                                                // stan początkowy animacji - narodzin
                                                initial={{ scale: 0.95, opacity: 0 }}
                                                // stan końcowy po animacji
                                                animate={{ 
                                                    scale: 1, 
                                                    opacity: 1,
                                                    // Jeśli przycisk został kliknięty, wymuś wylot:
                                                    x: leaveDirection === "right" ? 500 : leaveDirection === "left" ? -500 : 0,
                                                    rotate: leaveDirection === "right" ? 15 : leaveDirection === "left" ? -15 : 0
                                                }}
                                                exit={{ scale: 0.95, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={0.7}
                                                onDragEnd={handleDragEnd}
                                                className="absolute top-0 left-0 w-full h-full z-50 cursor-grab active:cursor-grabbing"
                                            >
                                                {/* NAKŁADKA UMIEM (pojawia się przy ruchu w prawo) */}
                                                <motion.div 
                                                    style={{ opacity: opacityRight }} 
                                                    className="absolute inset-0 z-50 flex gap-2 items-center justify-center bg-green-50
                                                    border-2 border-green-700 rounded-[16px] pointer-events-none"
                                                >
                                                    <Check size={40} className=" font-bold text-green-700"/>
                                                    <span className="text-4xl font-bold text-green-700 px-6 py-2">
                                                        I know
                                                    </span>
                                                </motion.div>

                                                {/* NAKŁADKA UCZĘ SIĘ (pojawia się przy ruchu w lewo) */}
                                                <motion.div 
                                                    style={{ opacity: opacityLeft }} 
                                                    className="absolute inset-0 z-50 flex gap-2 items-center justify-center bg-amber-50
                                                    border-2 border-amber-700 rounded-[16px] pointer-events-none"
                                                >
                                                    <GraduationCap size={40} className=" font-bold text-amber-700"/>
                                                    <span className="text-4xl font-bold text-amber-700 px-6 py-2">
                                                        Still Learning
                                                    </span>
                                                </motion.div>

                                                {/* --- TUTAJ ZOSTAWIASZ CAŁY SWÓJ OBECNY KOD KARTY 3D --- */}

                                                <div
                                                    className={`w-full h-full cursor-pointer`}
                                                    style={{ perspective: "1400px" }}
                                                    onClick={() => {
                                                        if(!isEditing)  {
                                                            const isFlippedNow = !isFlipped;
                                                            onSetIsFlipped(isFlippedNow)

                                                            if(isAutoAudio && currentFlashcard) {
                                                                handleSpeak(isFlippedNow ? currentFlashcard.back : currentFlashcard.front)
                                                            }   
                                                            }
                                                        }
                                                    }
                                                >
                                                {/* ZEWNĘTRZNY DIV: Odpowiada tylko za animację opadania/pojawiania */}
                                                    <div className={`w-full h-full ${isTrackingProgress ? "animate-face-down" : "animate-face-up"}`}>
                                                        
                                                        {/* WEWNĘTRZNY DIV: Odpowiada tylko za obrót karty 3D */}
                                                        <div
                                                            className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
                                                            style={{
                                                                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                                            }}
                                                        >

                                                        {/* FRONT AKTYWNEJ KARTY */}
                                                        <div className={`w-full h-full bg-white border-2 rounded-[16px] 
                                                            [backface-visibility:hidden] flex flex-col items-center justify-between
                                                            transition-all duration-300 shadow-[0px_2px_0px_#e5e7eb]  
                                                            ${isEditing ? "border-blue-600" : "border-gray-200/80"} `}>
                                                            

                                                            {/* Nagłówkowa nawigacjia karty */}
                                                            <div className="w-full flex items-center px-4 pt-4 justify-between">
                                                                
                                                                <Tooltip>
                                                                    <TooltipTrigger render={
                                                                        <button 
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation()
                                                                                const updatedIsEditing = !isEditing
                                                                                onSetIsEditing?.(updatedIsEditing) 
                                                                            }}
                                                                            className={` p-2
                                                                            rounded-md active:scale-[0.97] transition-all duration-200
                                                                            ${isEditing ? "bg-neutral-100 text-gray-900 hover:bg-blue-50 hover:text-blue-700" 
                                                                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"}`}
                                                                        >
                                                                            {isEditing ? <Check className="w-6 h-6" /> : <Pencil className="w-6 h-6"  />}
                                                                        </button>    
                                                                    }/>
                                                                    <TooltipContent>
                                                                        {isEditing ? "Save changes" : "Edit the flashcard"}
                                                                        <Kbd>E</Kbd>
                                                                    </TooltipContent>
                                                                </Tooltip>     

                                                                <Tooltip>
                                                                    <TooltipTrigger render={                                                                       
                                                                        <div
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
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
                                                                                    className={`w-6 h-6 transition-all duration-200 hover:bg-neutral-100 rounded-md 
                                                                                            group-hover:text-amber-400   ${
                                                                                        isThisCardFavorited ? "text-amber-400 fill-amber-400" : "text-gray-400"
                                                                                    }`}
                                                                                />
                                                                            </motion.div>
                                                                        </div>                                                                             
                                                                    }/>
                                                                    
                                                                    <TooltipContent>
                                                                        <p>{isThisCardFavorited ? `Remove from Favorites` : `Add to Favorites`}</p><Kbd>F</Kbd>
                                                                    </TooltipContent>
                                                                </Tooltip>  

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
                                                                    value={currentFlashcard ? currentFlashcard.front : ""} 
                                                                    isEditing={isEditing} 
                                                                    onChange={(html) => {
                                                                        if (currentFlashcard && onUpdateFlashcard && isEditing) { // onUpdateFlashcard
                                                                            const updatedFlashcard = { ...currentFlashcard, front: html }
                                                                            console.log('aktualizacja karty podczas edytowania', updatedFlashcard);
                                                                            
                                                                            onUpdateFlashcard(updatedFlashcard);
                                                                            onSetTempFlashcards(prev => prev.map(card => card.id === currentFlashcard.id ? updatedFlashcard : card))
                                                                        }
                                                                    }}
                                                                    studyMode={true}
                                                                    additionalClassName="HugeText text-[38px] lg:text-[44px] leading-[1.15] font-normal tracking-[-0.035em] text-[#282e3e]"
                                                                />                                                        
                                                            </div>

                                                            {/* Footer nawigacja karty */}
                                                            <div className="w-full flex items-center pl-4 pr-4 pb-4">

                                                                <div className="flex-1 ml-2 flex items-center justify-start">   
                                                                    {isTrackingProgress && (                                                     
                                                                        <Tooltip >
                                                                            <TooltipTrigger render={
                                                                                    
                                                                                        <div className={`w-3 h-3 rounded-full 
                                                                                            ${currentFlashcard?.state === "New" 
                                                                                            ? "bg-blue-600" : currentFlashcard?.state === "Learning" 
                                                                                            ? "bg-amber-500" : "bg-green-700"}`} 
                                                                                        />      
                                                                                                                                                                
                                                                            }>                                     
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Learning</p>
                                                                            </TooltipContent>
                                                                        </Tooltip> 
                                                                    )}  
                                                                </div>  
                                                                   


                                                                {/* Środek - tekst */}
                                                                <div className="flex-shrink-0 text-center">
                                                                    <Tooltip>
                                                                        <TooltipTrigger render={
                                                                            <div className="text-[11px] text-[#a0a7b5]">
                                                                                Click to reveal answer
                                                                            </div>  
                                                                        }>                                                         
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Flip card <Kbd>space</Kbd>
                                                                        </TooltipContent>
                                                                    </Tooltip>                                                              
                                                                </div>                                                           

                                                                <div className="flex-1 flex items-center justify-end">
                                                                    <Tooltip>
                                                                        <TooltipTrigger render={ 
                                                                            <button 
                                                                                onClick={(e) =>  {
                                                                                    e.stopPropagation()
                                                                                    handleSpeak(currentFlashcard.front)
                                                                                }}
                                                                                className="hover:text-neutral-900 text-neutral-400 p-2 hover:bg-neutral-100 rounded-md active:scale-[0.97] transition-all duration-200"
                                                                            >
                                                                                <Volume2 className="w-6 h-6" />
                                                                            </button>     
                                                                        }/>
                                                                        <TooltipContent>
                                                                            <p>Listen to card</p>
                                                                        </TooltipContent>
                                                                    </Tooltip> 
                                                                </div>                                                                                                               
        

                                                            </div> 


                                                        </div>

                                                        {/* BACK AKTYWNEJ KARTY */}
                                                        <div className={`absolute inset-0 bg-white border-2 rounded-[16px] 
                                                        [backface-visibility:hidden] shadow-[0px_2px_0px_#e5e7eb]
                                                        [transform:rotateY(180deg)] flex flex-col items-center justify-center ${isEditing ? "border-blue-600" : "border-gray-200/80"} `}>

                                                            <div className="w-full h-full flex flex-col justify-between items-center">
                                                                {/* Nagłówkowa nawigacjia karty */}
                                                                <div className="w-full flex items-center px-4 pt-4 justify-between">
                                                                    
                                                                <Tooltip>
                                                                    <TooltipTrigger render={
                                                                        <button 
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation()
                                                                                const updatedIsEditing = !isEditing
                                                                                onSetIsEditing?.(updatedIsEditing) 
                                                                            }}
                                                                            className={` p-2
                                                                            rounded-md active:scale-[0.97] transition-all duration-200
                                                                            ${isEditing ? "bg-neutral-100 text-gray-900 hover:bg-blue-50 hover:text-blue-700" 
                                                                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"}`}
                                                                        >
                                                                            {isEditing ? <Check className="w-6 h-6" /> : <Pencil className="w-6 h-6"  />}
                                                                        </button>    
                                                                    }/>
                                                                    <TooltipContent>
                                                                        {isEditing ? "Save changes" : "Edit the flashcard"}
                                                                        <Kbd>E</Kbd>
                                                                    </TooltipContent>
                                                                </Tooltip>  

                                                                    <Tooltip>
                                                                        <TooltipTrigger render={                                                                       
                                                                            <div
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
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
                                                                                        className={`w-6 h-6 transition-all duration-200 hover:bg-neutral-100 rounded-md 
                                                                                             group-hover:text-amber-400   ${
                                                                                            isThisCardFavorited ? "text-amber-400 fill-amber-400" : "text-gray-400"
                                                                                        }`}
                                                                                    />
                                                                                </motion.div>
                                                                            </div>                                                                             
                                                                        }/>
                                                                        
                                                                        <TooltipContent>
                                                                            <p>{isThisCardFavorited ? `Remove from Favorites` : `Add to Favorites`}</p><Kbd>F</Kbd>
                                                                        </TooltipContent>
                                                                    </Tooltip>                                                                          


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
                                                                        onChange={(html) => {
                                                                            if (currentFlashcard && onUpdateFlashcard && isEditing) { //onUpdateFlashcard
                                                                                const updatedFlashcard = { ...currentFlashcard, back: html }
                                                                                console.log('aktualizacja karty podczas edytowania', updatedFlashcard);
                                                                                
                                                                                onUpdateFlashcard(updatedFlashcard);
                                                                                onSetTempFlashcards(prev => prev.map(card => card.id === currentFlashcard.id ? updatedFlashcard : card))
                                                                            }
                                                                        }}
                                                                        studyMode={true}
                                                                        additionalClassName="HugeText text-[38px] lg:text-[44px] leading-[1.15] font-normal tracking-[-0.035em] text-[#282e3e]"
                                                                    />
                                                                </div>

                                                                {/* Footer nawigacja karty */}
                                                                <div className="w-full flex items-center pl-4 pr-4 pb-4">

                                                                    <div className="flex-1 ml-2 flex items-center justify-start">                                                        
                                                                    {isTrackingProgress && (                                                     
                                                                        <Tooltip >
                                                                            <TooltipTrigger render={                                                                                    
                                                                                <div className={`w-3 h-3 rounded-full 
                                                                                    ${currentFlashcard?.state === "New" 
                                                                                    ? "bg-blue-600" : currentFlashcard?.state === "Learning" 
                                                                                    ? "bg-amber-500" : "bg-green-700"}`} 
                                                                                />                                                                                                                                                                      
                                                                            }>                                     
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Learning</p>
                                                                            </TooltipContent>
                                                                        </Tooltip> 
                                                                    )}  
                                                                    </div>      


                                                                    {/* Środek - tekst */}
                                                                    <div className="flex-shrink-0 text-center">
                                                                        <Tooltip>
                                                                            <TooltipTrigger render={
                                                                                <div className="text-[11px] text-[#a0a7b5]">
                                                                                    The answer
                                                                                </div>   
                                                                            }>                                                        
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                Flip card <Kbd>space</Kbd>
                                                                            </TooltipContent>
                                                                        </Tooltip>                                                              
                                                                    </div>                                                           

                                                                    <div className="flex-1 flex items-center justify-end">
                                                                        <Tooltip>
                                                                            <TooltipTrigger render={                                                                       
                                                                                <button 
                                                                                    onClick={(e) =>  {
                                                                                        e.stopPropagation()
                                                                                        handleSpeak(currentFlashcard.back)
                                                                                    }}
                                                                                    className="hover:text-neutral-900 text-neutral-400 p-2 hover:bg-neutral-100 rounded-md 
                                                                                        active:scale-[0.97] transition-all duration-200"
                                                                                >
                                                                                    <Volume2 className="w-6 h-6" />
                                                                                </button>                                                                                
                                                                            }/>
                                                                            
                                                                            <TooltipContent>
                                                                                <p>Listen to card</p>
                                                                            </TooltipContent>
                                                                        </Tooltip> 
                                                                    </div>                                                                                                               
            

                                                                </div> 
                                                            </div>


                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                                {/* ---------------------------------------------------- */}
                                            </motion.div>
                                        </AnimatePresence>


                                )}
                            </div>


                                {/* NAVIGATION & LEARN MODE TOGGLE BAR */}
                                <div className="w-full flex mt-3">

                                    {/* Left control: Toggle Switch or Prev Button based on mode */}
                                    <div className="flex-1 flex items-center justify-start gap-3">
                                        <Tooltip >
                                            <TooltipTrigger render={
                                                <div className="flex items-center gap-1 rounded-lg  py-2">
                                                    <span className="text-xs font-semibold  text-gray-600">Track Progress</span>
                                                    <CustomSwitch checked={isTrackingProgress} onChange={() => {
                                                        setIsTrackingProgress(!isTrackingProgress)}
                                                    }/> 
                                                </div>                                                   
                                            }>                                         
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Track your progress through the flashcards.</p>
                                            </TooltipContent>
                                        </Tooltip>                                    
                                    </div>

                                    {/* Center UI: Action buttons if Learn mode, or Counter if Browse mode */}
                                    <div className="flex-shrink-0 translate-y-[22px]">
                                        {isTrackingProgress && (
                                            <div
                                                style={{ animationDelay: `${0.3}s`}} 
                                                className="flex gap-5 animate-face-up">
                                                <button
                                                    onClick={() => {
                                                        handleDontKnow()
                                                    }}
                                                    className="px-6 py-[14px] rounded-[10px] bg-red-50 text-[15px] 
                                                    font-semibold flex items-center text-red-700 transition-all active:translate-y-[3px] 
                                                    cursor-pointer"
                                                >
                                                    <X className="w-5 h-5 mr-2" />
                                                    Don't Know
                                                </button> 

                                                <button
                                                    onClick={() => {                                                        
                                                        handleIKnow()
                                                    }}
                                                    className="px-9 py-[14px] rounded-[10px] bg-green-700/90 
                                                    text-[15px] font-semibold flex items-center text-white transition-all
                                                        hover:bg-green-700/85 cursor-pointer 
                                                    active:translate-y-[3px] shadow-[0px_3px_0px_#016630] active:shadow-none"
                                                >
                                                    <Check className="w-5 h-5 mr-2" />
                                                    I Know
                                                </button> 
                                            </div>
                                        )}
                                    </div>

                                    {!isTrackingProgress && (
                                        <>
                                            {/* NAVIGATION */}
                                            <div 
                                                style={{ animationDelay: `${0.2}s`}}
                                                className={`flex items-center gap-3 mt-2 animate-face-up`}> 

                                                <Tooltip >
                                                    <TooltipTrigger render={
                                                        <button
                                                            onClick={previousCard}
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
                                                    }>                                     
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={6}>
                                                        Previous <Kbd><MoveLeft/></Kbd>
                                                    </TooltipContent>
                                                </Tooltip>                                               



                                                {/* Lewa strona - kulka */}
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


                                                <Tooltip >
                                                    <TooltipTrigger render={
                                                        <button
                                                            onClick={nextCard}
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
                                                    }>                                 
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={6}>
                                                        Next <Kbd><MoveRight/></Kbd>
                                                    </TooltipContent>
                                                </Tooltip>                                               

                                            </div>                                      
                                        </>                                
                                    )}                                

                                    {/* Right control: Undo (Learn Mode) OR Shuffle/Next (Browse Mode) */}
                                    <div className="flex-1 flex items-center justify-end gap-2">
                                        {isTrackingProgress ? (
                                            <>

                                                <Tooltip >
                                                    <TooltipTrigger render={
                                                        <button
                                                            onClick={() => {
                                                                handleGoBack()
                                                            }}
                                                            disabled={!lastSnapshot || leaveDirection !== null}
                                                            className={`w-11 h-11 flex items-center justify-center duration-200 rounded-md
                                                            text-gray-700 transition-all  p-2 
                                                            ${lastSnapshot ? "hover:text-gray-900 hover:bg-gray-100 active:translate-y-[3px] " 
                                                            : "cursor-not-allowed"}`}                                                            
                                                        >
                                                            <CornerDownLeft className="w-5 h-5" />
                                                        </button>                                                          
                                                    }>
                                                                                                
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Go back <Kbd>Z</Kbd>
                                                    </TooltipContent>
                                                </Tooltip>         
        

                                                <Tooltip >
                                                    <TooltipTrigger render={
                                                        <button
                                                            onClick={() => {
                                                                setIsRandomCardOn(!isRandomCardOn)
                                                            }}
                                                            className={`w-11 h-11 flex items-center justify-center duration-200 rounded-md
                                                            hover:text-gray-900 transition-all hover:bg-gray-100 p-2
                                                            ${isRandomCardOn ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
                                                        >
                                                            <Shuffle className="w-5 h-5" />
                                                        </button>                                                           
                                                    }>                                        
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Shuffle <Kbd>S</Kbd>
                                                    </TooltipContent>
                                                </Tooltip>                                                                                   
                                            </>                                   
                                        ) : (
                                            <>
                                                <Tooltip >
                                                    <TooltipTrigger render={
                                                        <button
                                                            onClick={() => {
                                                                setIsRandomCardOn(!isRandomCardOn)
                                                            }}
                                                            className={`w-11 h-11 flex items-center justify-center duration-200 rounded-md
                                                            hover:text-gray-900 transition-all hover:bg-gray-100 p-2
                                                            ${isRandomCardOn ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'}`}
                                                        >
                                                            <Shuffle className="w-5 h-5" />
                                                        </button>                                                          
                                                    }>                                          
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Shuffle <Kbd>S</Kbd>
                                                    </TooltipContent>
                                                </Tooltip>                                               
                                            </>
                                        )}
                                    </div>
                                    
                                </div>


                            </section>
                            

                        </main>
                    </div>
                </div>
            )}  





            {/* <-----------------FINISHED FLASHCARDS SECTION -----------------> */}
            {/* <-----------------FINISHED FLASHCARDS SECTION -----------------> */}    
                   
            {flashcardsState === "finished" && (
                <div className="relative h-full w-full bg-white text-[#282e3e] overflow-hidden">

                    {/* TOP META - HEADER*/}
                    {/* background color bg-bg-[#f7f8fa]/90 */}
                    <FlashcardsNavbar
                        isContentGenerating={isContentGenerating}
                        editorTitleRef={editorTitleRef}
                        title={title}
                        onSetTitle={onSetTitle}
                        onUpdateTitle={updateTitle}
                    /> 


                    {/* ================= CONTENT ================= */}
                    <FlashcardsFinished
                        cardsMastered={masteredFlashcards}
                        accuracy={accuracy}
                        startTime={startTime}
                        finishTime={finishTime}
                        score={masteryPercentage}
                        flashcards={flashcards}
                        onSetFlashcardsState={onSetFlashcardsState}

                        onSetIsTrackingProgress={setIsTrackingProgress}
                        isTrackingProgress={isTrackingProgress}
                        onSetStarredOnly={onSetStarredOnly}
                        starredOnly={starredOnly}                                
                        isFlipped={isFlipped}
                        onSetIsFlipped={onSetIsFlipped}
                        onSetSettingsIsFlipOn={setSettingsIsFlipOn}
                        handleStartAgain={handleStartAgain}
                        onSetIsAutoAudio={setIsAutoAdio}
                        isAutoAudio={isAutoAudio}                         
                    />

                </div>
            )}

        </>
    )

}