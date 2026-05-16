import { useRef } from "react";
import mockTestService from "@/services/mocktest.service";

const SAVE_DEBOUNCE_MS = import.meta.env.DEV ? 800 : 5000;

/**
 * Provides debounced cloud auto-save for exam answers.
 * @param {string} paperId - The current paper's document ID.
 */
export function useAutoSave(paperId) {
  const saveDebounceRef = useRef(null);
  const pendingQuestionsRef = useRef(null);

  const triggerSave = (questions) => {
    pendingQuestionsRef.current = questions;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      if (!pendingQuestionsRef.current) return;
      try {
        await mockTestService.saveProgress(paperId, pendingQuestionsRef.current);
        pendingQuestionsRef.current = null;
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, SAVE_DEBOUNCE_MS);
  };

  const flushSave = async () => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
    if (pendingQuestionsRef.current) {
      try {
        await mockTestService.saveProgress(paperId, pendingQuestionsRef.current);
        pendingQuestionsRef.current = null;
      } catch (err) {
        console.error("Flush save failed:", err);
      }
    }
  };

  return { triggerSave, flushSave };
}
