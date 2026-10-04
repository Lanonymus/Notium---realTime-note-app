

export const getFormattedTime = (start: number, finish: number) => {
    // 1. Obliczamy całkowitą liczbę sekund
    const totalSeconds = Math.floor((finish - start) / 1000);
    
    // 2. Wyciągamy minuty i resztę sekund
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // WARIANT A: Tekstowy (np. "5 min 30 s")
    //   return `${minutes} min ${seconds} s`;

  // WARIANT B: Cyfrowy z zerami na początku (np. "05:30")
  const padMin = String(minutes).padStart(2, '0');
  const padSec = String(seconds).padStart(2, '0');
  return `${padMin}:${padSec} min`;
};