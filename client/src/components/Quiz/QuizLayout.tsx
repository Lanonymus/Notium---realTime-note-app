import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { MousePointerClick, SquareCheckBig, SquarePen } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { extractNotes } from './HelperFunctions';
import CreatingScreen from '../CreatingScreen';
import QuizHeader from './QuizHeader';
import QuizCreateMode from './QuizCreateMode';
import QuizActive from './QuizActive';
import QuizFinished from './QuizFinished';
import QuizSkeleton from './QuizSkeleton';
import type { QuestionType, UserAnswer, WrongAnswer, TopicType, QuizInstance, QuizGenerationResponse, QuizState, GenerationState } from './quizTypes';

// Preserve existing type imports from this module.
export type { QuestionTypeEnum, GeneratedQuestion, GeneratedTopic, QuizGenerationResponse, TopicType, QuizSettings, QuizInstance } from './quizTypes';

import { QuizSettingsDialog } from './QuizSettingsDialog';
import { useLearningActivity } from '@/hooks/useLearningActivity';


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

export default function QuizLayout() {
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
    const startTime = useRef<string>("")
    const finishTime = useRef<string>("")

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

    const editorTitleRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [titleError, setTitleError] = useState(""); 

    useLearningActivity({
      enabled: isDataLoaded && quizState === "active" && Boolean(quizId),
      activityType: "quiz",
      projectId,
      resourceId: quizId,
      disabledReason: quizState === "finished" ? "completed" : "route_changed",
    });
  






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

        if(data.title) setTitle(data.title)

        if (Array.isArray(data.quizez) && data.quizez.length > 0) {
          const lastQuiz = data.quizez[data.quizez.length - 1];

          startTime.current = lastQuiz.createdAt ?? "";
          finishTime.current = lastQuiz.finishTime ?? "";

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


    const updateTitle = async (newTitle: string) => {
        try {
            const response = await fetch("http://localhost:8000/api/updateTitle", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                projectId, 
                newTitle 
                }),
            });
            if (!response.ok) throw new Error("Title update failed");
            setTitleError("");
        } catch {
        setTitleError("Your project title could not be saved. Please try again.");
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
      startTime.current = new Date().toISOString();
      finishTime.current = "";
      
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

      startTime.current = "";
      finishTime.current = "";

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
            console.log("czas początkowy z generacji wczytany: ", data.quizStartTime);
            
            startTime.current = data.quizStartTime

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
      topics: newTopicsProps,
      finishTime: finishTime.current.trim() ? finishTime.current : ""
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

 
  const completeQuiz = async () => {
    const attemptIdRef = crypto.randomUUID();

    const correctAnswers = userAnswers.filter(
      (answer) => answer.isCorrect,
    ).length;

    await addCompletedActivity({
      attemptId: attemptIdRef,
      activityType: "quiz",
      projectId,
      resourceId: quizId ?? undefined,
      correctAnswers,
      totalQuestions: questions.length,
    });
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
      finishTime.current = new Date().toISOString()    
      completeQuiz() 
      extendStreak()
      setQuizState('finished');

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


  

  const settingsProps: ComponentProps<typeof QuizSettingsDialog> = {
            selectedTopics,
            onSetSelectedTopics: (newTopics) => {
              setSelectedTopics(newTopics);
              handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, newTopics);
            },
            selectedTypes,
            onSetSelectedTypes: (newTypes) => {
              setSelectedTypes(newTypes)
              handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, newTypes);                    
            },
            topics,
            onSetTopics: (newTopics) => {
              setTopics(newTopics);
              if(newTopics) {
                handleSaveQuizData(spacedRepetition, immediateFeedback, timeLimit, selectedTopics, selectedTypes, newTopics);
              }             
            },
            spacedRepetition,
            onSetSpacedRepetition: (boolean) => {
              setSpacedRepetition(boolean);
              handleSaveQuizData(boolean, immediateFeedback, timeLimit, selectedTopics);
            },
            immediateFeedback,
            onSetImmediateFeedback: (boolean) => {             
              setImmediateFeedback(boolean);
              handleSaveQuizData(spacedRepetition, boolean, timeLimit, selectedTopics);
            },
            timeLimit,
            onSetTimeLimit: (boolean) => {
              setTimeLimit(boolean);
              if (!isAnswerChecked) {
                setIsTimerRunning(boolean);
              }
              handleSaveQuizData(spacedRepetition, immediateFeedback, boolean, selectedTopics);
            },
            onResetProgress: () => resetQuizProgress(),
  };

  return (
    <div className="relative h-full w-full bg-white rounded-xl">
      <QuizHeader 
        settingsProps={settingsProps}
        editorTitleRef={editorTitleRef}
        title={title}
        onSetTitle={setTitle}
        onUpdateTitle={updateTitle}
        isDataLoading={!isDataLoaded}
      />

      {quizState === "generating" ? (
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
      ) : !isDataLoaded ? (
        <QuizSkeleton />
      ) : quizState === "createMode" ? (
        <QuizCreateMode
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          handleStartQuiz={handleStartQuiz}
          isAiGeneratingQuiz={isAiGeneratingQuiz}
        />
      ) : quizState === "finished" ? (
        <QuizFinished
          questions={questions}
          userAnswers={userAnswers}
          expandedEndingId={expandedEndingId}
          setExpandedEndingId={setExpandedEndingId}
          score={calculateScore()}
          startTime={startTime.current}
          finishTime={finishTime.current}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          isAiGeneratingQuiz={isAiGeneratingQuiz}
          onResetQuizProgress={() => resetQuizProgress()}
          onGenerateNewQuiz={setQuizState}
        />
      ) : quizState === "active" ? (
        <QuizActive
          questions={questions}
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          timeLeft={timeLeft}
          timeLimit={timeLimit}
          selectedOption={selectedOption}
          isAnswerChecked={isAnswerChecked}
          setSelectedOption={setSelectedOption}
          trueFalseAnswer={trueFalseAnswer}
          setTrueFalseAnswer={setTrueFalseAnswer}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          immediateFeedback={immediateFeedback}
          chatSuggestedAnswer={chatSuggestedAnswer}
          showHint={showHint}
          setShowHint={setShowHint}
          handleCheckAnswer={handleCheckAnswer}
          isAnswerReadyToSubmit={isAnswerReadyToSubmit}
          isCheckingLLM={isCheckingLLM}
          handleNextQuestion={handleNextQuestion}
        />
      ) : null}
    </div>
  );
}
