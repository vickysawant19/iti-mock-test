import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  isLoading: true
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.data = action.payload?.data || state.data ;
      state.isLoading = action.payload?.isLoading || false;
    },
    removeUser: (state) => {
      state.data = null;
      state.isLoading = false;
    },
  },
});

export const selectUser = (state) => state.user.data;
export const selectUserLoading = (state) => state.user.isLoading;

export const { addUser, removeUser } = userSlice.actions;

export default userSlice.reducer;
