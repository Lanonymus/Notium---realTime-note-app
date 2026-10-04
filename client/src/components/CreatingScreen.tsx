import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock3, Info, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";


// "none" | "extractedNotes" | "createdScenario" | "createdAudio"

type Lengths = "Short" | "Long"
type kind = "Quiz" | "Podcast" | "Flashcards"

type customObjectStage = {
    label: string,
    description: string 
} 

type CreatingPodcastScreenProps = {
    /** Pass up to 30 bird illustrations. The same image can be repeated for the visual mockup. */
    doodleImages?: string[];
    generationState: string,
    customDictStages: Record<string, number>,
    customTips?: string[],
    customObjectStages?: customObjectStage[],
    estimatedWaitTime: number,
    kind: string    

};


const doodleImagesList = [
    "/doodles/doodle_1.png",
    "/doodles/doodle_2.png",   
    "/doodles/doodle_3.png",   
    "/doodles/doodle_4.png",   
    "/doodles/doodle_5.png",   
    "/doodles/doodle_6.png",   
    "/doodles/doodle_7.png",   
    "/doodles/doodle_8.png",   
    "/doodles/doodle_9.png",   
    "/doodles/doodle_10.png",   
    "/doodles/doodle_11.png",   
    "/doodles/doodle_12.png",   
    "/doodles/doodle_13.png",   
    "/doodles/doodle_14.png",   
    "/doodles/doodle_15.png",                                                        
]

const DEFAULT_BIRD_IMAGES = Array.from({ length: 30 }, () => "/bird.png");

type CardLayout = {
    x: number;
    y: number;
    rotate: number;
    scale: number;
    opacity: number;
    zIndex: number;
};

const ARC_VISIBLE_OFFSET = 15;
const ARC_CENTER_Y = 550;
const ARC_RADIUS_Y = 450;

const getArcLayout = (offset: number, radiusX: number): CardLayout => {
    const direction = offset < 0 ? -1 : 1;

    if (Math.abs(offset) > ARC_VISIBLE_OFFSET) {
        return {
            x: direction * (radiusX + 190),
            y: ARC_CENTER_Y + 50,
            rotate: direction * 28,
            scale: 0.45,
            opacity: 0,
            zIndex: 0,
        };
    }

    // The cards sit on the upper half of a deliberately oversized ellipse.
    // Its lower half continues below the fixed carousel viewport and is clipped.
    const angle = Math.PI / 2 - (offset / ARC_VISIBLE_OFFSET) * (Math.PI / 2);
    const distanceFromCenter = Math.abs(offset) / ARC_VISIBLE_OFFSET;

    return {
        x: Math.cos(angle) * radiusX,
        y: ARC_CENTER_Y - Math.sin(angle) * ARC_RADIUS_Y,
        rotate: offset * 6,
        scale: 1 - distanceFromCenter * 0.38,
        opacity: 1 - distanceFromCenter * 0.76,
        zIndex: 100 - Math.abs(offset),
    };
};

const getCircularOffset = (index: number, activeIndex: number, length: number) => {
    let offset = index - activeIndex;
    const half = Math.floor(length / 2);

    if (offset > half) offset -= length;
    if (offset < -half) offset += length;

    return offset;
};




