import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import type { LearningStats, Project, SourceFile } from "./dashboard.types";


type DashboardResponse = {
  success: boolean;
  message: string;
  flag: string;

  userData: {
    id: string;
    username: string;
    email: string;
    dailyStreak: number;
    maxStreak: number;
    streakFreezes: number;
    lastStreakDate: string | null;
    keysLeft: number;
    xp: number;
  };

  userProjects: Project[];
  learningStats: LearningStats;
};




const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";


export function getYoutubeId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1).split("/")[0]
        : ["youtube.com", "m.youtube.com"].includes(host)
          ? (url.searchParams.get("v") ??
            url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1])
          : null;
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function useDashboardData(
  apiBaseUrl: string,
  onCreated: (id: string) => void,
) {
  const base = apiBaseUrl.replace(/\/$/, "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(false);
  const sourceRequests = useRef(new Map<string, AbortController>());
  const removedSources = useRef(new Set<string>());
  const requestGuard = useRef(false);
  const creationRequest = useRef<AbortController>(null);
  const projectRequest = useRef<AbortController>(null);
  
  const initialLearningStats: LearningStats = {
    dailyStreak: 0,
    maxStreak: 0,
    streakFreezes: 0,
    lastStreakDate: null,
    activeDates: [],
    frozenDates: [],
    xp: 0,
    lessonsCompleted: 0,
  }

  const [learningStats, setLearningStats] = useState<LearningStats>(initialLearningStats)
  const [lessonsCompleted, setLessonsCompleted] = useState<number>(0);
  const [keysLeft, setKeysLeft] = useState<number>(0);

  // pobieranie danych użytkownika z backendu
  // najważniejsza część dashboardu !!!!!!!!!
  const loadUserData = useCallback(async () => {
    projectRequest.current?.abort();

    const controller = new AbortController();
    projectRequest.current = controller;

    setLoadingProjects(true);
    setProjectsError("");

    try {
      const response = await fetch(`${base}/api/getUserData`, {
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Couldn't load your data.");

      const data = (await response.json()) as DashboardResponse;

      if (!Array.isArray(data.userProjects)) {
        throw new Error("The server returned an invalid project list.");
      }

      if(!data.userData) {
        throw new Error("The server returned an invalid user data.")
      }

      if(!data.learningStats) {
        throw new Error("The server returned invalid learning stats.")
      }

      if (alive.current && !controller.signal.aborted)
        setProjects(
          [...data.userProjects].sort(
            (a, b) =>
              (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0),
          ),
        );

        setLearningStats(data.learningStats)
        setKeysLeft(data.userData.keysLeft)

        console.log("dane statystyk: ", data.learningStats)

        
    } catch (error) {
      if (alive.current && !controller.signal.aborted)
        setProjectsError(errorMessage(error));

    } finally {
      if (alive.current && !controller.signal.aborted)
        setLoadingProjects(false);
    }
  }, [base]);


  useEffect(() => {
    alive.current = true;
    void loadUserData();
    
    return () => {
      alive.current = false;
      projectRequest.current?.abort();
      creationRequest.current?.abort();
      sourceRequests.current.forEach((controller) => controller.abort());
      sourceRequests.current.clear();
    };
  }, [loadUserData]);



  // wydziela tekst z danego pliku
  async function extract(source: SourceFile, form: FormData) {
    const controller = new AbortController();
    sourceRequests.current.set(source.id, controller);

    try {
      const response = await axios.post(`${base}/api/dataToText`, form, {
        signal: controller.signal,
        // Keep the original extraction endpoint's credentials behaviour.
        onUploadProgress: (event) => {
          if (event.total && alive.current)
            setSources((current) =>
              current.map((item) =>
                item.id === source.id
                  ? {
                      ...item,
                      progress: Math.round((event.loaded / event.total!) * 100),
                    }
                  : item,
              ),
            );
        },
      });

      const text = response.data?.extractedText;

      if (typeof text !== "string" || !text.trim())
        throw new Error(
          "No readable content found. Remove this source and try another file.",
        );
        
      if (alive.current && !controller.signal.aborted)
        setSources((current) =>
          current.map((item) =>
            item.id === source.id
              ? { ...item, status: "ready", progress: 100, extractedText: text }
              : item,
          ),
        );

    } catch (error) {
      if (alive.current && !controller.signal.aborted)
        setSources((current) =>
          current.map((item) =>
            item.id === source.id
              ? { ...item, status: "error", error: errorMessage(error) }
              : item,
          ),
        );
    } finally {
      sourceRequests.current.delete(source.id);
    }
  }



  // dodaje plik do listy sources i wydziela z niego tekst
  async function addFiles(files: File[]) {
    if (requestGuard.current) return;
    setError("");

    const validFiles = files.filter((file) => file.size <= 50 * 1024 * 1024);

    if (validFiles.length !== files.length)
      setError("Some files exceed 50 MB and were skipped.");
    // Same multipart contract and sequential extraction as the supplied code.

    const items = validFiles.map((file) => ({
      file,
      source: {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        progress: 0,
        status: "extracting" as const,
        extractedText: "",
      },
    }));

    setSources((current) => [...current, ...items.map((item) => item.source)]);

    for (const { file, source } of items) {
      if (!alive.current) return;

      if (removedSources.current.has(source.id)) continue;

      const form = new FormData();
      form.append("files", file);
      await extract(source, form);
    }
  }



  function addYoutube(url: string) {
    if (requestGuard.current) return;
    const id = getYoutubeId(url);
    if (!id) {
      setError("Paste a valid YouTube video link.");
      return;
    }
    if (sources.some((source) => source.youtubeId === id)) {
      setError("This video is already attached.");
      return;
    }
    setError("");
    const source: SourceFile = {
      id: uuidv4(),
      name: `YouTube · ${id}`,
      type: "youtube",
      youtubeId: id,
      progress: 0,
      status: "extracting",
      extractedText: "",
    };
    setSources((current) => [...current, source]);
    const form = new FormData();
    form.append("youtubeUrl", `https://www.youtube.com/watch?v=${id}`);
    void extract(source, form);
  }



  function removeSource(id: string) {
    removedSources.current.add(id);
    sourceRequests.current.get(id)?.abort();
    setSources((current) => current.filter((source) => source.id !== id));
  }


  const extracting = sources.some((source) => source.status === "extracting");
  const hasFailedSource = sources.some((source) => source.status === "error");
  const canCreate =
    !creating &&
    !extracting &&
    !hasFailedSource &&
    (!!prompt.trim() || sources.some((source) => source.status === "ready"));

    
  async function createProject() {
    if (!canCreate || requestGuard.current) return;

    requestGuard.current = true;
    setCreating(true);
    setError("");

    const controller = new AbortController();
    creationRequest.current = controller;

    try {
      const response = await fetch(`${base}/api/createProject`, {

        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          contextText: sources
            .map((source) => source.extractedText)
            .filter(Boolean)
            .join("\n\n--- NASTĘPNY DOKUMENT ---\n\n"),
          youtubeUrls: sources
            .filter((source) => source.youtubeId)
            .map(
              (source) => `https://www.youtube.com/watch?v=${source.youtubeId}`,
            ),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.data?.id) {
        throw new Error(
          result.message || "Couldn't create your project. Please try again.",
        );        
      }

      if (alive.current && !controller.signal.aborted)        
        onCreated(result.data.id);

    } catch (error) {

      if (alive.current && !controller.signal.aborted) {
        setError(errorMessage(error));
        console.log("test: ");     
      } 

    } finally {
      requestGuard.current = false;
      if (alive.current) setCreating(false);

    }
  }

  return {
    projects,
    loadingProjects,
    projectsError,
    loadUserData,

    prompt,
    setPrompt,
    sources,
    creating,
    error,
    extracting,
    canCreate,

    addFiles,
    addYoutube,
    removeSource,
    createProject,

    learningStats,
    lessonsCompleted,
    keysLeft,
  };
}
