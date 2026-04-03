import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { addProfile, selectProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";
import { checkProfileCompletion } from "@/utils/profileCompletion";

/**
 * Provides unified access to the current user's profile.
 *
 * - `profile`      : current profile from Redux store
 * - `isComplete`   : whether profile passes completion check
 * - `missingFields`: list of incomplete required fields
 * - `updateProfile`: patch-updates profile, syncs Redux, re-checks completion
 * - `markComplete` : sets isProfileComplete=true after full save
 */
export function useUserProfile() {
  const dispatch = useDispatch();
  const profile = useSelector(selectProfile);

  const { isComplete, missingFields } = checkProfileCompletion(profile);

  const updateProfile = useCallback(
    async (fields) => {
      if (!profile?.$id) throw new Error("No profile loaded.");
      const updated = await userProfileService.patchUserProfile(profile.$id, fields);
      dispatch(addProfile({ data: updated }));
      return updated;
    },
    [profile, dispatch]
  );

  const markComplete = useCallback(
    async () => {
      if (!profile?.$id) return;
      const { isComplete: nowComplete } = checkProfileCompletion(profile);
      if (nowComplete) {
        await updateProfile({ isProfileComplete: true });
      }
    },
    [profile, updateProfile]
  );

  return {
    profile,
    isComplete,
    missingFields,
    updateProfile,
    markComplete,
  };
}
