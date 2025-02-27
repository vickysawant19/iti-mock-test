import { createApi } from "@reduxjs/toolkit/query/react";
import { BatchService } from "../../appwrite/batchService";

export const batchApi = createApi({
  reducerPath: "batchApi",
  baseQuery: BatchService.customBatchBaseQuery,
  tagTypes: ["batch"],
  endpoints: (build) => ({
    getBatch: build.query({
      query: (batchId) => ({
        method: "GET",
        data: { batchId },
      }),
      providesTags: ["batch"],
    }),
    //TODO:  Add additional endpoints (e.g., create, update, delete) here.
  }),
});

export const { useGetBatchQuery } = batchApi;
