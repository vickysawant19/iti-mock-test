import { useEffect, useRef, useState } from "react";

/**
 * Tracks the remaining seconds of the exam using absolute wall-clock time
 * to prevent drift when the tab is backgrounded.
 *
 * @param {string|null} startTime    - ISO string for when the exam started.
 * @param {number}      totalMinutes - Total duration of the exam in minutes.
 * @param {boolean}     submitted    - Whether the exam has been submitted.
 * @param {Function}    onExpire     - Callback fired when time reaches zero (stable ref, won't re-trigger timer).
 */
export function useExamTimer({ startTime, totalMinutes, submitted, onExpire }) {
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [timeWarning, setTimeWarning] = useState(false);
  const timerRef = useRef(null);
  const expiredRef = useRef(false);

  // Keep onExpire in a ref so the threshold effect never needs it as a dep,
  // preventing the effect from re-running (and re-checking expiry) every render.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Seed initial remaining time as soon as startTime is known
  useEffect(() => {
    if (!startTime) return;
    const startMs = new Date(startTime).getTime();
    const totalSecs = (totalMinutes || 60) * 60;
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    setRemainingSeconds(Math.max(0, totalSecs - elapsed));
  }, [startTime, totalMinutes]);

  // Tick every second based on absolute wall-clock time
  useEffect(() => {
    if (!startTime || submitted) return;

    const startMs = new Date(startTime).getTime();
    const totalSecs = (totalMinutes || 60) * 60;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const remaining = Math.max(0, totalSecs - elapsed);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [startTime, totalMinutes, submitted]);

  // Watch thresholds — uses ref for onExpire so this effect is stable
  useEffect(() => {
    if (remainingSeconds === null || submitted) return;

    if (remainingSeconds <= 300 && remainingSeconds > 0) {
      setTimeWarning(true);
    }

    if (remainingSeconds <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpireRef.current();
    }
  }, [remainingSeconds, submitted]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return { remainingSeconds, timeWarning, formatTime };
}
