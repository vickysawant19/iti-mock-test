import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

export const questionsSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    addQuestions: (state, action) => {
      return action.payload;
    },
    removeQuestion: (state, action) => {
      return null;
    },
  },
});

export const { addQuestions, removeQuestions } = questionsSlice.actions;

export const selectQuestions = (state) => state.questions;