function ImagesCarousel({ images, reduceMotion }: { images: string[]; reduceMotion: boolean }) {
    const imageList = useMemo(() => {
        const validImages = images.filter(Boolean).slice(0, 30);
        return validImages.length > 0 ? validImages : DEFAULT_BIRD_IMAGES;
    }, [images]);

    const imageCount = imageList.length;
    const [activeIndex, setActiveIndex] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(1280);


    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        setActiveIndex((current) => current % imageCount);
    }, [imageCount]);

    useEffect(() => {
        if (reduceMotion || imageCount < 2) return;

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % imageCount);
        }, 1800);

        return () => window.clearInterval(timer);
    }, [imageCount, reduceMotion]);


    const radiusX = viewportWidth / 2 + 150;

    return (
        <div className="relative h-[218px] w-full">
            <div
                // style={{ }} 
                className="absolute left-1/2 top-0 h-[618px] w-screen translate-x-[calc(-50%_-_40px)] overflow-hidden">
                <AnimatePresence initial={false}>
                    {imageList.map((image, index) => {
                        const offset = getCircularOffset(index, activeIndex, imageCount);
                        if (Math.abs(offset) > ARC_VISIBLE_OFFSET) return null;

                        const layout = getArcLayout(offset*3, radiusX*0.6);
                        const enterLayout = getArcLayout(offset + 1, radiusX);

                        const [rotation, setRotation] = useState(0);
                        const ROTATION_DURATION_MS = 800;                            

                        return (
                            <motion.div
                                key={`bird-card-${index}`}
                                className={`absolute left-1/2 top-0 -ml-[47px] -mt-[68px] w-[175px] h-auto
                                    p-2 ${
                                    offset === 0 ? "border-[#cdddfc]" : "border-[#e5e7eb]"
                                }`}
                                initial={reduceMotion ? layout : enterLayout}
                                animate={layout}
                                exit={{
                                    x: offset < 0 ? -radiusX - 190 : radiusX + 190,
                                    y: ARC_CENTER_Y + 50,
                                    rotate: offset < 0 ? -28 : 28,
                                    scale: 0.45,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: reduceMotion ? 0 : 1.8,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{ zIndex: layout.zIndex }}
                            >
                                <motion.img
                                    src={image}
                                    alt=""
                                    draggable={false}
                                    className="h-full w-full cursor-pointer object-contain"
                                    animate={{ rotate: rotation }}
                                    whileHover={{ y: -25 }}
                                    onClick={() => setRotation((current) => current + 360)}
                                    transition={{
                                        rotate: {
                                            duration: ROTATION_DURATION_MS / 1000,
                                            ease: [0.22, 1, 0.36, 1],
                                        },
                                        y: {
                                            duration: 0.3,
                                            ease: "easeOut",
                                        },
                                    }}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}


type GenerationStepperProps = {
    customObjectStages: customObjectStage[],   
    CURRENT_STAGE: number,
    reduceMotion: boolean 
}


function GenerationStepper({ 
    customObjectStages,
    CURRENT_STAGE,
    reduceMotion,

}: GenerationStepperProps) {
    return (
        <div className="mx-auto grid w-full grid-cols-2 justify-center gap-x-5 gap-y-6 sm:flex sm:items-start sm:justify-center sm:gap-0">
            {customObjectStages.map((stage, index) => {
                const isCompleted = index < CURRENT_STAGE;
                const isCurrent = index === CURRENT_STAGE;

                return (
                    <div key={stage.label} className="relative min-w-0 flex-1">
                        <div className="relative z-10 flex min-w-0 flex-col items-center text-center">
                            <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[50%]
                                     ring-15 ring-white border text-sm font-medium ${
                                    isCompleted
                                        ? "border-[#155dfc] bg-[#155dfc] text-white"
                                        : isCurrent
                                          ? "border-[#155dfc] bg-blue-50 text-[#155dfc]"
                                          : "border-[#dfe3e8] bg-white text-[#8a929d]"
                                }`}
                                aria-label={`${stage.label}: ${isCompleted ? "completed" : isCurrent ? "in progress" : "upcoming"}`}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                ) : isCurrent ? (
                                    <motion.span
                                        className="h-4 w-4 rounded-[50%] border-2 border-[#bfd4fb] border-t-[#155dfc]"
                                        animate={reduceMotion ? undefined : { rotate: 360 }}
                                        transition={
                                            reduceMotion
                                                ? undefined
                                                : { duration: 0.9, repeat: Infinity, ease: "linear" }
                                        }
                                    />
                                ) : (
                                    index + 1
                                )}
                            </span>

                            <p
                                className={`mt-2 text-sm font-medium ${
                                    isCurrent ? "text-[#1f2937]" : isCompleted ? "text-[#6b7280]" : "text-[#9aa1aa]"
                                }`}
                            >
                                {stage.label}
                            </p>
                            <p className="mt-1 max-w-[130px] text-xs leading-5 text-[#8a929d]">{stage.description}</p>
                        </div>

                        {index < customObjectStages.length - 1 && (
                            <div
                                className={`pointer-events-none absolute left-1/2 top-5 hidden h-[2px] w-full sm:block ${
                                    index < CURRENT_STAGE ? "bg-[#155dfc]" : "bg-[#e8ebef]"
                                }`}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}


const stages = {
    "none": 0,
    "extractedNotes": 1,
    "createdScenario": 2,
    "createdAudio" : 3
}

const TIPS = [
    "You can turn the finished transcript into flashcards in one click.",
    "Try 1.25× playback speed when reviewing familiar material.",
    "Shorter episodes are easier to revisit during a busy study session.",
    "Your source notes remain connected to the generated episode.",
];

const STAGES = [
    { label: "Notes", description: "Organizing notes" },
    { label: "Script", description: "Writing Scenario" },
    { label: "Audio", description: "Producing Audio" },
];



export default function CreatingScreen({
    doodleImages = doodleImagesList,
    generationState,
    estimatedWaitTime,
    customDictStages = stages,
    customTips = TIPS,
    customObjectStages = STAGES,
    kind


}: CreatingPodcastScreenProps) {

    const [tipIndex, setTipIndex] = useState(0);
    const shouldReduceMotion = useReducedMotion();
    const reduceMotion = shouldReduceMotion ?? false;

    const CURRENT_STAGE = customDictStages[generationState]
    const estimatedSeconds = estimatedWaitTime

    const [remainingSeconds, setRemainingSeconds] = useState(estimatedSeconds)

    useEffect(() => {
        setRemainingSeconds(estimatedSeconds)
    }, [estimatedSeconds])

    useEffect(() => {

        const timer = window.setInterval(() => {
            setRemainingSeconds((prev) => Math.max(prev - 1, 0))
        }, 1000)

        return () => window.clearInterval(timer)
    },[])

    const formatTimeLeft = (seconds: number) => {
        if (seconds <= 0) return "Finishing up…";

        if (seconds < 60) {
            return `About ${seconds} seconds left`;
        }

        const minutes = Math.ceil(seconds / 60);

        return `About ${minutes} ${minutes === 1 ? "minute" : "minutes"} left`;
    };

    useEffect(() => {
        if (shouldReduceMotion) return;

        const tipTimer = window.setInterval(() => {
            setTipIndex((current) => (current + 1) % customTips.length);
        }, 5200);

        return () => {
            window.clearInterval(tipTimer);
        };
    }, [shouldReduceMotion]);

    return (
        <main className="h-full max-h-[92vh] w-full overflow-x-clip bg-white px-4 pt-6 text-[#1f2937] sm:px-8">
            
            <div className="mx-auto h-full  flex w-full max-w-[1120px] justify-center">

                <section
                    className="w-full h-full max-w-[920px] overflow-visible bg-white flex flex-col justify-between"
                    aria-label="Podcast generation progress"
                >

                    <div className="flex flex-col gap-20">
                        <header className="px-6 py-5 sm:px-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a929d]">
                                            {kind === "Podcast" && `Podcast generation`}
                                            {kind === "Quiz" && `Quiz generation`}
                                            {kind === "Flashcards" && `Flashcards generation`}                                            
                                        </p>
                                        <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#1f2937] sm:text-2xl">
                                            {kind === "Podcast" && `Creating your podcast`}
                                            {kind === "Quiz" && `Creating your quiz`}     
                                            {kind === "Flashcards" && `Creating your flashcards`}                                                                                   
                                        </h1>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-[#6b7280] sm:pt-2">
                                    <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                                    <span aria-live="polite">
                                        {formatTimeLeft(remainingSeconds)}
                                    </span>
                                </div>
                            </div>
                        </header>

                        <div className="flex flex-col gap-8 p-6 sm:p-8  lg:gap-10">
                            {/* Spokojna ilustracja przerwy */}
                            <div className="flex flex-col items-center justify-center text-center">
                                <ImagesCarousel images={doodleImages} reduceMotion={reduceMotion} />

                                <div className="mt-4 max-w-[210px]">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa1aa]">
                                        Quick pause
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                                        Taking a quick breather while we work
                                    </p>
                                </div>
                            </div>

                            {/* Główna informacja o postępie */}
                            <div className="min-w-0 w-full px-25">
                                <div className="mt-7 w-full">
                                    <GenerationStepper 
                                        customObjectStages={customObjectStages}
                                        CURRENT_STAGE={CURRENT_STAGE} 
                                        reduceMotion={reduceMotion} 
                                    />
                                </div>
                            </div>

                        </div>

                    </div>


                    {/* Rotujący tip */}
                    <footer className="bg-[#fbfbfc] px-6 rounded-[9px] py-6 ">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border
                             border-[#e5e7eb] bg-white text-gray-800">
                                <Info className="h-4 w-4" strokeWidth={1.8} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a929d]">
                                        Quick tip
                                    </p>

                                    <div className="flex items-center gap-1.5" aria-label={`Tip ${tipIndex + 1} of ${customTips.length}`}>
                                        {customTips.map((tip, index) => (
                                            <span
                                                key={tip}
                                                className={`h-1 w-4 rounded-[2px] ${index === tipIndex ? "bg-gray-500" : "bg-[#dfe3e8]"}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="h-fit" aria-live="polite">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.p
                                            key={tipIndex}
                                            className="max-w-[720px] text-sm leading-6 text-[#6b7280]"
                                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -5 }}
                                            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                                        >
                                            {customTips[tipIndex]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </footer>
                </section>
            </div>
            
        </main>
    );
}
