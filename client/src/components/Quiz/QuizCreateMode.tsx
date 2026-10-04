import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

type QuizCreateModeProps = {
  questionCount: number;
  setQuestionCount: (count: number) => void;
  handleStartQuiz: () => Promise<void>;
  isAiGeneratingQuiz: boolean;
};

export default function QuizCreateMode({
  questionCount,
  setQuestionCount,
  handleStartQuiz,
  isAiGeneratingQuiz
}: QuizCreateModeProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center -translate-y-[50px] bg-white rounded-xl">

              
        
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
