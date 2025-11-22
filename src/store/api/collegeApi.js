import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import collegeService from "../../appwrite/collageService";

export const collegeApi = createApi({
  reducerPath: "collegeApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["college"],
  endpoints: (build) => ({
    getCollege: build.query({
      queryFn: async (collegeId) => {
        try {
          const college = await collegeService.getCollege(collegeId);
          return { data: college };
        } catch (error) {
          return { error };
        }
      },
      providesTags: (result, error, collegeId) => [
        { type: "college", collegeId },
      ],
    }),
    createCollege: build.mutation({
      queryFn: async (collegeName) => {
        try {
          const college = await collegeService.createCollege(collegeName);
          return { data: college };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["college"],
    }),
    updateCollege: build.mutation({
      queryFn: async ({ collegeId, updatedData }) => {
        try {
          const college = await collegeService.updateCollege(
            collegeId,
            updatedData
          );
          return { data: college };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["college"],
    }),
    deleteCollege: build.mutation({
      queryFn: async (collegeId) => {
        try {
          await collegeService.deleteCollege(collegeId);
          return { data: { success: true } };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["college"],
    }),
    listColleges: build.query({
      queryFn: async (queries) => {
        try {
          const colleges = await collegeService.listColleges(queries);
          return { data: colleges };
        } catch (error) {
          return { error };
        }
      },
      providesTags: ["college"],
    }),
  }),
});

export const {
  useGetCollegeQuery,
  useCreateCollegeMutation,
  useUpdateCollegeMutation,
  useDeleteCollegeMutation,
  useListCollegesQuery,
} = collegeApi;
