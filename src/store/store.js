import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import profileReducer from "./profileSlice";
import questionsReducer from "./questionSlice";
export const store = configureStore({
  reducer: {
    user: userReducer,
    profile: profileReducer,
    questions: questionsReducer,
  },
});
