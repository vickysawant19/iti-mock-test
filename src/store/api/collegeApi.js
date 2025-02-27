import { createApi } from '@reduxjs/toolkit/query/react';
import { CollegeService } from '../../appwrite/collageService';

export const collegeApi = createApi({
  reducerPath: 'collegeApi',
  baseQuery: CollegeService.customCollegeBaseQuery,
  endpoints: (build) => ({
    getCollege: build.query({
      query: (collegeId) => ({
        method: 'GET',
        data: { collegeId },
      }),
    }),
    //TODO:  Add additional endpoints (e.g., create, update, delete) here.
  }),
});


export const { useGetCollegeQuery } = collegeApi;


