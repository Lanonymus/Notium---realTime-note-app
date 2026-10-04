import { useCallback, useEffect, useRef } from "react";

export type LearningActivityType =
  | "notes"
  | "quiz"
  | "flashcards"
  | "podcast";

type TrackingMode = "interaction" | "media";

type UseLearningActivityOptions = {
  enabled: boolean;
  activityType: LearningActivityType;
  projectId?: string;
  resourceId?: string | null;
  mode?: TrackingMode;
  idleTimeMs?: number;
  heartbeatMs?: number;
  apiBaseUrl?: string;
  disabledReason?: "completed" | "route_changed";
};

type StartActivityResponse = {
  success: boolean;
  sessionId: string;
};

const INTERACTION_EVENTS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
];

const END_DELAY_MS = 350;

export function useLearningActivity({
  enabled,
  activityType,
  projectId,
  resourceId = null,
  mode = "interaction",
  idleTimeMs = 3 * 60 * 1000,
  heartbeatMs = 60 * 1000,
  apiBaseUrl = "http://localhost:8000/api",
  disabledReason = "route_changed",

}: UseLearningActivityOptions) {

  const sessionIdRef = useRef<string | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const startPromiseRef = useRef<Promise<string | null> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionAtRef = useRef(Date.now());

  const optionsRef = useRef({
    enabled,
    activityType,
    projectId,
    resourceId,
    mode,
    idleTimeMs,
    apiBaseUrl,
    disabledReason,
  });

  optionsRef.current = {
    enabled,
    activityType,
    projectId,
    resourceId,
    mode,
    idleTimeMs,
    apiBaseUrl,
    disabledReason,
  };

  const isMediaPlaying = useCallback(() => {
    const media = document.querySelectorAll<HTMLMediaElement>("audio, video");

    return Array.from(media).some(
      (element) => !element.paused && !element.ended && element.readyState >= 2,
    );
  }, []);



  const isEnvironmentActive = useCallback(() => {
    const current = optionsRef.current;

    if (current.mode === "media") {
      return isMediaPlaying();
    }

    const isVisible = document.visibilityState === "visible";
    const isRecentlyActive =
      Date.now() - lastInteractionAtRef.current < current.idleTimeMs;

    return isVisible && isRecentlyActive;
  }, [isMediaPlaying]);


  const isCurrentlyActive = useCallback(
    () => optionsRef.current.enabled && isEnvironmentActive(),
    [isEnvironmentActive],
  );



  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (startPromiseRef.current) return startPromiseRef.current;

    const current = optionsRef.current;
    if (!current.enabled || !current.projectId) return null;

    startPromiseRef.current = fetch(`${current.apiBaseUrl}/activity/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: current.projectId,
        resourceId: current.resourceId,
        activityType: current.activityType,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not start learning session");

        const result = (await response.json()) as StartActivityResponse;
        sessionIdRef.current = result.sessionId;
        return result.sessionId;
      })
      .catch((error) => {
        console.error("Learning activity start failed:", error);
        return null;
      })
      .finally(() => {
        startPromiseRef.current = null;
      });

    return startPromiseRef.current;
  }, []);





  const sendHeartbeat = useCallback(async (activeOverride?: boolean) => {
    const sessionId = await ensureSession();
    if (!sessionId) return;


    try {
      await fetch(
        `${optionsRef.current.apiBaseUrl}/activity/${sessionId}/heartbeat`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: activeOverride ?? isCurrentlyActive(),
          }),
        },
      );
    } catch (error) {
      console.error("Learning activity heartbeat failed:", error);
    }
  }, [ensureSession, isCurrentlyActive]);




  const endSession = useCallback(
    async (
      reason: "completed" | "route_changed" | "tab_closed" | "context_changed",
      activeOverride?: boolean,
    ) => {
      const pendingSession = sessionIdRef.current
        ? Promise.resolve(sessionIdRef.current)
        : startPromiseRef.current;

      const sessionId = pendingSession ? await pendingSession : null;
      if (!sessionId || sessionIdRef.current !== sessionId) return;

      sessionIdRef.current = null;
      sessionKeyRef.current = null;

      try {
        await fetch(`${optionsRef.current.apiBaseUrl}/activity/${sessionId}/end`, {
          method: "POST",
          credentials: "include",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: activeOverride ?? isCurrentlyActive(),
            reason,
          }),
        });
      } catch (error) {
        console.error("Learning activity end failed:", error);
      }
    },
    [isCurrentlyActive],
  );



  
  useEffect(() => {
    const markInteraction = () => {
      lastInteractionAtRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      const current = optionsRef.current;

      if (current.mode === "media") {
        void sendHeartbeat();
        return;
      }

      const wasRecentlyActive =
        Date.now() - lastInteractionAtRef.current < current.idleTimeMs;

      if (document.visibilityState === "hidden") {
        // Flush the visible fragment that ended when the tab was hidden.
        void sendHeartbeat(current.enabled && wasRecentlyActive);
        return;
      }

      // Close the hidden fragment without counting it, then start a new one.
      void sendHeartbeat(false);
      markInteraction();
    };

    const handleMediaStateChange = (event: Event) => {
      if (optionsRef.current.mode !== "media") return;

      // `play` begins a new active fragment, so the preceding fragment was
      // inactive. `pause` and `ended` close a fragment that was active.
      void sendHeartbeat(event.type === "pause" || event.type === "ended");
    };

    const handlePageHide = () => {
      void endSession("tab_closed");
    };

    INTERACTION_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("play", handleMediaStateChange, true);
    document.addEventListener("pause", handleMediaStateChange, true);
    document.addEventListener("ended", handleMediaStateChange, true);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      INTERACTION_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("play", handleMediaStateChange, true);
      document.removeEventListener("pause", handleMediaStateChange, true);
      document.removeEventListener("ended", handleMediaStateChange, true);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [endSession, sendHeartbeat]);

  useEffect(() => {
    if (!enabled || !projectId) return;

    const nextSessionKey = `${activityType}:${projectId}:${resourceId ?? "project"}`;
    lastInteractionAtRef.current = Date.now();

    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }

    const begin = async () => {
      if (sessionKeyRef.current && sessionKeyRef.current !== nextSessionKey) {
        await endSession("context_changed");
      }

      sessionKeyRef.current = nextSessionKey;
      await ensureSession();
    };

    void begin();
    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, heartbeatMs);

    return () => {
      window.clearInterval(interval);

      // A short delay prevents React Strict Mode from creating two sessions
      // during its development-only effect setup/cleanup replay.
      endTimerRef.current = setTimeout(() => {
        if (sessionKeyRef.current === nextSessionKey) {
          void endSession(
            optionsRef.current.disabledReason,
            isEnvironmentActive(),
          );
        }
      }, END_DELAY_MS);
    };
  }, [
    activityType,
    enabled,
    endSession,
    ensureSession,
    heartbeatMs,
    isEnvironmentActive,
    projectId,
    resourceId,
    sendHeartbeat,
  ]);
}
