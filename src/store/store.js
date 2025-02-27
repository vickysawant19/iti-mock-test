import { configureStore } from "@reduxjs/toolkit";
import { collegeApi } from "./api/collegeApi";
import { tradeApi } from "./api/tradeApi";

import { userSlice } from "./userSlice";
import { profileSlice } from "./profileSlice";
import { questionsSlice } from "./questionSlice";
import { batchApi } from "./api/batchApi";

export const store = configureStore({
  reducer: {
    [collegeApi.reducerPath]: collegeApi.reducer,
    [tradeApi.reducerPath]: tradeApi.reducer,
    [batchApi.reducerPath]: batchApi.reducer,
    [userSlice.name]: userSlice.reducer,
    [profileSlice.name]: profileSlice.reducer,
    [questionsSlice.name]: questionsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      collegeApi.middleware,
      tradeApi.middleware,
      batchApi.middleware
    ),
});
