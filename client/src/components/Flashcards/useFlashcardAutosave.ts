import { useCallback, useEffect, useRef, useState } from "react";
import type { FlashcardsSet } from "./FlashcardsLayout";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Options = {
    projectId: string | undefined;
    snapshot: FlashcardsSet | null;
    enabled: boolean;
    delay?: number;
};

type SaveJob = {
    key: string;
    projectId: string;
    snapshot: FlashcardsSet;
};

export default function useFlashcardAutosave({
    projectId,
    snapshot,
    enabled,
    delay = 500,
}: Options) {
    const [status, setStatus] = useState<SaveStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    const pending = useRef<SaveJob | null>(null);
    const saving = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mounted = useRef(false);

    // JSON pozwala porównywać zawartość, nawet gdy obiekt powstaje
    // od nowa przy każdym renderze.
    const serialized = snapshot ? JSON.stringify(snapshot) : null;

    const sendPending = useCallback(async () => {
        if (saving.current) return;

        saving.current = true;

        try {
            while (pending.current) {
                const job = pending.current;
                pending.current = null;

                if (mounted.current) {
                    setStatus("saving");
                    setError(null);
                }

                try {
                    const response = await fetch(
                        "http://localhost:8000/api/saveFlashcardSetProgress",
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                projectId: job.projectId,
                                latestFlashcardSetId: job.snapshot.id,
                                latestFlashcardSet: job.snapshot,
                            }),
                        }
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Nie udało się zapisać postępu (${response.status}).`
                        );
                    }
                } catch (cause) {
                    // Zachowaj nowszy snapshot, jeżeli pojawił się
                    // podczas żądania. W przeciwnym razie zachowaj ten.
                    pending.current ??= job;

                    if (mounted.current) {
                        setStatus("error");
                        setError(
                            cause instanceof Error
                                ? cause.message
                                : "Błąd połączenia z serwerem."
                        );
                    }

                    return;
                }
            }

            if (mounted.current) {
                setStatus("saved");
            }
        } finally {
            saving.current = false;
        }
    }, []);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;

            if (timer.current !== null) {
                clearTimeout(timer.current);
            }

            // Próba wysłania ostatniej zmiany przy odmontowaniu.
            // Nie gwarantuje zakończenia zapisu przy zamknięciu przeglądarki.
            void sendPending();
        };
    }, [sendPending]);



    useEffect(() => {
        if (!enabled || !projectId || !serialized) return;

        const job: SaveJob = {
            key: `${projectId}:${serialized}`,
            projectId,
            snapshot: JSON.parse(serialized) as FlashcardsSet,
        };

        pending.current = job;

        timer.current = setTimeout(() => {
            timer.current = null;
            void sendPending();
        }, delay);

        return () => {
            if (timer.current !== null) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        };
    }, [projectId, serialized, enabled, delay, sendPending]);



    const retry = useCallback(() => {
        if (timer.current !== null) {
            clearTimeout(timer.current);
            timer.current = null;
        }

        void sendPending();
    }, [sendPending]);

    return { status, error, retry };
}