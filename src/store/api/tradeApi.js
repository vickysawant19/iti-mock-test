import { createApi } from '@reduxjs/toolkit/query/react';
import { TradeService } from '../../appwrite/tradedetails';

export const tradeApi = createApi({
  reducerPath: 'tradeApi',
  baseQuery: TradeService.customTradeBaseQuery,
  endpoints: (build) => ({
    getTrade: build.query({
      query: (tradeId) => ({
        method: 'GET',
        data: { tradeId },
      }),
    }),
    //TODO:  Add additional endpoints (e.g., create, update, delete) here.
  }),
});


export const { useGetTradeQuery } = tradeApi;


