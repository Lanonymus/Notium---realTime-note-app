
export type FlashcardState = "generateMode" | "editMode" | "studyMode"  | "normalMode" | "finished";
export type FlashcardGenerationState = "none" | "extractedNotes" | "createdFlashcards"

export type Flashcard = {
    id: string,
    front: string,
    back: string,
    state: "New" | "Learning" | "Mastered",
    points: number
}

export type FlashcardsSettings = {
    isTrackingProgress: boolean,
    settingsIsFlipOn: boolean,
    starredOnly: boolean,
    isAutoAudio: boolean,
    isRandomCardOn: boolean
}


export type FlashcardsSet = {
    id: string,

    flashcards: Flashcard[],
    tempFlashcards: Flashcard[],
    newFlashcards: Flashcard[],
    learningFlashcards: Flashcard[],
    masteredFlashcards: Flashcard[],
    favoritedFlashcards: Flashcard[],
    currentCardIndex: number,
    mistakesCount: number
    correctAnswersCount: number
    settings: FlashcardsSettings
    createdAt: string,
    startTime: string,
    finishTime: string
};


export type levelTypes = "Easy" | "Medium" | "Hard" | "Extreme";