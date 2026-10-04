import { useId } from "react";
import { Check, X, ChevronDown, BookOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { QuestionType, UserAnswer } from "./quizTypes";

type QuizAnswerReviewProps = {
  questions: QuestionType[];
  userAnswers: UserAnswer[];
  expandedEndingId: string | null;
  setExpandedEndingId: (id: string | null) => void;
  onlyMistakes: boolean;
  setOnlyMistakes: (value: boolean) => void;
};

function correctAnswerText(question: QuestionType): string {
  if (
    question.type === "multipleChoice" &&
    question.correctIndex !== undefined
  ) {
    return question.options?.[question.correctIndex] ?? question.explanation;
  }
  if (
    question.type === "true/false" &&
    typeof question.correctAnswer === "boolean"
  ) {
    return question.correctAnswer ? "True" : "False";
  }
  return question.explanation || "No reference answer available.";
}

export default function QuizAnswerReview({
  questions,
  userAnswers,
  expandedEndingId,
  setExpandedEndingId,
  onlyMistakes,
  setOnlyMistakes,
}: QuizAnswerReviewProps) {
  
  const id = useId();
  const answersById = new Map(
    userAnswers.map((answer) => [answer.questionId, answer]),
  );
  const visibleQuestions = onlyMistakes
    ? questions.filter((q) => answersById.get(q.id)?.isCorrect !== true)
    : questions;

  return (
    <section aria-label="Review your answers">

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-gray-800">
            {onlyMistakes ? "Questions to revisit" : "Your answers"}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Open a question to see the answer and explanation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-filter`}
            checked={onlyMistakes}
            onCheckedChange={setOnlyMistakes}
          />
          <label
            htmlFor={`${id}-filter`}
            className="cursor-pointer text-xs text-gray-500"
          >
            Only mistakes
          </label>
        </div>
      </div>


      {/* Quiz answers */}
      <div className="space-y-3 overflow-y-auto max-h-[500px] modernScrollbar">
        {visibleQuestions.map((question) => {
          const answer = answersById.get(question.id);
          const isCorrect = answer?.isCorrect === true;
          const isExpanded = expandedEndingId === question.id;
          const panelId = `${id}-${question.id}-panel`;
          const triggerId = `${id}-${question.id}-trigger`;
          return (
            <div
              key={question.id}
              className=" rounded-xl border overflow-hidden border-neutral-200 bg-white transition-colors"
            >
              <button
                type="button"
                id={triggerId}
                aria-expanded={isExpanded}
                aria-controls={isExpanded ? panelId : undefined}
                onClick={() =>
                  setExpandedEndingId(isExpanded ? null : question.id)
                }
                className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[50%] ${isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                  >
                    {isCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </span>
                  <span className="sr-only">
                    {isCorrect
                      ? "Correct: "
                      : answer
                        ? "Incorrect: "
                        : "Unanswered: "}
                  </span>
                  <span className="text-sm font-medium leading-6 text-neutral-800">
                    {question.text}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
              {isExpanded && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="space-y-4 border-t border-neutral-100 bg-neutral-50 p-4 sm:px-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="text-sm">
                      <p className="mb-1 text-xs text-neutral-500">
                        Your answer
                      </p>
                      <p
                        className={`break-words font-medium ${isCorrect ? "text-green-700" : "text-red-600"}`}
                      >
                        {answer?.userAnswer?.trim() || "No answer recorded."}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="mb-1 text-xs text-neutral-500">
                        {question.type === "shortAnswer"
                          ? "Reference answer"
                          : "Correct answer"}
                      </p>
                      <p className="break-words font-medium text-green-700">
                        {correctAnswerText(question)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm leading-6 text-neutral-600">
                    <p className="mb-1 font-medium text-neutral-900">
                      Explanation
                    </p>
                    <p className="break-words">
                      {question.explanation || "No explanation available."}
                    </p>
                  </div>
                  {question.type === "shortAnswer" &&
                    answer?.suggestedAnswer && (
                      <div className="text-sm leading-6 text-gray-600">
                        <p className="mb-1 font-medium text-gray-800">
                          Feedback on your answer
                        </p>
                        <p className="break-words">{answer.suggestedAnswer}</p>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
        {visibleQuestions.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center">
            <BookOpen
              aria-hidden="true"
              className="mx-auto mb-3 h-5 w-5 text-gray-400"
            />
            <p className="text-sm font-medium text-gray-700">
              {questions.length
                ? "Nothing to revisit this time"
                : "No answers to review yet"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {questions.length
                ? "All questions were answered correctly."
                : "Your answers will appear after completing a quiz."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
