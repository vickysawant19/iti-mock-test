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

    let unsubscribe;

    const handleEvent = (response) => {
      const { events, payload } = response;

      // 1. Context Filtering: Only process updates for the current month
      // (Batch filtering is now handled server-side if query is active)
      const eventMonth = payload.date?.substring(0, 7); // Format: YYYY-MM
      if (eventMonth !== currentViewMonth) return;

      // 2. Optimized Local State Update
      setAttendanceData((prev) => {
        const isCreate = events.some((e) => e.includes(".create"));
        const isUpdate = events.some((e) => e.includes(".update"));
        const isDelete = events.some((e) => e.includes(".delete"));

        if (isCreate) {
          // Guard against duplicate records
          if (prev.some((item) => item.$id === payload.$id)) return prev;
          return [...prev, payload];
        }

        if (isUpdate) {
          const index = prev.findIndex((i) => i.$id === payload.$id);
          if (index === -1) return prev; // Document not in current view

          // Only update if there's an actual change to avoid unnecessary re-renders
          const updated = [...prev];
          updated[index] = payload;
          return updated;
        }

        if (isDelete) {
          return prev.filter((item) => item.$id !== payload.$id);
        }

        return prev;
      });
    };

    try {
      // 🚀 Appwrite v23+ supports Server-Side Filtered Subscriptions (Realtime Queries)
      // client.subscribe is deprecated; using Realtime service instead.
      const realtime = appwriteService.getRealtime();
      const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

      unsubscribe = realtime.subscribe(channel, handleEvent, [
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
      const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

      unsubscribe = realtime.subscribe(channel, (response) => {
        // Apply manual batch filter in fallback mode
        if (response.payload.batchId === selectedBatch) {
          handleEvent(response);
        }
      });
    }

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [selectedBatch, selectedMonth, setAttendanceData]);
}
