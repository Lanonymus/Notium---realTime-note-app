

export type PodcastResource = {
  id: string;
  name: string;
  kind: "file" | "youtube" | "text";
  text: string;
  createdAt: string;
  originalUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
};


export type PodcastData = {
  includeNotes: boolean;
  notes: string,
  resources: PodcastResource[];
  language: string;
  speakerIds: string[];
  length: "short" | "medium" | "long";
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  additionalInstructions: string;
};


export type ScenarioSpeaker = { 
  id: string;
  name: string; 
  description: string
};

// Scenariusz NIE udaje gotowego podcastu: nie ma jeszcze sekund ani audioUrl.
export type PodcastScenario = {
  id: string;
  title: string;
  description: string;
  language: string;
  mode: "monologue" | "dialogue";
  speakers: ScenarioSpeaker[];
  chapters: {
    id: string;
    title: string;
    description: string;
    icon: string;
    utterances: { 
      id: string; 
      speakerId: string; 
      text: string 
    }[];
  }[];
};

export type Chapter = {
  id: string;
  title: string;
  description: string;
  start: number;
  end?: number;
  icon: string;
};



export type TranscriptWord = {
  id: string;
  text: string;
  start: number;
  end: number;
  charStart: number;
  charEnd: number;
};


export type Utterance = {
  id: string;
  speaker: string;
  speakerId?: string;
  start: number;
  end?: number;
  text: string;
  words?: TranscriptWord[];
};


export type Podcast = {
  id: string;
  title: string;
  description: string;
  duration: number;
  audioUrl?: string;
  waveform?: number[];
  chapters: Chapter[];
  transcript: Utterance[];
  speakers?: ScenarioSpeaker[];
};
