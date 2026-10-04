import { Skeleton } from "@/components/ui/skeleton";

export default function PodcastGenerateSkeleton() {
  return (
    <div className="w-full bg-white text-gray-800">
      <main className="mx-auto max-w-[980px] px-5 py-8 sm:px-10 sm:py-10">
        {/* Nagłówek */}
        <header className="mb-7 flex min-h-[112px] items-center justify-between gap-5 sm:mb-8">
          <div className="max-w-[540px] space-y-2.5">
            <Skeleton className="h-3.5 w-36 bg-gray-200" />
            <Skeleton className="h-8 w-48 bg-gray-200" />
            <Skeleton className="h-4 w-80 bg-gray-200" />
          </div>
          <Skeleton className="h-20 w-20 shrink-0 rounded-full bg-gray-200 sm:h-32 sm:w-32" />
        </header>

        {/* Sekcja materiałów / PodcastMaterials */}
        <div className="mb-8 flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-gray-200 shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44 bg-gray-200" />
              <Skeleton className="h-3 w-72 bg-gray-200" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-lg bg-gray-200" />
        </div>

        <div className="space-y-7">
          {/* Wybór języka */}
          <div>
            <Skeleton className="h-4 w-20 mb-3 bg-gray-200" />
            <Skeleton className="h-10 w-36 rounded-[10px] bg-gray-200" />
          </div>

          {/* Wybór prelegentów / Speakers */}
          <div>
            <Skeleton className="h-4 w-20 mb-1.5 bg-gray-200" />
            <Skeleton className="h-3.5 w-72 mb-4 bg-gray-200" />
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Karta Speaker 1 */}
              <div className="flex min-h-[94px] w-full items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
                <Skeleton className="h-11 w-11 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16 bg-gray-200" />
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-3 w-36 bg-gray-200" />
                </div>
                <Skeleton className="h-4 w-4 rounded-full bg-gray-200" />
              </div>

              {/* Karta Speaker 2 (Dodaj drugiego głośnika) */}
              <div className="flex min-h-[94px] w-full items-center gap-3 rounded-xl border-2 border-gray-200 p-4">
                <Skeleton className="h-11 w-11 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 bg-gray-200" />
                  <Skeleton className="h-3 w-28 bg-gray-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Długość oraz Poziom (Topic Familiarity) */}
          <div className="w-[65%] grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-9 max-[480px]:w-full max-[480px]:grid-cols-1 max-[480px]:gap-4">
            {/* Length */}
            <div>
              <Skeleton className="h-4 w-16 mb-3 bg-gray-200" />
              <Skeleton className="h-11 w-full rounded-[10px] bg-gray-200" />
            </div>

            {/* Topic familiarity */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-4 w-28 bg-gray-200" />
                <Skeleton className="h-3 w-20 bg-gray-200" />
              </div>
              <Skeleton className="h-11 w-full rounded-[10px] bg-gray-200" />
            </div>
          </div>

          {/* Additional instructions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-36 bg-gray-200" />
              <Skeleton className="h-3 w-12 bg-gray-200" />
            </div>
            <Skeleton className="h-[104px] w-full rounded-[10px] bg-gray-200" />
          </div>

          {/* Stopka i przycisk generowania */}
          <div className="border-t border-gray-200 pt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-32 bg-gray-200" />
              <Skeleton className="h-3 w-64 bg-gray-200" />
            </div>
            <Skeleton className="h-11 w-36 rounded-[12px] bg-gray-200" />
          </div>
        </div>
      </main>
    </div>
  );
}