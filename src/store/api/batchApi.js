import { createApi } from '@reduxjs/toolkit/query/react';
import { BatchService } from '../../appwrite/batchService';


export const batchApi = createApi({
  reducerPath: 'batchApi',
  baseQuery: BatchService.customBatchBaseQuery,
  endpoints: (build) => ({
    getTrade: build.query({
      query: (batchId) => ({
        method: 'GET',
        data: { batchId },
      }),
    }),
    //TODO:  Add additional endpoints (e.g., create, update, delete) here.
  }),
});


export const { useGetTradeQuery } = batchApi;


