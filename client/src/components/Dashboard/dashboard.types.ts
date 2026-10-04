export type ResourceKind = "notes" | "flashcards" | "quiz" | "podcast";

export interface GeneratedResources {
  hasNotes?: boolean;
  hasPodcast?: boolean;
  hasFlashcards?: boolean;
  hasQuiz?: boolean;
}

export interface Resource {
  value: ResourceKind; 
  label: string, 
  icon: string,
  isActive: boolean
} 

export interface Project {
  id: string;
  icon?: string;
  title: string;
  updatedAt: string;
  type: string;
  resources?: GeneratedResources;
  flashcardsMastered?: number;
  totalFlashcards?: number;
}

export interface SourceFile {
  id: string;
  name: string;
  type: string;
  progress: number;
  status: "extracting" | "ready" | "error";
  extractedText: string;
  youtubeId?: string;
  error?: string;
}

/** These values must come from your activity/XP API, not project counts. */
export interface LearningStats {
  dailyStreak: number;
  maxStreak: number;
  streakFreezes: number;
  lastStreakDate: string | null;
  activeDates: string[];
  frozenDates: string[];
  xp: number
  lessonsCompleted: 0
}

export interface DashboardProps {
  apiBaseUrl?: string;
  stats?: Partial<LearningStats>;
  onUpgrade?: () => void;
  onCreateBlank?: () => void;
  /** Override if the app uses other project routes. */
  onOpenProject?: (project: Project, resource: ResourceKind) => void;
}




export function relativeDate(value: string): string {
  const stamp = new Date(value).getTime();
  if (!Number.isFinite(stamp)) return "Recently opened";

  const minutes = Math.max(0, Math.floor((Date.now() - stamp) / 60_000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  
  return days < 7
    ? `${days} day${days === 1 ? "" : "s"} ago`
    : new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
}
