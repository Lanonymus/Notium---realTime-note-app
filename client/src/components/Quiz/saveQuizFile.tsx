import React, { useEffect, useRef, useState } from 'react';
import { 
  BrainCircuit, 
  Trophy, 
  Check, 
  X, 
  Circle, 
  CircleDot, 
  ChevronDown,
  ArrowRight,
  RefreshCcw,
  BookOpen,
  Settings,
  EllipsisVertical,
  Lightbulb,
  CheckCheck,
  MousePointerClick,
  SquareCheckBig,
  SquarePen,
  Clock,
  Timeline
} from 'lucide-react';
import { ScoreChart } from '../ScoreChart';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuizSettingsDialog } from './QuizSettingsDialog';
import { Spinner } from '@/components/ui/spinner';
import { useParams } from 'react-router-dom';
import { getFormattedTime } from './GetFormattedTime';
import { FormatTime } from './FormatTime';
import { Skeleton } from '../ui/skeleton';
import { motion } from 'framer-motion';
import { extractNotes } from './HelperFunctions';
import CreatingScreen from '../CreatingScreen';

export type QuestionTypeEnum = 'multipleChoice' | 'true/false' | 'shortAnswer';


export interface GeneratedQuestion {
  id: string;
  text: string;
  type: QuestionTypeEnum;
  options?: string[];       // Required for 'multipleChoice' (4 options)
  correctIndex?: number;   // Required for 'multipleChoice' (0-3)
  correctAnswer?: boolean; // Required for 'true/false'
  explanation: string;
  hint: string;
  topicId?: string;        // Link to topic
  timeInSeconds: number
}

export interface GeneratedTopic {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizGenerationResponse {
  // Returned only if existing topics were not provided in the request
  topics?: GeneratedTopic[];
  questions: GeneratedQuestion[];
}

type QuestionType = {
  id: string,
  text: string,
  options?: string[],
  type: "multipleChoice" | "true/false" | "shortAnswer",
  correctIndex?: number,
  correctAnswer?: boolean,
  explanation: string,
  hint: string,
  timeInSeconds: number
}

export type TopicType = {
    id: string;
    name: string;
    description: string;
    difficulty: string,
    accuracy?: string,
}

// Mock data for topics and formats section
// const MOCK_TOPICS: TopicType[] = [
//     { 
//         id: 'math', 
//         name: 'Calculus & Planimetry', 
//         description: "Advanced Math problems related to Calculus and Geometry focused on High school math level", 
//         difficulty: 'Hard', 
//         accuracy: '68% Correct' 
//     },
//     { 
//         id: 'cs', 
//         name: 'React & TypeScript', 
//         difficulty: 'Medium', 
//         description: "Tutorial on React and typescript for beginners", 
//         accuracy: '82% Correct' 
//     },
//     { 
//         id: 'eng', 
//         name: 'English Grammar', 
//         difficulty: 'Easy', 
//         description: "English B2 grammar level focused on grammar exercises",         
//         accuracy: '95% Correct' 
//     }
// ];

// --- MOCK DATA ---
// const questions: QuestionType[] = [
//   {
//     id: "1",
//     text: "Why do state updating functions in React (e.g. setSessions) cause re-renders?",
//     type: "shortAnswer",
//     explanation: "The main task of functions like setState/useState is to signal React that the data has changed. This automatically puts the component in the render queue so the UI always reflects the latest state.",
//     hint: "Think about how React 'learns' that it needs to recalculate what is shown on the screen."
//   },
//   {
//     id: "2",
//     text: "Does useEffect run by default on every component re-render?",
//     type: "true/false",
//     correctAnswer: true,
//     explanation: "useEffect with an empty dependency array [] allows side effects (like network requests) to run exactly once after the component mounts on the screen.",
//     hint: "You are looking for a hook used to handle so-called side effects."
//   },
// ];

const QUESTION_TYPES = [
  { id: 'mc', name: 'Multiple Choice', description: "Classic format with answer choices", icon: <MousePointerClick className="w-4 h-4" /> },
  { id: 'fb', name: 'True or False', description: "True or False questions", icon: <SquareCheckBig className="w-4 h-4" /> },
  { id: 'sa', name: 'Short Answer', description: "You have to write a short answer", icon: <SquarePen className="w-4 h-4" /> }
];

const formatMap: Record<string, string> = {
  'Multiple Choice': 'mc',
  'True or False': 'fb',
  'Short Answer': 'sa',
};

// --- TYPES ---

interface UserAnswer {
  questionId: string,
  selectedOptionIndex: number,
  userAnswer?: string,
  isCorrect: boolean,
  suggestedAnswer?: string
}

type WrongAnswer = {
  question: string,
  userAnswer: string,
  correctAnswer: string
}



export type QuizSettings = {
  spacedRepetition: boolean;
  timeLimit: boolean;
  immediateFeedback: boolean;
};

interface UserAnswer {
  questionId: string,
  selectedOptionIndex: number,
  userAnswer?: string,
  isCorrect: boolean,
  suggestedAnswer?: string
}



export type QuizInstance = {
  id: string;             // np. crypto.randomUUID()
  createdAt: string;      // data w formacie ISO (new Date().toISOString())
  quizFormats: string[];  // np. ['mc', 'fb'] lub nazwy pełne
  topics: TopicType[];
  questions: QuestionType[];
  settings: QuizSettings;
  userAnswers: UserAnswer[];
  selectedTopics: TopicType[]  
};

type QuizState = 'createMode' | 'generating' | 'active' | 'finished';
type GenerationState = "none" | "extractedNotes" | "CreatedQuestions"


const SharpLightning = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Perfectly sharp path of a classic lightning bolt */}
    <path d="M13 2L3 14h7v8l11-12h-7V2z" />
  </svg>
);

