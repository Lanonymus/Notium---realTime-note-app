import { useEffect, useRef, useState } from "react";
import { Podcast } from "./podcastTypes";
import { EXAMPLE_LANGUAGES } from "./podcastLanguages";
import { EXAMPLE_VOICES } from "./podcastVoices";
import FlashcardsNavbar from "../Flashcards/FlashcardsNavbar";
import { useParams } from "react-router-dom";
import PodcastWorkspace from "./PodcastWorkspace";
import PodcastGenerateScreen from "./PodcastGenerateScreen";
import PodcastNavbar from "./PodcastNavbar";
import PodcastGenerateSkeleton from "./PodcastGenerateSkeleton";
import { useLearningActivity } from "@/hooks/useLearningActivity";





type PodcastState = "generateMode" | "creatingPodcast" | "activeMode"
type GenerationState = "none" | "extractedNotes" | "createdScenario" | "createdAudio"


export default function PodcastLayout() {

    const params = useParams()
    const projectId: string = params.projectID!
    const editorTitleRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [titleError, setTitleError] = useState("");
    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [podcastState, setPodcastState] = useState<PodcastState>("generateMode"); //generateMode // finished
    const [generationState, setGenerationState] = useState<GenerationState>("none")
    const [isDataLoading, setIsDataLoading] = useState<boolean>(true)    

    useLearningActivity({
        enabled: podcastState === "activeMode" && Boolean(podcast),
        activityType: "podcast",
        projectId,
        resourceId: podcast?.id,
        mode: "media",
    });

    useEffect(() => {
        const url = podcast?.audioUrl;
        return () => { if (url?.startsWith("blob:")) URL.revokeObjectURL(url); };
    }, [podcast?.audioUrl]);



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

    const loadData = async () => {

        try {
            const response = await fetch("http://localhost:8000/api/getPodcasts", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    projectId 
                }),
            });

            if (!response.ok) throw new Error("Podcast data coulnd't be loaded");

            const result = await response.json()

            if(result.title) setTitle(result.title)
            
            
            if(Array.isArray(result.podcastsWithAudio) && result.podcastsWithAudio.length > 0) {

                const latestPodcast = result.podcastsWithAudio[result.podcastsWithAudio.length - 1]

                setPodcast(latestPodcast)
                setPodcastState("activeMode");
                console.log("podkast: ", latestPodcast);                
            }

            setIsDataLoading(false)
            


        } catch {
            console.error("Your project title could not be saved. Please try again.");
        }   

    }

    useEffect(() => {
        if(!isDataLoading) return     

        loadData()
    }, [isDataLoading])

    


  
    return (
        <div className="relative h-full w-full rounded-xl bg-white text-[#282e3e]">
            <PodcastNavbar
                editorTitleRef={editorTitleRef}
                title={title}
                onSetTitle={setTitle}
                onUpdateTitle={updateTitle}
                isDataLoading={isDataLoading}
            />

            {titleError && (
                <p role="alert" className="px-8 text-sm text-red-700">
                {titleError}
                </p>
            )}

            {isDataLoading ? (
                <PodcastGenerateSkeleton/>

            ) : podcast ? (
                <PodcastWorkspace
                    key={`${projectId}:${podcast?.id}:${podcast?.audioUrl}`}
                    podcast={podcast}
                    podcastState={podcastState}
                    projectId={projectId}
                />
            ) : (
                <PodcastGenerateScreen
                    onPodcastReady={(result ) => { // audioBlob
                        setPodcastState("activeMode");
                        setPodcast(result);
                    // audioBlob to gotowy WAV, np. do późniejszego uploadu.
                    }}
                    generationState={generationState}
                    onSetGenerationState={setGenerationState}
                    podcastState={podcastState} 
                    onSetPodcastState={setPodcastState}                   
                />
            )}
            
        </div>
    );
}
