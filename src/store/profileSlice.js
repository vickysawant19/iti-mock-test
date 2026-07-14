import { createSlice } from "@reduxjs/toolkit";
import { checkProfileCompletion } from "@/utils/profileCompletion";

const initialState = {
  data: null,
  isLoading: true,
  isInitialized: false, // true once App.jsx has completed its first auth check
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    addProfile: (state, action) => {
      if ('data' in action.payload) {
        const profile = action.payload.data ?? null;
        if (profile) {
          state.data = {
            ...profile,
            isProfileComplete: profile.isProfileComplete ?? checkProfileCompletion(profile).isComplete
          };
        } else {
          state.data = null;
        }
      }
      if ('isLoading' in action.payload) {
        state.isLoading = action.payload.isLoading;
      }
      if ('isInitialized' in action.payload) {
        state.isInitialized = action.payload.isInitialized;
      }
    },
    removeProfile: (state, action) => {
      state.data = null;
      state.isLoading = false;
      // keep isInitialized: true on logout — App stays initialized
    },
  },
});

export const { addProfile, removeProfile } = profileSlice.actions;

export const selectProfile = (state) => state.profile.data;
export const selectProfileLoading = (state) => state.profile.isLoading;
export const selectProfileInitialized = (state) => state.profile.isInitialized;
