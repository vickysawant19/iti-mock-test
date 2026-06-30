import { useEffect } from "react";
import { appwriteService } from "@/services/appwriteClient";
import conf from "@/config/config";
import { format } from "date-fns";
import * as Appwrite from "appwrite";

const { Query } = Appwrite;

/**
 * Custom hook to handle real-time attendance updates from Appwrite.
 * Upgraded to use Server-Side Filtered Subscriptions (Realtime Queries).
 *
 * @param {string} selectedBatch - The ID of the currently selected batch.
 * @param {Date} selectedMonth - The currently viewed month.
 * @param {Function} setAttendanceData - State updater function for attendance records.
 */
export function useAttendanceRealtime(
  selectedBatch,
  selectedMonth,
  setAttendanceData,
) {
  useEffect(() => {
    if (!selectedBatch || !selectedMonth) return;

    const client = appwriteService.getClient();
    const databaseId = conf.databaseId;
    const collectionId = conf.newAttendanceCollectionId;
    const currentViewMonth = format(selectedMonth, "yyyy-MM");

    let sub = null; // SDK v24: subscribe() is async, returns { close(): Promise<void> }

    const handleEvent = (response) => {
      const { events, payload } = response;

      // 1. Context Filtering: Only process updates for the current month
      // (Batch filtering is now handled server-side if query is active)
      const eventMonth = payload.date?.substring(0, 7); // Format: YYYY-MM
      if (eventMonth !== currentViewMonth) return;

      // 2. Optimized Local State Update
      setAttendanceData((prev) => {
        const safePrev = prev || [];
        const isCreate = events.some((e) => e.includes(".create"));
        const isUpdate = events.some((e) => e.includes(".update"));
        const isDelete = events.some((e) => e.includes(".delete"));

        if (isCreate) {
          // Guard against duplicate records
          if (safePrev.some((item) => item.$id === payload.$id)) return safePrev;
          return [...safePrev, payload];
        }

        if (isUpdate) {
          const index = safePrev.findIndex((i) => i.$id === payload.$id);
          if (index === -1) return safePrev; // Document not in current view

          // Only update if there's an actual change to avoid unnecessary re-renders
          const updated = [...safePrev];
          updated[index] = payload;
          return updated;
        }

        if (isDelete) {
          return safePrev.filter((item) => item.$id !== payload.$id);
        }

        return safePrev;
      });
    };

    const setup = async () => {
      try {
        // 🚀 SDK v24 / Appwrite 1.9.5: realtime.subscribe() is async, returns { close() }
        // Single persistent WebSocket per client — server-side batch filtering via queries.
        const realtime = appwriteService.getRealtime();
        const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

        sub = await realtime.subscribe(channel, handleEvent, [
          Query.equal("batchId", [selectedBatch]),
        ]);

        console.log(
          "Subscribed to attendance updates with server-side batch filter.",
        );
      } catch (err) {
        console.warn(
          "Realtime query subscription failed, falling back to simple subscription.",
          err.message,
        );

        // 🔄 Fallback: Collection-level subscription with client-side batch filtering
        try {
          const realtime = appwriteService.getRealtime();
          const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

          sub = await realtime.subscribe(channel, (response) => {
            // Apply manual batch filter in fallback mode
            if (response.payload.batchId === selectedBatch) {
              handleEvent(response);
            }
          });
        } catch (err2) {
          console.error("Both subscribe attempts failed:", err2.message);
        }
      }
    };

    setup();

    // Cleanup subscription on unmount or when dependencies change
    // SDK v24: call sub.close() — not sub() or sub.unsubscribe()
    return () => {
      if (sub && typeof sub.close === "function") {
        sub.close();
      }
    };
  }, [selectedBatch, selectedMonth, setAttendanceData]);
}
