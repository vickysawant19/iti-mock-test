import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import batchService from "../../appwrite/batchService";

export const batchApi = createApi({
  reducerPath: "batchApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["batch"],
  endpoints: (build) => ({
    getBatch: build.query({
      queryFn: async ({ batchId, queries }) => {
        try {
          const batch = await batchService.getBatch(batchId, queries);
          return { data: batch };
        } catch (error) {
          return { error };
        }
      },
      providesTags: (result, error, batchId) => [{ type: "batch", batchId }],
    }),
    createBatch: build.mutation({
      queryFn: async (data) => {
        try {
          const batch = await batchService.createBatch(data);
          return { data: batch };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["batch"],
    }),
    updateBatch: build.mutation({
      queryFn: async ({ batchId, ...data }) => {
        try {
          const batch = await batchService.updateBatch(batchId, data);
          return { data: batch };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["batch"],
    }),
    deleteBatch: build.mutation({
      queryFn: async (batchId) => {
        try {
          await batchService.deleteBatch(batchId);
          return { data: { success: true } };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["batch"],
    }),
    listBatches: build.query({
      queryFn: async (queries) => {
        try {
          const batches = await batchService.listBatches(queries);
          return { data: batches };
        } catch (error) {
          return { error };
        }
      },
      providesTags: ["batch"],
    }),
  }),
});

export const {
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useDeleteBatchMutation,
  useListBatchesQuery,
} = batchApi;
