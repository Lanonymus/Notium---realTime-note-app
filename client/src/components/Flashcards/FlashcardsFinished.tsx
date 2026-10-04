import { Dispatch, SetStateAction, useId, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionType, QuizState, UserAnswer } from '../Quiz/quizTypes';
import { Flashcard, FlashcardState } from './flashcardsTypes';
import { FlashcardsSettingsDialog } from './FlashcardsSettingsDialog';
import FlashcardsSummaryStats from './FlashcardsSummaryStats';
import DoodleConfetti from '../DoodleConfetti';
import { ScoreChart } from '../ScoreChart';


type QuizFinishedProps = { 
  cardsMastered: Flashcard[],
  accuracy: number,
  score: number,
  startTime: string,
  finishTime: string,
  flashcards: Flashcard[],
  onSetFlashcardsState: (value: FlashcardState) => void,


  onSetIsTrackingProgress: (value: boolean) => void,
  isTrackingProgress: boolean,
  onSetStarredOnly: (value: boolean) => void,
  starredOnly: boolean,  
  isFlipped: boolean,
  onSetIsFlipped: (value: boolean) => void,   
  onSetSettingsIsFlipOn: (value: boolean) => void,
  onSetIsAutoAudio: (value: boolean) => void,
  isAutoAudio: boolean,    
  handleStartAgain: (value: boolean) => void,  
};

export default function FlashcardsFinished({
    cardsMastered,
    accuracy,
    startTime,
    finishTime,
    score,
    flashcards,
    onSetFlashcardsState,

    onSetIsTrackingProgress,
    isTrackingProgress, 
    onSetStarredOnly,
    starredOnly,                                 
    isFlipped,
    onSetIsFlipped, 
    onSetSettingsIsFlipOn,
    handleStartAgain,
    onSetIsAutoAudio,
    isAutoAudio,      

}: QuizFinishedProps) {

  const correctCount = cardsMastered.length
  const reduceMotion = useReducedMotion();
  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const [isAfterAnimation, setIsAfterAnimation] = useState<boolean>(false)
  
  console.log("start: ", startTime);
  console.log("end: ", finishTime);
  
  
  const seconds = Math.floor(
    Math.abs(new Date(finishTime).getTime() - new Date(startTime).getTime()) / 1000
  );

  // Visual preview only: this value is not awarded or persisted.
  const previewXp = correctCount * 4


  return (
    <section className="mx-auto  w-full max-w-[900px] px-4 pb-16 pt-10 text-gray-800 sm:px-8 sm:pt-12 ">


      <div className="w-full flex items-center justify-between">

        <header className="text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">Flashcards summary</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Session complete</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">LeTS gOoO!</p>
        </header>

        <div className="flex justify-center">
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

      </div>


        <motion.div 
          initial={reduceMotion ? false : { opacity: 0, y: 6 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          
          >
            <div className="flex flex-col items-center py-7 text-center">

              <div
                className="relative my-4 h-[210px] w-[210px] overflow-visible"
                aria-label={`Quiz score: ${safeScore}%`}
              >
                <ScoreChart 
                  score={safeScore} 
                  title={"mastered"}
                />
                <DoodleConfetti />
              </div>

              <p className="mt-1 text-sm font-medium text-gray-700">{flashcards.length} flashcards mastered!</p>
              <p className="mt-1.5 max-w-md text-sm leading-6 text-gray-400">
                {flashcards.length === 0 ? 'No flashcards in this session.' : "You crushed it! keep building the momentum"}
              </p>
            </div>

          <FlashcardsSummaryStats 
            accuracy={accuracy} 
            experience={previewXp} 
            timeInSeconds={seconds} 
            isAfterAnimation={isAfterAnimation}
          />

          {/* {reviewCount > 0 && (
            <button type="button" onClick={openMistakes} className="mt-4 flex w-full items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3.5 text-left transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600">
              <span className="text-sm text-gray-600">Revisit the flashcards you missed.</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          )} */}
        </motion.div>

      <footer className="mt-8 border-t border-gray-100 pt-4">


        <div className="flex flex-col gap-3 sm:flex-row">
          <Button 
            onClick={() => handleStartAgain(true)}
            type="button" 
            disabled={flashcards.length === 0}
            className="h-[46px] gap-2 rounded-lg bg-blue-600 px-5 text-white 
              hover:bg-blue-700 cursor-pointer"
            >
              <RefreshCcw className="h-4 w-4" />
              {'Study again'}
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSetFlashcardsState("generateMode")} 
            className="h-11 gap-2 rounded-lg border-gray-200 px-5 text-gray-700
              shadow-[1px_1px_0px_#e5e7eb] active:shadow-none active:translate-y-[3px] cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Generate new quiz
              {/* <span className="text-xs text-gray-400"></span> */}
          </Button>                
        </div>
      </footer>    

      

    </section>
  );
}
