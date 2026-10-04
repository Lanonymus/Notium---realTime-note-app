import type { PodcastData, PodcastScenario } from "./podcastTypes";
import { requestPodcastAudio } from "./requestPodcastAudio";
export type { PodcastData, PodcastScenario, Podcast } from "./podcastTypes";

// URL pozostaje dostępny do ponownego odtworzenia. dispose() wywołaj przy zmianie
// nagrania lub odmontowaniu komponentu, nie natychmiast po audio.play().
export function createAudioPlayback(blob: Blob) {

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  let disposed = false;
  return {
    audio,
    url,
    dispose() {
      if (disposed) return;
      disposed = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    },
  };

}


export async function extractFiles(
  projectId: string, 
  signal?: AbortSignal): Promise<string> 
{
    const response = await fetch("http://localhost:8000/api/extractFiles", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        projectId,
      }),
      signal,
    });

    const result = await response.json()

    if (!response.ok || !result?.success || !result.notes) {
      throw new Error(result?.message || "Couldn't extract notes");
    }

    return result.notes;
}



export async function onGenerate(
  podcastData: PodcastData, 
  signal?: AbortSignal): Promise<PodcastScenario> 
{
    const response = await fetch("http://localhost:8000/api/generateScenario", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        podcastData
      }),
      signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success || !result.scenario) {
      throw new Error(result?.message || "Couldn't generate the scenario.");
    }
    
    return result.scenario;
}

// Jedno żądanie frontendu. Backend generuje partie ElevenLabs wraz z timestampami.
// Zachowany callback pozwala podpiąć helper bez przebudowy istniejącego formularza.
export async function buildPodcast(
  projectId: string,
  scenario: PodcastScenario, 
  options: {
    signal?: AbortSignal;
    onProgress?: (completed: number, total: number) => void
  } = {}
) {

  options.onProgress?.(0, 1);

  // budując podkast przekazuje scenariusz i pilot
  const result = await requestPodcastAudio(projectId, scenario, options.signal);
  
  try { 
    options.onProgress?.(1, 1) 
  } catch (error) { 
    URL.revokeObjectURL(result.podcast.audioUrl!)
    throw error 
  }
  
  return result;
}





