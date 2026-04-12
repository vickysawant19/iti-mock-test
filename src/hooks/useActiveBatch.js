import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { setActiveBatch as setGlobalActiveBatch } from "@/store/activeBatchSlice";

/**
 * Manages the student/teacher's "active batch" context.
 * Now acts as a wrapper around the global activeBatch Redux slice.
 *
 * - `activeBatchId`       : the currently active batchId
 * - `setActiveBatch(id)` : dispatches the global batch update thunk
 * - `clearActiveBatch()`  : unused/deprecated, sets batchId to null
 */
export function useActiveBatch() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { activeBatchId, userBatches } = useSelector((state) => state.activeBatch);

  const isTeacher = user?.labels?.includes("Teacher");

  const setActiveBatch = useCallback(
    async (batchId) => {
      if (!user?.$id) return;
      dispatch(setGlobalActiveBatch({ 
        batchId, 
        userId: user.$id, 
        isTeacher, 
        currentBatches: userBatches 
      }));
    },
    [user, userBatches, isTeacher, dispatch]
  );

  const clearActiveBatch = useCallback(async () => {
     // Deprecated. Do nothing.
  }, []);

  return {
    activeBatchId,
    setActiveBatch,
    clearActiveBatch,
  };
}
