import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  isLoading: true
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    addProfile: (state, action) => {
      state.data = action.payload?.data || state.data
      state.isLoading = action.payload?.isLoading || false
    },
    removeProfile: (state, action) => {
      state.data = null;
      state.isLoading = false;
    },
  },
});

export const { addProfile, removeProfile } = profileSlice.actions;

export const selectProfile = (state) => state.profile.data;
export const selectProfileLoading = (state) => state.profile.isLoading;

