import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import tradeservice from "../../appwrite/tradedetails";

export const tradeApi = createApi({
  reducerPath: "tradeApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["trade"],
  endpoints: (build) => ({
    getTrade: build.query({
      queryFn: async (tradeId) => {
        try {
          const trade = await tradeservice.getTrade(tradeId);
          return { data: trade };
        } catch (error) {
          return { error };
        }
      },
      providesTags: (result, error, tradeId) => [
        { type: "trade", id: tradeId },
      ],
    }),

    createTrade: build.mutation({
      queryFn: async (tradeData) => {
        try {
          const res = await tradeservice.createTrade(tradeData);
          return { data: res };
        } catch (error) {
          return { error };
        }
      },
      onQueryStartedq: async (tradeData, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            tradeApi.util.updateQueryData("listTrades", undefined, (draft) => {
              draft.documents.unshift(data);
            })
          );
        } catch (error) {
          console.log(error);
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: "trade", id: "LIST" }],
    }),

    updateTrade: build.mutation({
      queryFn: async ({ tradeId, updatedData }) => {
        try {
          const res = await tradeservice.updateTrade(tradeId, updatedData);
          return { data: res };
        } catch (error) {
          return { error };
        }
      },
      onQueryStarted: async (
        { tradeId, updatedData },
        { dispatch, queryFulfilled }
      ) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            tradeApi.util.updateQueryData("listTrades", undefined, (draft) => {
              const index = draft.documents.findIndex(
                (doc) => doc.$id === tradeId
              );
              if (index !== -1) {
                draft.documents[index] = data;
              }
            })
          );
        } catch (error) {
          console.log(error);
        }
      },
      invalidatesTags: (result, error, arg) => {
        return [{ type: "trade", id: arg.tradeId }];
      },
    }),

    deleteTrade: build.mutation({
      queryFn: async (tradeId) => {
        try {
          await tradeservice.deleteTrade(tradeId);
          return { data: { success: true } };
        } catch (error) {
          return { error };
        }
      },
      onQueryStarted: async (tradeId, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(
            tradeApi.util.updateQueryData("listTrades", undefined, (draft) => {
              draft.documents = draft.documents.filter(
                (doc) => doc.$id !== tradeId
              );
            })
          );
        } catch (error) {
          console.log(error);
        }
      },
      invalidatesTags: (result, error, tradeId) => [
        { type: "trade", id: tradeId },
      ],
    }),

    listTrades: build.query({
      queryFn: async (queries) => {
        try {
          const res = await tradeservice.listTrades(queries);
          return { data: res };
        } catch (error) {
          return { error };
        }
      },
      onQueryStarted: async (queries, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            tradeApi.util.updateQueryData("listTrades", undefined, (draft) => {
              draft.documents = data.documents;
            })
          );
        } catch (error) {
          console.log(error);
        }
      },
      providesTags: (result, error, arg) => [
        { type: "trade", id: "LIST" },
        ...result.documents.map((doc) => ({ type: "trade", id: doc.$id })),
      ],
    }),
  }),
});

export const {
  useGetTradeQuery,
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useDeleteTradeMutation,
  useListTradesQuery,
} = tradeApi;