export default function QuizView() {
    const [quizState, setQuizState] = useState<QuizState>('createMode');
    const [generationState, setGenerationState] = useState<GenerationState>("none")
    const [questionCount, setQuestionCount] = useState<number>(5);

    const params = useParams() 
    const projectId: string | undefined = params.projectID
       
    const [questions, setQuestions ] = useState<QuestionType[]>([]) 
    const [isAiGeneratingQuiz, setIsAiGeneratingQuiz] = useState<boolean>(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestion = questions[currentQuestionIndex];    

    // Czasy / timery
    const startTime = useRef<number>(null)
    const finishTime = useRef<number>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [showHint, setShowHint] = useState<boolean>(false)
    const [userAnswer, setUserAnswer] = useState<string | null>(null)
    const [chatSuggestedAnswer, setChatSuggestedAnswer] = useState<string | null>(null)
    const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null)
    const [isCheckingLLM, setIsCheckingLLM] = useState(false)

    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [expandedEndingId, setExpandedEndingId] = useState<string | null>(null);


    // Information from the Settings Dialog:
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['mc', 'fb']);
    const [topics, setTopics] = useState<TopicType[] | null>(null)    


    // Stany opcji nauki (Study Options)
    const [spacedRepetition, setSpacedRepetition] = useState<boolean>(false);
    const [immediateFeedback, setImmediateFeedback] = useState<boolean>(true);
    const [timeLimit, setTimeLimit] = useState<boolean>(false);    

    // Collecting users wrong answers in order to display them later if spacedReperition
    const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);

    // Zmienne do śledzenia wczytywanych danych
    const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
    const [quizId, setQuizId] = useState<string | null>(null)
    const [quizObject, setQuizObject] = useState<QuizInstance | null>(null);




    const loadQuizez = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/getQuizez", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
          }),
        });

        if (!response.ok) return console.log("error fetching quizez data");

        const data = await response.json();
        console.log("quizy w projekcie: ", data);

        if (Array.isArray(data) && data.length > 0) {
          const lastQuiz = data[data.length - 1];

          // 1. Wczytanie pytań i przywrócenie postępu
          if (lastQuiz.questions && lastQuiz.questions.length > 0) {
            setQuestions(lastQuiz.questions);
            setQuizId(lastQuiz.id);
            // zapisywanie obiektu quizu
            setQuizObject(lastQuiz);


            const savedAnswers = lastQuiz.userAnswers || [];
            setUserAnswers(savedAnswers);

            // Jeśli odpowiedziano na wszystkie pytania – przejdź do podsumowania
            if (savedAnswers.length >= lastQuiz.questions.length) {
              setQuizState('finished');
              setCurrentQuestionIndex(lastQuiz.questions.length - 1);
            } else {
              // W przeciwnym razie ustaw indeks na pierwsze nieodpowiedziane pytanie
              setQuizState('active');
              setCurrentQuestionIndex(savedAnswers.length);
              setSelectedOption(null);
              setIsAnswerChecked(false);
              setTimeLeft(null);
              startTime.current = Date.now();

              if (lastQuiz.settings?.timeLimit) {
                setIsTimerRunning(true);
              }
            }
          }

          console.log(lastQuiz)
          // 2. Tematy
          if (lastQuiz.topics) {
            console.log(lastQuiz.topics);
            
            setTopics(lastQuiz.topics);
            console.log("selectedTopics: ", lastQuiz.selectedTopics);
            setSelectedTopics(lastQuiz.selectedTopics.map((t: TopicType) => t.id));
          }

          // 3. Ustawienia
          if (lastQuiz.settings) {
            if (typeof lastQuiz.settings.timeLimit === 'boolean') {
              setTimeLimit(lastQuiz.settings.timeLimit);
            }
            if (typeof lastQuiz.settings.spacedRepetition === 'boolean') {
              setSpacedRepetition(lastQuiz.settings.spacedRepetition);
            }            
            if (typeof lastQuiz.settings.immediateFeedback === 'boolean') {
              setImmediateFeedback(lastQuiz.settings.immediateFeedback);
            }            
          }

          // 4. Mapowanie formatów
          if (lastQuiz.quizFormats && Array.isArray(lastQuiz.quizFormats)) {

            const mappedTypes = lastQuiz.quizFormats
              .map((f: string) => formatMap[f])
              .filter(Boolean);

            if (mappedTypes.length > 0) {
              setSelectedTypes(mappedTypes);
            }
          }
        }

        setIsDataLoaded(true);

      } catch (error) {
        console.log("error fetching quizez data", error);
      }
    };



    // Ładowanie quizów i wyświetlanie ostatniego
    useEffect(() => {
      if(isDataLoaded) return

      loadQuizez()
    }, [isDataLoaded]) 




    // Resetowanie progressu quizu
    const resetQuizProgress = () => {
      // Główne postępy i statystyki
      setWrongAnswers([]);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizState('active'); 
      
      // Czasy całkowite
      startTime.current = Date.now();
      finishTime.current = null;
      
      // Stan interfejsu pojedynczego pytania
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setTrueFalseAnswer(null);
      setUserAnswer(null);
      
      // AI i podpowiedzi
      setChatSuggestedAnswer(null);
      setShowHint(false);
      
      // Stan ekranu podsumowania
      setExpandedEndingId(null);

      // Stan timera bieżącego pytania
      setTimeLeft(null); // useEffect sam ustawi odpowiedni czas dla indexu 0
      if (timeLimit) {
        setIsTimerRunning(true);
      } else {
        setIsTimerRunning(false);
      }
      // Zapisanie stanów
      handleSaveQuizData(false, true, false, selectedTopics, selectedTypes, topics!, []);
    };

    
    // --- LOGIC ---
    const handleStartQuiz = async () => {
      // Prevent spamming

      if(isAiGeneratingQuiz || !projectId) return

      const quizFormats = selectedTypes.map(id => QUESTION_TYPES.find(type => type.id === id)?.name)
      setIsAiGeneratingQuiz(true)
      setQuizState("generating")

      try {


        const controller = new AbortController();
        const extractedNotes = await extractNotes(projectId, controller.signal)

        setGenerationState("extractedNotes")

        const response = await fetch("http://localhost:8000/api/generateQuiz", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              extractedNotes,
              quizFormats,
              quizTopics: topics && topics.length > 0 ? topics : null,
              questionCount,
              spacedRepetition,
              wrongAnswers,
              timeLimit,
              immediateFeedback,
              selectedTopics
            })
          });

        if (response.ok) {
            const data = await response.json(); 
            const quizData: QuizGenerationResponse = data.quizData            

            // If AI generated new topics (because there were none before), save them to state
            if (quizData.topics && quizData.topics.length > 0) {
              setTopics(data.newQuiz.topics);
              if(data.newQuiz.selectedTopics && data.newQuiz.selectedTopics.length > 0) {
                setSelectedTopics(data.newQuiz.selectedTopics.map((t : TopicType) => t.id));
              } else {
                setSelectedTopics(data.newQuiz.topics.map((t: TopicType) => t.id));
              }

              // console.log("Topics: ", quizData.topics);
              // console.log("Questions: ", quizData.questions);
            }

            // Set generated quiz questions
            setQuizState('active');
            setCurrentQuestionIndex(0);
            setQuestions(quizData.questions);          
            setUserAnswers([]);
            setSelectedOption(null);
            setIsAnswerChecked(false)   
            setTimeLeft(null)

            if(timeLimit) {
              setIsTimerRunning(true)
            }
            startTime.current = new Date().getTime()     

            // Zapisujemy nowy quiz:
            // TODO: popraw stan quizGeneration i faktycznie zaktualizuj ten obiekt quizu żeby potem aktualizacje szły do dobrego quizu
            // a nie dopiero od odświeżenia drugiego
            console.log("nowy quiz: ",data.newQuiz);
            
            setQuizObject(data.newQuiz);
            setQuizId(data.newQuiz.id);
            setGenerationState("CreatedQuestions")
            
            
                  
          }          
      } catch (error) {
          console.error("Error generating quiz: ", error);
      } finally {
        setIsAiGeneratingQuiz(false)
      }
    };




  const evaluateAnswerWithAi = async (question: string, userAnswer: string, correctAnswer: string) => {
    try {
        const response = await fetch("http://localhost:8000/api/checkAnswer", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question, 
              userAnswer,
              correctAnswer
            })
          });

        if(response.ok) {
          const result = await response.json();
          console.log("result: ", result);
          return result
        } else {
          console.error("Backend API error");
          return false
          
        }

    } catch (error) {
       console.error("Error while checking written answer: ", error);
    }
  }



  const handleCheckAnswer = async () => {
   
    let isCorrect = false
    let aiFeedback = ""
    setIsTimerRunning(false)

    // Zmienne pomocnicze do bezpiecznego zapisania tekstów (dla LLM i stanu)
    let actualUserAnswerText = "";
    let actualCorrectAnswerText = "";    

    // Evaluate the type of the current question
    if(currentQuestion.type === "multipleChoice") {
      isCorrect = selectedOption === currentQuestion.correctIndex;

      actualUserAnswerText = selectedOption !== null ? currentQuestion.options![selectedOption] : "Brak odpowiedzi"
      actualCorrectAnswerText = currentQuestion.correctIndex !== undefined ? currentQuestion.options![currentQuestion.correctIndex] : ""
  
    }  
    else if (currentQuestion.type === "true/false") {
      isCorrect = trueFalseAnswer === currentQuestion.correctAnswer
      actualUserAnswerText = trueFalseAnswer !== null ? trueFalseAnswer.toString() : "Brak odpowiedzi"
      actualCorrectAnswerText = currentQuestion.correctAnswer!.toString()

    } 
    else if (currentQuestion.type === "shortAnswer") {
      if(!userAnswer) return

      setIsCheckingLLM(true)
      try {
        const aiResult = await evaluateAnswerWithAi(
          currentQuestion.text,
          userAnswer,
          currentQuestion.explanation
        )

        isCorrect = aiResult.isCorrect
        aiFeedback = aiResult.feedback
        setChatSuggestedAnswer(aiFeedback)
      } catch (error) {
          console.error("AI Error:", error);
          aiFeedback = "An error occurred while checking the answer.";
      } finally {
          setIsCheckingLLM(false); // Disable loading
      }

      actualUserAnswerText = userAnswer
      actualCorrectAnswerText = currentQuestion.explanation || "Brak odpowiedzi"
    } 

    const sound = new Audio(
      isCorrect 
        ? "/sounds/correctAnswer.mp3"
        : "/sounds/wrongAnswer.mp3"
    )

    sound.volume = 0.5

    void sound.play().catch((error) => {
      console.error("Could not play answer sound: ", error)
    })

    if(!isCorrect) {
      setWrongAnswers(prev => [
        ...prev, 
        {
          question: currentQuestion.text,
          userAnswer: actualUserAnswerText,
          correctAnswer: actualCorrectAnswerText
        }
      ])
    }
    
    // Save score to state
    setIsAnswerChecked(true)
    setUserAnswers(prev => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOptionIndex: selectedOption ?? -1,
        isCorrect: isCorrect,
        userAnswer: actualUserAnswerText,
        suggestedAnswer: aiFeedback
      }
    ])
  };




  // <--------ZAPISYWANIE AKTUALNEGO STANU QUIZU---------->
  const handleSaveQuizData = async (
    spacedRepetitionProp: boolean = spacedRepetition, 
    immediateFeedbackProp: boolean = immediateFeedback,
    timeLimitProp: boolean = timeLimit,
    selectedTopicsProp: string[] = selectedTopics,
    selectedTypesProp: string[] = selectedTypes,
    newTopicsProps: TopicType[] = topics!,
    userAnswersProps: UserAnswer[] = userAnswers,
  ) => {
    if (!quizObject) return;

    // const selectedTopicsObjects =

    // Tworzymy świeży obiekt zaktualizowanego quizu
    const updatedQuiz: QuizInstance = {
      ...quizObject,
      userAnswers: userAnswersProps,
      selectedTopics: topics ? topics.filter(t => selectedTopicsProp.includes(t.id)) : quizObject.topics,
      quizFormats: selectedTypesProp.map(id => QUESTION_TYPES.find(type => type.id === id)!.name),
      settings: { 
        spacedRepetition: spacedRepetitionProp,
        immediateFeedback: immediateFeedbackProp,
        timeLimit: timeLimitProp,
      },
      topics: newTopicsProps 
    };

    // Uaktualniamy stan lokalny
    setQuizObject(updatedQuiz);

    try {
      const response = await fetch("http://localhost:8000/api/saveQuizProgress", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          quizObject: updatedQuiz, // <-- Wysyłamy gotowy zaktualizowany obiekt
          quizId: quizId,
        })
      });
      
      if (!response.ok) return console.log("Problem z zapisaniem progressu");

      console.log("Zapisano progress użytkownika");
    } catch (error) {
      console.log("Problem z zapisaniem progressu", error);
    }      
  };



  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setTrueFalseAnswer(null)
      setUserAnswer(null)
      setChatSuggestedAnswer(null)
      setIsAnswerChecked(false);

      if(timeLimit) {
        setIsTimerRunning(true)
      }

    } else {
      setQuizState('finished');
      finishTime.current = new Date().getTime()
    }

    handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit)
  };


  useEffect(() => {
    if(!currentQuestion || !timeLimit || !isTimerRunning) return

    // Resetowanie przy nowych pytaniach
    setTimeLeft(currentQuestion.timeInSeconds)

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev) {
          if (prev <= 1) {
            
            handleCheckAnswer()
            return null
          }
          return prev - 1
        }
        return null
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentQuestion, isTimerRunning, timeLimit])

  // Smart check button handling
  const isAnswerReadyToSubmit = () => {
    if(currentQuestion.type === "multipleChoice") return selectedOption !== null;
    if(currentQuestion.type === "true/false") return trueFalseAnswer !== null;
    if(currentQuestion.type === "shortAnswer") return userAnswer !== null && userAnswer.trim().length > 3;

    return false
  }

  const calculateScore = () => {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    return Math.round((correctCount / questions.length) * 100);
  };

  const stages = {
    "none": 0,
    "extractedNotes": 1,
    "CreatedQuestions": 2
  }
  
  const TIPS = [
      "You can turn on mistakes focusing mode",
      "Check out quiz settings to improve experience",
      "Only goats are doing quizez on hardcore mode",
      "You can always get a hint",
  ];

  const STAGES = [
      { label: "Notes", description: "Organizing notes" },
      { label: "Questions", description: "Writing Questions" },
  ];


  

  if (quizState === "generating") {
    return (
      <CreatingScreen
        customDictStages={stages}
        generationState={generationState}
        customTips={TIPS}
        customObjectStages={STAGES}
        estimatedWaitTime={12}
        kind={"Quiz"}
      />
    )
  }

  // jeżeli kontent się ładuję
  if (!isDataLoaded) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center p-6 pt-8 bg-white rounded-xl">
        {/* Prawy górny róg - Ustawienia i Upgrade */}
        <div className="absolute top-3 right-3 flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <div className="w-[2px] h-5 bg-neutral-200" />
          <Skeleton className="h-9 w-32 rounded-[7px]" />
        </div>

        {/* Środkowa sekcja główna */}
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
          {/* Ilustracja ołówka */}
          <div className="mb-2">
            <Skeleton className="w-[200px] h-[160px] rounded-2xl" />
          </div>

          {/* Tytuł i opis */}
          <div className="w-full flex flex-col items-center space-y-3">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>

          {/* Wybór liczby pytań */}
          <div className="w-full max-w-[400px] my-2 py-5 border-y border-neutral-100 flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>

          {/* Przycisk Start */}
          <Skeleton className="h-12 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // --- START SCREEN ---
  if (quizState === 'createMode' && isDataLoaded) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 pt-8 bg-white rounded-xl">

      <div className="absolute top-3 right-3 w-fit h-fit flex justify-center items-center">

          <QuizSettingsDialog
            selectedTopics={selectedTopics}
            onSetSelectedTopics={(newTopics) => {
              setSelectedTopics(newTopics);
              handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, newTopics);
            }}
            selectedTypes={selectedTypes}
            onSetSelectedTypes={(newTypes) => {
              setSelectedTypes(newTypes)
              handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, newTypes);                    
            }}
            topics={topics}
            onSetTopics={(newTopics) => {
              setTopics(newTopics);
              if(newTopics) {
                handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, selectedTypes, newTopics);
              }             
            }}
            spacedRepetition={spacedRepetition}
            onSetSpacedRepetition={(boolean) => {
              setSpacedRepetition(boolean);
              handleSaveQuizData(boolean, immediateFeedback, timeLimit, selectedTopics);
            }}
            immediateFeedback={immediateFeedback}
            onSetImmediateFeedback={(boolean) => {             
              setImmediateFeedback(boolean);
              handleSaveQuizData(spacedRepetition, boolean, timeLimit, selectedTopics);
            }}
            timeLimit={timeLimit}
            onSetTimeLimit={(boolean) => {
              setTimeLimit(boolean);
              if (!isAnswerChecked) {
                setIsTimerRunning(boolean);
              }
              handleSaveQuizData(spacedRepetition, immediateFeedback, boolean, selectedTopics);
            }}
            onResetProgress={() => resetQuizProgress()}                  
          />

          <div className="w-[2px] h-5  bg-gray-200 mx-3"/>
          
          <button className="
              flex items-center justify-center gap-2.5 
              px-3 py-[9px]  bg-blue-600 hover:bg-blue-500 
              rounded-[7px] cursor-pointer
              transition-all duration-200 active:scale-[0.97]
          ">
              <SharpLightning className="w-[18px] h-[18px] text-white" />

              <span className="text-white text-[12px]  font-medium tracking-wide">
                  Upgrade to Pro
              </span>
          </button> 
      </div>        
        
        <div className="max-w-md w-full flex flex-col items-center justify-center  text-center space-y-6">
          <div className="w-fit h-fit rounded-2xl flex items-center justify-center mb-15">
            <img src="/pencil.png" className="w-[250px] h-auto rotate-[150deg]" alt="" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Ready for Quiz?</h1>
            <p className="text-neutral-500 text-base leading-relaxed">
              Test yourself on the skills in this project and earn master points for what you already know!
            </p>


            {/* 1. Liczba fiszek */}


              <div className="max-w-[400px] mt-5 mb-2 mx-auto flex items-center justify-between border-t-1 border-b-1 border-gray-100  p-5">
                  <span className="text-sm font-medium text-neutral-800">Amount of Questions:</span>

                  <div className="relative flex gap-1 bg-neutral-200/60 p-1 rounded-lg">
                  {[5, 10, 15].map((num) => (
                      <button
                          key={num}
                          onClick={() => setQuestionCount(num)}
                          className={`relative px-4 py-[6px] text-xs font-semibold rounded-md transition-colors duration-200 cursor-pointer ${
                              questionCount === num ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
                          }`}
                      >
                      {/* Przesuwane tło pod aktywnym przyciskiem */}
                      {questionCount === num && (
                          <motion.div
                          layoutId="activeCountTab"
                          className="absolute inset-0 bg-white rounded-md shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                      )}

                      {/* Tekst przycisku (z z-10, aby był nad tłem) */}
                      <span className="relative z-10">{num}</span>
                      </button>
                  ))}
                  </div>

              </div>     

              
       

          </div>

          <button 
            onClick={handleStartQuiz}
            className={`flex items-center gap-2 text-white rounded-lg px-8 py-3.5 font-medium transition-colors
            focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 
             ${isAiGeneratingQuiz ? "cursor-not-allowed bg-neutral-700" : "cursor-pointer bg-neutral-900 hover:bg-neutral-800"}`}
          >
            {isAiGeneratingQuiz && <Spinner/>}
            <span>{isAiGeneratingQuiz ? "Takes about 30 seconds..." : "Start Quiz"}</span>
          </button>
        </div>
      </div>
    );
  }

  // --- SUMMARY SCREEN ---
  if (quizState === 'finished' && isDataLoaded) {
    const score = calculateScore();

    return (
      <div className="max-w-4xl mx-auto mt-8 md:mt-12 px-6 pb-24 h-full overflow-auto">

        <div className="absolute top-3 right-3 w-fit h-fit flex justify-center items-center">

          <QuizSettingsDialog
            selectedTopics={selectedTopics}
            onSetSelectedTopics={(newTopics) => {
              setSelectedTopics(newTopics);
              handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, newTopics);
            }}
            selectedTypes={selectedTypes}
            onSetSelectedTypes={(newTypes) => {
              setSelectedTypes(newTypes)
              handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, newTypes);                    
            }}
            topics={topics}
            onSetTopics={(newTopics) => {
              setTopics(newTopics);
              if(newTopics) {
                handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, selectedTypes, newTopics);
              }             
            }}
            spacedRepetition={spacedRepetition}
            onSetSpacedRepetition={(boolean) => {
              setSpacedRepetition(boolean);
              handleSaveQuizData(boolean, immediateFeedback, timeLimit, selectedTopics);
            }}
            immediateFeedback={immediateFeedback}
            onSetImmediateFeedback={(boolean) => {             
              setImmediateFeedback(boolean);
              handleSaveQuizData(spacedRepetition, boolean, timeLimit, selectedTopics);
            }}
            timeLimit={timeLimit}
            onSetTimeLimit={(boolean) => {
              setTimeLimit(boolean);
              if (!isAnswerChecked) {
                setIsTimerRunning(boolean);
              }
              handleSaveQuizData(spacedRepetition, immediateFeedback, boolean, selectedTopics);
            }}
            onResetProgress={() => {
              resetQuizProgress()
            }}                  
          />

            <div className="w-[2px] h-5  bg-gray-200 mx-3"/>
            
            <button className="
                flex items-center justify-center gap-2.5 
                px-3 py-[9px]  bg-blue-600 hover:bg-blue-500 
                rounded-[7px] cursor-pointer
                transition-all duration-200 active:scale-[0.97]
            ">
                <SharpLightning className="w-[18px] h-[18px] text-white" />

                <span className="text-white text-[12px]  font-medium tracking-wide">
                    Upgrade to Pro
                </span>
            </button> 
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900">Session Summary</h2>
          <p className="text-neutral-500">Analyze your mistakes to learn more effectively.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          
          {/* Left column: Questions list */}
          <div className="lg:col-span-3 space-y-3">
            {questions.map((question, idx) => {
              const answer = userAnswers.find(answer => answer.questionId === question.id);
              const isCorrect = answer?.isCorrect;
              const isExpanded = expandedEndingId === question.id;

              return (
                <div key={question.id} className="border border-neutral-200 rounded-xl overflow-hidden bg-white transition-all">
                  <button 
                    onClick={() => setExpandedEndingId(isExpanded ? null : question.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium text-neutral-800 line-clamp-1">{question.text}</span>
                    </div>
                    <ChevronDown className={`shrink-0 w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Accordion with explanation */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-neutral-100 bg-neutral-50">
                      <div className="mt-4 space-y-3">
                        {!isCorrect && (
                          <div className="text-sm">
                            <span className="text-neutral-500 block mb-1">Your answer:</span>
                            <span className="text-red-600 font-medium">{userAnswers[idx].userAnswer}</span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-neutral-500 block mb-1">Correct answer:</span>
                          <span className="text-green-600 font-medium">{question.correctIndex && question.options ? question.options[question.correctIndex] : userAnswers[idx].suggestedAnswer}</span>
                        </div>
                        <div className="text-sm bg-white border border-neutral-200 p-3 rounded-lg mt-2 text-neutral-600">
                          <strong className="text-neutral-900 block mb-1">Explanation:</strong>
                          {question.explanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column: Statistics */}
          <div className="lg:col-span-2 flex flex-col items-center bg-white border border-neutral-200  rounded-2xl text-center sticky top-12">
            
            <div className="p-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100">
                <Trophy className="w-8 h-8 text-neutral-900" strokeWidth={1.5} />
              </div>

              {/* SVG Circular progress chart */}
              <div className="relative w-50 h-50 mb-6">
                <ScoreChart score={score} />
              </div>

              <div className="flex w-full justify-between px-4 mb-8 text-sm">
                <div className="flex flex-col">
                  <span className="text-neutral-500">Correct</span>
                  <span className="font-medium text-neutral-900">{userAnswers.filter(a => a.isCorrect).length} / {questions.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-neutral-500">Time</span>
                  <span className="font-medium text-neutral-900">
                    {finishTime.current && startTime.current ? getFormattedTime(startTime.current, finishTime.current) : "undefined"}
                  </span>
                </div>
              </div>
            </div>


            {/* --- SEKACJA AKCJI I USTAWIENIA KOLEJNEGO QUIZU --- */}
            <div className="w-full pt-6 border-t border-neutral-100 space-y-3 p-8">
              
              {/* Segmented Control - Wybór liczby pytań */}
              <div className="flex items-center justify-between bg-neutral-50/80 p-1.5 rounded-xl border border-neutral-200/60">
                <span className="text-xs font-medium text-neutral-500 pl-2">Questions count</span>
                
                {/* Kontener przełącznika */}
                <div className="relative flex bg-neutral-200/50 p-1 rounded-lg">
                  {/* Pływające tło w stylu Apple (Slider) */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      questionCount === 10 ? "translate-x-full" : "translate-x-0"
                    }`}
                  />

                  {/* Przyciski */}
                  {[5, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      // relative + z-10 sprawia, że tekst jest ZAWSZE nad pływającym tłem
                      className={`relative z-10 w-10 cursor-pointer py-1 text-xs font-semibold rounded-md transition-colors duration-300 ${
                        questionCount === num 
                          ? "text-neutral-900" // Ciemny tekst gdy aktywny
                          : "text-neutral-500 hover:text-neutral-700" // Szary tekst gdy nieaktywny
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

              </div>

              {/* Główny przycisk CTA */}
              <button 
                onClick={handleStartQuiz}
                className={`flex w-full justify-center items-center gap-2 text-white rounded-xl px-6 py-3.5 font-medium transition-all shadow-sm
                focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 active:scale-[0.99]
                ${isAiGeneratingQuiz ? "cursor-not-allowed bg-neutral-800 text-neutral-300 text-[12px]" : "cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-sm "}`}
              >
                {isAiGeneratingQuiz ? <Spinner className="shrink-0"/> : <RefreshCcw className="w-4 h-4" />}
                <span>{isAiGeneratingQuiz ? "Takes about 30 seconds..." : "Start Another Quiz"}</span>
              </button>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ SCREEN ---
  if (quizState === "active" && isDataLoaded) {
    return (
      <div className="max-w-3xl mx-auto 2xl:mt-12 xl:mt-15 mt-15  px-4 pb-24 h-full flex flex-col">

        <div className="absolute top-3 right-3 w-fit h-fit flex justify-center items-center">

            <QuizSettingsDialog
              selectedTopics={selectedTopics}
              onSetSelectedTopics={(newTopics) => {
                setSelectedTopics(newTopics);
                handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, newTopics);
              }}
              selectedTypes={selectedTypes}
              onSetSelectedTypes={(newTypes) => {
                setSelectedTypes(newTypes)
                handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, newTypes);                    
              }}
              topics={topics}
              onSetTopics={(newTopics) => {
                setTopics(newTopics);
                if(newTopics) {
                  handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, selectedTypes, newTopics);
                }             
              }}
              spacedRepetition={spacedRepetition}
              onSetSpacedRepetition={(boolean) => {
                setSpacedRepetition(boolean);
                handleSaveQuizData(boolean, immediateFeedback, timeLimit, selectedTopics);
              }}
              immediateFeedback={immediateFeedback}
              onSetImmediateFeedback={(boolean) => {             
                setImmediateFeedback(boolean);
                handleSaveQuizData(spacedRepetition, boolean, timeLimit, selectedTopics);
              }}
              timeLimit={timeLimit}
              onSetTimeLimit={(boolean) => {
                setTimeLimit(boolean);
                if (!isAnswerChecked) {
                  setIsTimerRunning(boolean);
                }
                handleSaveQuizData(spacedRepetition, immediateFeedback, boolean, selectedTopics);
              }}
              onResetProgress={() => resetQuizProgress()}                  
            />

            <div className="w-[2px] h-5  bg-gray-200 mx-3"/>
            
            <button className="
                flex items-center justify-center gap-2.5 
                px-3 py-[9px]  bg-blue-600 hover:bg-blue-500 
                rounded-[7px] cursor-pointer
                transition-all duration-200 active:scale-[0.97]
            ">
                <SharpLightning className="w-[18px] h-[18px] text-white" />

                <span className="text-white text-[12px]  font-medium tracking-wide">
                    Upgrade to Pro
                </span>
                
            </button> 
        </div>
      
        
        {/* 1. Progress bar (Lines) */}
        <div className="flex gap-2 mb-10">
          {questions.map((q, idx) => {
            let lineClass = "bg-neutral-200"; // Unsolved (default gray)
            
            const shouldDescrease = idx === currentQuestionIndex;
            const totalTimePerQuestion = currentQuestion?.timeInSeconds || 1;
            
            // Obliczamy procent i zabezpieczamy null przed pierwszym renderem
            const percentage = timeLeft !== null 
              ? Math.floor((timeLeft / totalTimePerQuestion) * 100) 
              : 100;

            if (idx < currentQuestionIndex) {
              // Solved
              const answer = userAnswers.find(a => a.questionId === q.id);
              lineClass = answer?.isCorrect ? "bg-green-500" : "bg-red-400";
            } else if (idx === currentQuestionIndex) {
              // Current
              lineClass = "bg-neutral-800";
            }

            return (
              <div key={q.id} className="flex-1 h-1.5 rounded-full overflow-hidden bg-neutral-100 ">
                <div 
                  style={{ width: shouldDescrease && timeLimit ? `${percentage}%` : "100%" }}
                  className={`h-full ${lineClass} transition-all duration-900`} 
                />
              </div>
            );
          })}
        </div>

        {/* 2. Header and Question Card */}
        <div className="mb-8">

          {/* <-------- Pytanie którego z rzędu ---------> */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-500 tracking-wide">
              QUESTION {currentQuestionIndex + 1} OF {questions.length}
            </span>

            {/* Radial Chart / Timer Badge */}
            {timeLeft && timeLimit && (
            <div className="flex items-center  gap-2 text-sm font-semibold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-full">
              <Clock className="w-4 h-4 text-neutral-500" />
              <span>{FormatTime(timeLeft)}</span>
            </div>            
            )}
            
          </div>        

          <h3 className="text-2xl md:text-3xl font-medium text-neutral-900 leading-tight">
            {currentQuestion.text}
          </h3>

          {currentQuestion.type === "true/false" && (
            <div className="w-full text-center pt-3 text-neutral-500">Is this statement true or false?</div>
          )}

          {currentQuestion.type === "shortAnswer" && (
            <div className="w-full text-center pt-3 text-gray-500 font-medium">
              Explain the concept in your own words.
            </div>
          )}  

        </div>

        {/* For multiple choice questions */}
        {currentQuestion.type === "multipleChoice" && (
          <div className="space-y-4 flex-1">
            {currentQuestion.options!.map((option, idx) => {
            const isSelected = selectedOption === idx;
            
            // Coloring logic after clicking "Check"
            let cardClasses = "border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer";
            let dotClasses = "border-neutral-300"; // Outer radio circle

            if (isAnswerChecked) {
              if (idx === currentQuestion.correctIndex) {
                // Always highlight correct answer in green (even if not selected)
                cardClasses = "border-green-500 bg-green-50/50";
                dotClasses = "border-green-600 bg-green-600 text-white";
              } else if (isSelected) {
                // Incorrectly selected option in red
                cardClasses = "border-red-500 bg-red-50/50";
                dotClasses = "border-red-600 bg-red-600 text-white";
              } else {
                // Rest dimmed
                cardClasses = "border-neutral-200 bg-white opacity-50 cursor-default";
              }
            } else if (isSelected) {
              // Before checking: selected option has blue/black border
              cardClasses = " border-blue-500 bg-blue-50/50 shadow-none";
              dotClasses = "border-blue-500";
            }

            return (
              <div 
                key={idx}
                onClick={() => !isAnswerChecked && setSelectedOption(idx)}
                className={`flex items-center p-[17px] border-2 rounded-xl transition-all duration-200  shadow-[1px_1px_0px_#e5e7eb] 
                    active:translate-y-[3px] active:shadow-none 
                  ${cardClasses} ${isAnswerChecked ? 'shadow-none' : 'active:scale-[0.99]'}`}
              >
                {/* Custom Radio Button */}
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mr-4 transition-colors ${dotClasses}`}>
                  {isAnswerChecked ? (
                    idx === currentQuestion.correctIndex 
                      ? <Check className="w-3 h-3 stroke-[3]" />
                      : (isSelected ? <X className="w-3 h-3 stroke-[3]" /> : null)
                  ) : (
                    isSelected && <div className="w-2.5 h-2.5  bg-blue-600 rounded-full" /> 
                  )}
                </div>
                <span className={`text-base ${isAnswerChecked && idx === currentQuestion.correctIndex ? 'text-green-900 font-medium' : (isAnswerChecked && isSelected ? 'text-red-900' : 'text-neutral-700')}`}>
                  {option}
                </span>
              </div>
            );
          })}
          </div>
        )}

            
      {currentQuestion.type === "true/false" && (

        <div className="w-full h-full flex  gap-16 items-center justify-center">

          {/* TRUE CARD */}
          <div 
            onClick={() => setTrueFalseAnswer(true)}
            className={`group flex flex-col rounded-2xl bg-white
                      hover:shadow-[6px_6px_0px_#dcfce7] hover:-translate-y-1 
                      border-2 hover:border-green-600 
                      max-w-[45%] w-[235px] h-[330px] 
                      transition-all duration-300 ease-out 
                      hover:rotate-[-2deg]  active:scale-[0.98]
                      cursor-pointer overflow-hidden 
                      ${trueFalseAnswer === true 
                        ? "border-green-600 shadow-[6px_6px_0px_#dcfce7] -translate-y-1 rotate-[-2deg]" 
                        : "border-slate-200 shadow-[4px_4px_0px_#e5e7eb] rotate-[-5deg]"}`}
          >
            <div className={`w-full h-2/5 flex items-center justify-center transition-colors border-b border-slate-100
                            ${trueFalseAnswer === true ? "bg-green-100" : "bg-green-50/70 group-hover:bg-green-100"}`}>
              <CheckCheck size={48} className={`transition-transform duration-300 group-hover:scale-110 
                                              ${trueFalseAnswer === true ? "text-green-600 scale-110" : "text-green-600"}`}/>
            </div>

            <div className="w-full h-3/5 text-3xl font-bold text-slate-800 leading-tight bg-white flex justify-center items-center">
              True
            </div>              
          </div>

          {/* FALSE CARD */}
          <div 
            onClick={() => setTrueFalseAnswer(false)}        
            className={`group flex flex-col rounded-2xl bg-white 
                      hover:shadow-[6px_6px_0px_#fecaca] hover:-translate-y-1 
                      border-2 hover:border-red-600 
                      max-w-[45%] w-[235px] h-[330px] 
                      transition-all duration-300 ease-out 
                      hover:rotate-[2deg] active:scale-[0.98]
                      cursor-pointer overflow-hidden
                      ${trueFalseAnswer === false 
                        ? "border-red-600 shadow-[6px_6px_0px_#fecaca] -translate-y-1 rotate-[2deg]" 
                        : "border-slate-200 shadow-[4px_4px_0px_#e5e7eb] rotate-[5deg]"}`}
          >
            <div className={`w-full h-2/5 flex items-center justify-center transition-colors border-b border-slate-100
                            ${trueFalseAnswer === false ? "bg-red-100" : "bg-red-50/70 group-hover:bg-red-100"}`}>
              <X size={48} className={`transition-transform duration-300 group-hover:scale-110 
                                      ${trueFalseAnswer === false ? "text-red-600 scale-110" : "text-red-500"}`}/>
            </div>

            <div className="w-full h-3/5 text-3xl font-bold text-slate-800 leading-tight bg-white flex justify-center items-center">
              False
            </div>              
          </div>        

        </div>
      )}  

      {/* Short user answer questions */}
      {currentQuestion.type === "shortAnswer" && (
        // Main centering container
        <div className="w-full flex flex-col items-center pt-12 pb-8">
          
          {/* Wrapper for label and textarea to keep common width */}
          <div className="w-full max-w-3xl flex flex-col gap-3">
            
            <label 
              htmlFor="short-answer" 
              className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1"
            >
              Your Answer
            </label>
            
            <textarea 
              id="short-answer"
              value={userAnswer ? userAnswer : ""}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your detailed explanation here..."
              className="w-full h-[220px] p-5 rounded-[12px] 
                bg-white border-2 border-slate-200 
                shadow-[4px_4px_0px_#e5e7eb] 
                text-slate-800 text-base leading-relaxed
                transition-all duration-200 ease-out 
                hover:border-slate-300 hover:bg-neutral-50 focus:bg-white
                focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 focus:translate-y-[2px] focus:shadow-[2px_2px_0px_#e5e7eb]
                placeholder:text-slate-400 resize-none
                scroll-smooth [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
            />
            
          </div>
        </div>
      )}       

      {/* 4. Explanation Card (Appears after checking) */}
    {isAnswerChecked && immediateFeedback && (
        <div className={`mt-6 p-5 rounded-xl border animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          // Color background based on AI answer correctness
          userAnswers[currentQuestionIndex]?.isCorrect 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex gap-3">
            <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              userAnswers[currentQuestionIndex]?.isCorrect ? "bg-green-200" : "bg-red-200"
            }`}>
              <BookOpen className={`w-3.5 h-3.5 ${
                userAnswers[currentQuestionIndex]?.isCorrect ? "text-green-800" : "text-red-800"
              }`} />
            </div>
            <div>
              <h4 className={`font-semibold mb-1 ${
                userAnswers[currentQuestionIndex]?.isCorrect ? "text-green-900" : "text-red-900"
              }`}>
                {userAnswers[currentQuestionIndex]?.isCorrect ? "Correct!" : "Incorrect."}
              </h4>
              
              {/* Always show base model explanation */}
              <p className="text-neutral-600 text-sm leading-relaxed border-t border-black/10 pt-2 mt-2">
                <strong className="text-neutral-800 block mb-1">
                  {"Explanation"}
                </strong>
                {currentQuestion.type === "shortAnswer" ? chatSuggestedAnswer : currentQuestion.explanation}
              </p>
            </div>
          </div>
        </div> 
      )
    }
        
      {/* Hint Card */}
      {showHint && !isAnswerChecked && (
        <div className="mt-6 p-5 rounded-xl bg-neutral-50 border border-neutral-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-3">
            <div className="mt-0.5 w-6 h-6  rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lightbulb size={16} className="text-amber-900 w-3.5 h-3.5"/>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-1">Small Hint</h4>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {currentQuestion.hint}
              </p>
            </div>
          </div>
        </div>
      )}      

      {/* 5. Bottom Navigation (Sticky for certainty) */}
      <div className="mt-5 flex items-center gap-3 justify-end">
        {!isAnswerChecked ? (
          <>
            {!showHint && (
              <button 
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 bg-neutral-100 cursor-pointer text-slate-700 rounded-lg px-8 py-3.5 font-medium transition-colors hover:bg-neutral-200"
              >
                <Lightbulb size={16} className="text-slate-700"/>
                Hint
              </button>
              )}

            <button 
              onClick={() => {
                handleCheckAnswer()
                setShowHint(false)
              }}
              disabled={!isAnswerReadyToSubmit() || isCheckingLLM}
              className="flex gap-2 items-center cursor-pointer bg-neutral-900 text-white rounded-lg px-8 py-3.5 font-medium transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingLLM && <Spinner />}
              Check Answer
            </button>          
          </>
        ) : (
          <button 
            onClick={handleNextQuestion}
            className="flex items-center gap-2 cursor-pointer bg-neutral-900 text-white rounded-lg px-8 py-3.5 font-medium transition-colors hover:bg-neutral-800 animate-in fade-in zoom-in-95 duration-200"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next question' : 'Finish quiz'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      </div>

    )
  }
}