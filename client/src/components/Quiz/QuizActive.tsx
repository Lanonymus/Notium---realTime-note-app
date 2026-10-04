import { Check, X, Clock, CheckCheck, BookOpen, Lightbulb, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { FormatTime } from './FormatTime';
import type { QuestionType, UserAnswer } from './quizTypes';

type QuizActiveProps = {
  questions: QuestionType[];
  currentQuestion: QuestionType;
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  timeLeft: number | null;
  timeLimit: boolean;
  selectedOption: number | null;
  isAnswerChecked: boolean;
  setSelectedOption: (option: number) => void;
  trueFalseAnswer: boolean | null;
  setTrueFalseAnswer: (answer: boolean) => void;
  userAnswer: string | null;
  setUserAnswer: (answer: string) => void;
  immediateFeedback: boolean;
  chatSuggestedAnswer: string | null;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
  handleCheckAnswer: () => Promise<void>;
  isAnswerReadyToSubmit: () => boolean;
  isCheckingLLM: boolean;
  handleNextQuestion: () => void;
};

export default function QuizActive({
  questions,
  currentQuestion,
  currentQuestionIndex,
  userAnswers,
  timeLeft,
  timeLimit,
  selectedOption,
  isAnswerChecked,
  setSelectedOption,
  trueFalseAnswer,
  setTrueFalseAnswer,
  userAnswer,
  setUserAnswer,
  immediateFeedback,
  chatSuggestedAnswer,
  showHint,
  setShowHint,
  handleCheckAnswer,
  isAnswerReadyToSubmit,
  isCheckingLLM,
  handleNextQuestion
}: QuizActiveProps) {
  return (
    <div className="max-w-3xl mx-auto mt-10  px-4 pb-30 h-full flex flex-col">

        
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
              className="flex gap-2 items-center cursor-pointer bg-neutral-900 text-white rounded-lg px-8 py-3.5
               font-medium transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
