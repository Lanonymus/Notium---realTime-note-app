import { Skeleton } from '../ui/skeleton';

export default function QuizSkeleton() {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 pt-8 bg-white rounded-xl">
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
