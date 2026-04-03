import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addProfile, selectProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";

/**
 * Manages the student/teacher's "active batch" context stored in their profile.
 *
 * - `activeBatchId`       : the currently active batchId from profile
 * - `setActiveBatch(id)` : patches profile.batchId and syncs Redux
 * - `clearActiveBatch()`  : sets batchId to null
 */
export function useActiveBatch() {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);

  const activeBatchId = profile?.batchId?.$id ?? profile?.batchId ?? null;

  const setActiveBatch = useCallback(
    async (batchId) => {
      if (!profile?.$id) return;
      const updated = await userProfileService.patchUserProfile(profile.$id, { batchId });
      dispatch(addProfile({ data: updated }));
    },
    [profile, dispatch]
  );

  const clearActiveBatch = useCallback(async () => {
    if (!profile?.$id) return;
    const updated = await userProfileService.patchUserProfile(profile.$id, { batchId: null });
    dispatch(addProfile({ data: updated }));
  }, [profile, dispatch]);

  return {
    activeBatchId,
    setActiveBatch,
    clearActiveBatch,
  };
}
