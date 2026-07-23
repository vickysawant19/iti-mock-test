import { useEffect } from "react";
import { realtime, Channel } from "@/services/appwriteClient";

/**
 * useBatchRealtime — reusable hook for subscribing to Appwrite Realtime events
 * scoped to a specific database table or team channel.
 *
 * @param {string|null} teamId    - The active batch's Appwrite teamId
 * @param {string|null} tableId   - Optional database tableId to listen on
 * @param {function}    onEvent   - Callback function (response => void)
 */
export function useBatchRealtime(teamId, tableId, onEvent) {
  useEffect(() => {
    if (!teamId || !onEvent) return;

    let subscription = null;
    let isCancelled = false;

    const setupSubscription = async () => {
      try {
        const channels = [Channel.team(teamId)];

        const sub = await realtime.subscribe(channels, (response) => {
          if (!isCancelled && onEvent) {
            onEvent(response);
          }
        });

        if (isCancelled) {
          sub.close();
        } else {
          subscription = sub;
        }
      } catch (err) {
        console.warn("[useBatchRealtime] Subscription failed:", err);
      }
    };

    setupSubscription();

    return () => {
      isCancelled = true;
      if (subscription && typeof subscription.close === "function") {
        subscription.close();
      }
    };
  }, [teamId, tableId, onEvent]);
}

export default useBatchRealtime;
