import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

/**
 * Monitors for anti-cheat violations (tab switching, fullscreen exit).
 * Issues strikes and auto-submits the exam after 3 violations.
 *
 * @param {boolean} isActive - Whether proctoring is currently active (exam started, not submitted).
 * @param {Function} onAutoSubmit - Callback to call when 3 strikes are reached.
 */
export function useAntiCheat({ isActive, onAutoSubmit }) {
  const [strikes, setStrikes] = useState(0);
  const strikesRef = useRef(0);

  // Stable ref so event listeners don't get re-registered on every render
  const onAutoSubmitRef = useRef(onAutoSubmit);
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    const handleStrike = () => {
      // Disable strikes during development for easier debugging
      if (import.meta.env.DEV) {
        console.log("Security strike ignored in development mode.");
        return;
      }

      strikesRef.current += 1;
      setStrikes(strikesRef.current);

      if (strikesRef.current === 1) {
        toast.warning(
          "⚠️ WARNING (1/3): Tab switching or exiting full-screen is not allowed!",
          { position: "top-center", autoClose: 10000 },
        );
      } else if (strikesRef.current === 2) {
        toast.warning(
          "🚨 FINAL WARNING (2/3): One more violation will auto-submit your exam immediately!",
          { position: "top-center", autoClose: 10000 },
        );
      } else if (strikesRef.current >= 3) {
        toast.error(
          "🚨 EXAM TERMINATED (3/3): Multiple violations detected. Auto-submitting...",
          { position: "top-center" },
        );
        onAutoSubmitRef.current();
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      toast.error("Copying and pasting is disabled!");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Right-click is disabled!");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isActive) {
        handleStrike();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        handleStrike();
      }
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isActive]);

  return { strikes };
}
