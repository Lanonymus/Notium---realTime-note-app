// Możesz dodać ten typ wyżej w pliku jeśli TypeScript będzie narzekał
// import { PanelImperativeHandle } from "react-resizable-panels";
const animatePanelSize = (
    panelRef: any,
    startSize: number,        // Teraz przekazujemy wartość z naszego Refa
    targetSizePercentage: number,
    durationMs: number = 800
) => {
    if (!panelRef.current) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4); 

    // Używamy startSize przekazanego w argumentach
    const nextSize = startSize + (targetSizePercentage - startSize) * easeProgress;
    
    panelRef.current?.resize(nextSize);

    if (progress < 1) {
        requestAnimationFrame(animate);
    }
    };

    requestAnimationFrame(animate);
};

export default animatePanelSize