import { Dispatch, SetStateAction, useId, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreChart } from '../ScoreChart';
import QuizSummaryStats from './QuizSummaryStats';
import QuizAnswerReview from './QuizAnswerReview';
import type { QuestionType, QuizState, UserAnswer } from './quizTypes';
import DoodleConfetti from '../DoodleConfetti';

type QuizFinishedProps = {
  questions: QuestionType[];
  userAnswers: UserAnswer[];
  expandedEndingId: string | null;
  setExpandedEndingId: (id: string | null) => void;
  score: number;
  startTime: string;
  finishTime: string;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  onGenerateNewQuiz: Dispatch<SetStateAction<QuizState>>;
  isAiGeneratingQuiz: boolean;
  onResetQuizProgress: () => void
};

export default function QuizFinished({
  questions, userAnswers, expandedEndingId, setExpandedEndingId, score,
  onGenerateNewQuiz, isAiGeneratingQuiz, onResetQuizProgress, startTime,
  finishTime
}: QuizFinishedProps) {

  const [tab, setTab] = useState('overview');
  const [onlyMistakes, setOnlyMistakes] = useState(false);
  const layoutId = useId();
  const reduceMotion = useReducedMotion();
  const answersById = new Map(userAnswers.map(answer => [answer.questionId, answer]));
  const correctCount = questions.filter(q => answersById.get(q.id)?.isCorrect === true).length;
  const reviewCount = questions.length - correctCount;
  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const [isAfterAnimation, setIsAfterAnimation] = useState<boolean>(false)
  
  // console.log("start: ", startTime);
  // console.log("end: ", finishTime);
  
  
  const seconds = Math.floor(
    Math.abs(new Date(finishTime).getTime() - new Date(startTime).getTime()) / 1000
  );

  // Visual preview only: this value is not awarded or persisted.
  const previewXp = correctCount * 5
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 34 };

  const openMistakes = () => {
    setOnlyMistakes(true);
    setTab('answers');
    const first = questions.find(q => answersById.get(q.id)?.isCorrect !== true);
    setExpandedEndingId(first?.id ?? null);
  };

  return (
    <section className="mx-auto  w-full max-w-[900px] px-4 pb-16 pt-10 text-gray-800 sm:px-8 sm:pt-12">



      <LayoutGroup id={layoutId}>
        <Tabs value={tab} onValueChange={setTab} className="mt-7 w-full gap-0">


          <div className="w-full flex items-center justify-between">

            <header className="text-left">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">Quiz summary</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Session complete</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">A little reflection makes your next session count.</p>
            </header>

            <div className="flex justify-center">
              <TabsList aria-label="Quiz results" className="!h-10 rounded-lg bg-neutral-100 p-1">
                {[
                  { value: 'overview', label: 'Overview' },
                  { value: 'answers', label: 'Answers' },
                ].map(item => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="relative isolate h-full gap-2 rounded-md border-0 px-4 text-xs font-medium
                     !bg-transparent !shadow-none after:!hidden data-[state=active]:text-gray-900
                      data-[state=inactive]:text-gray-500 "
                    onClick={() => {
                      console.log("test");
                      setIsAfterAnimation(true)
                          
                    }}                      
                  >
                    {tab === item.value && (
                      <motion.span
                        aria-hidden="true"
                        layoutId="quiz-summary-tab"
                        className="absolute inset-0 rounded-md bg-white"
                        transition={transition}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                    {item.value === 'answers' && <span className="relative mt-[2px] z-10 text-[11px] tabular-nums text-gray-400">{questions.length}</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

          </div>


          <TabsContent value="overview" className="mt-0 outline-none">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
              <div className="flex flex-col items-center py-7 text-center">


                <div
                  className="relative my-4 h-[210px] w-[210px] overflow-visible"
                  aria-label={`Quiz score: ${safeScore}%`}
                >
                  <ScoreChart 
                    score={safeScore}
                    title={"score"}
                  />
                  <DoodleConfetti />
                </div>


                <p className="mt-1 text-sm font-medium text-gray-700">{correctCount} of {questions.length} questions answered correctly</p>
                <p className="mt-1.5 max-w-md text-sm leading-6 text-gray-400">
                  {questions.length === 0 ? 'No questions in this session.' : reviewCount === 0
                    ? 'Every answer correct. Keep building on what you know.'
                    : `Review the explanations before your next quiz.`}
                </p>
              </div>

              <QuizSummaryStats 
                reviewCount={reviewCount} 
                experience={previewXp} 
                timeInSeconds={seconds} 
                isAfterAnimation={isAfterAnimation}
              />

              {reviewCount > 0 && (
                <button type="button" onClick={openMistakes} className="mt-4 flex w-full items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3.5 text-left transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600">
                  <span className="text-sm text-gray-600">Revisit the questions you missed.</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="answers" className="mt-7 outline-none">
            <motion.div 
              initial={reduceMotion ? false : { opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: reduceMotion ? 0 : 0.22 }}              
              >
              <QuizAnswerReview
                questions={questions}
                userAnswers={userAnswers}
                expandedEndingId={expandedEndingId}
                setExpandedEndingId={setExpandedEndingId}
                onlyMistakes={onlyMistakes}
                setOnlyMistakes={setOnlyMistakes}
              />
            </motion.div>
          </TabsContent>

          <footer className="mt-8 border-t border-gray-100 pt-4">

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button 
                onClick={onResetQuizProgress}
                type="button" 
                disabled={isAiGeneratingQuiz || questions.length === 0}
                className="h-[46px] gap-2 rounded-lg bg-blue-600 px-5 text-white 
                 hover:bg-blue-700 cursor-pointer"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {'Study again'}
              </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onGenerateNewQuiz("createMode")} 
                  className="h-11 gap-2 rounded-lg border-gray-200 px-5 text-gray-700
                   shadow-[1px_1px_0px_#e5e7eb] active:shadow-none active:translate-y-[3px] cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate new quiz
                    {/* <span className="text-xs text-gray-400"></span> */}
                </Button>                
            </div>
          </footer>    

        </Tabs>

      </LayoutGroup>

      

    </section>
  );
}
