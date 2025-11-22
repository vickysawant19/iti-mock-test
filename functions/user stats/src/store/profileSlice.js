import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    addProfile: (state, action) => {
      return action.payload;
    },
    removeProfile: (state, action) => {
      return null;
    },
  },
});

export default profileSlice.reducer;

export const { addProfile, removeProfile } = profileSlice.actions;

export const selectProfile = (state) => state.profile;
