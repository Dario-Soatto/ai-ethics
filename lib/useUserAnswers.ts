"use client";

import { useCallback, useEffect, useState } from "react";

export const ANSWERS_STORAGE_KEY = "mec-quiz-answers-v1";

export type AnswersUpdater =
  | Record<string, string>
  | ((prev: Record<string, string>) => Record<string, string>);

/**
 * Reads & writes the user's quiz answers from localStorage. Listens for
 * `storage` events so changes in another tab propagate live. The `hydrated`
 * flag is `true` once the initial localStorage read has happened — useful
 * for server-rendered pages that want to avoid showing stale state.
 */
export function useUserAnswers() {
  const [answers, setAnswersState] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ANSWERS_STORAGE_KEY);
      if (saved) setAnswersState(JSON.parse(saved));
    } catch {
      // ignore
    }
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== ANSWERS_STORAGE_KEY) return;
      try {
        setAnswersState(e.newValue ? JSON.parse(e.newValue) : {});
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setAnswers = useCallback((updater: AnswersUpdater) => {
    setAnswersState((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater;
      try {
        window.localStorage.setItem(
          ANSWERS_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { answers, setAnswers, hydrated };
}
