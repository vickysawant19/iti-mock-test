import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Query } from 'appwrite';
import batchRequestService from '@/services/batch/batchRequestService';
import batchService from '@/services/batch/batchService';
import batchStudentService from '@/services/batch/batchStudentService';

export const initializeActiveBatch = createAsyncThunk(
  'activeBatch/initialize',
  async (userProfile, { getState, rejectWithValue }) => {
    if (!userProfile?.$id && !userProfile?.userId) {
      return rejectWithValue("No profile");
    }

    try {
      const state = getState();
      const isTeacher = userProfile.role?.includes("Teacher") || state.user?.data?.labels?.includes("Teacher");
      const targetUserId = userProfile.userId || state.user?.data?.$id || userProfile.$id;

      let userBatches = [];
      let studentRequests = [];
      let activeBatchId = null;

      // 1. Fetch relevant batches depending on user role
      if (isTeacher) {
        const response = await batchService.listBatches([
          Query.equal("teacherId", targetUserId),
          Query.orderDesc("$createdAt")
        ]);
        userBatches = response.documents || response.rows || [];
      } else {
        // Fetch student enrollments from batchStudents collection
        let studentBatches = [];
        try {
          studentBatches = await batchStudentService.getStudentBatches(targetUserId);
        } catch (err) {
          console.warn("Error fetching studentBatches:", err);
        }

        // Fetch student requests from batchRequests collection
        try {
          studentRequests = await batchRequestService.getStudentRequests(targetUserId);
        } catch (err) {
          console.warn("Error fetching studentRequests:", err);
        }

        const approvedRequests = (studentRequests || []).filter(req => req.status === "approved");

        // Extract batch IDs safely from studentBatches
        const enrolledBatchIds = (studentBatches || [])
          .map(sb => {
            if (!sb) return null;
            if (typeof sb.batchId === "object" && sb.batchId?.$id) return sb.batchId.$id;
            if (typeof sb.batchId === "string") return sb.batchId;
            return null;
          })
          .filter(Boolean);

        // Extract batch IDs safely from approved requests
        const approvedReqBatchIds = approvedRequests
          .map(req => {
            if (!req) return null;
            if (typeof req.batchId === "object" && req.batchId?.$id) return req.batchId.$id;
            if (typeof req.batchId === "string") return req.batchId;
            return null;
          })
          .filter(Boolean);

        // Combine all unique valid batch IDs
        const uniqueBatchIds = [...new Set([...enrolledBatchIds, ...approvedReqBatchIds])];

        if (uniqueBatchIds.length > 0) {
          const fetchedBatches = await batchService.getBatchesByIds(uniqueBatchIds);

          userBatches = (fetchedBatches || []).map(batch => {
            const relatedReq = approvedRequests.find(req => req.batchId === batch.$id);
            return {
              ...batch,
              isCurrentBatch: relatedReq?.isCurrentBatch || false,
              _requestId: relatedReq?.$id
            };
          });
        }
      }

      // 2. Resolve Active Batch ID
      if (userBatches.length > 0) {
        const localCacheId = localStorage.getItem(`activeBatch_${targetUserId}`);
        const activeOnlyBatches = userBatches.filter(b => b.isActive !== false);
        const candidateBatches = activeOnlyBatches.length > 0 ? activeOnlyBatches : userBatches;

        const dbActiveBatch = candidateBatches.find(b => b.isCurrentBatch);

        // Preference: Database flag -> LocalStorage -> First available active batch
        if (dbActiveBatch) {
          activeBatchId = dbActiveBatch.$id;
        } else if (localCacheId && candidateBatches.some(b => b.$id === localCacheId)) {
          activeBatchId = localCacheId;
        } else {
          activeBatchId = candidateBatches[0].$id;
        }

        // Keep local cache synced
        localStorage.setItem(`activeBatch_${targetUserId}`, activeBatchId);
      }

      // 3. Fetch detailed active batch data
      let activeBatchData = null;
      if (activeBatchId) {
        activeBatchData = await batchService.getBatch(activeBatchId);
      }

      // 4. Persist batch status, active batch, and completion flag locally for notifications & zero-delay UI
      try {
        if (userBatches.length > 0) {
          localStorage.setItem(`setup_completed_${targetUserId}`, "true");
          localStorage.setItem(`student_joined_batch_${targetUserId}`, "true");
          localStorage.setItem(
            `user_batches_${targetUserId}`,
            JSON.stringify(
              userBatches.map((b) => ({
                $id: b.$id,
                name: b.BatchName || b.batchName || b.name,
                attendanceTime: b.attendanceTime,
              }))
            )
          );
        }
      } catch (storageErr) {
        console.warn("[activeBatchSlice] Local storage sync error:", storageErr);
      }

      return {
        userBatches,
        studentRequests,
        activeBatchId,
        activeBatchData,
        isTeacher
      };
    } catch (e) {
      console.error("[activeBatchSlice] Initialize Active Batch Error:", e);
      return rejectWithValue(e.message);
    }
  }
);

export const setActiveBatch = createAsyncThunk(
  'activeBatch/setActive',
  async ({ batchId, userId, isTeacher, currentBatches = [] }, { dispatch, rejectWithValue }) => {
    try {
      // 1. Sync Local Cache
      localStorage.setItem(`activeBatch_${userId}`, batchId);

      // 2. Fetch full new active batch data to populate store immediately
      const newActiveBatchData = await batchService.getBatch(batchId);

      // 3. Fire and forget DB update (Optimistic UI approach)
      try {
        if (isTeacher) {
          // Loop and patch the batches collection natively
          for (const batch of currentBatches) {
             const wantActive = batch.$id === batchId;
             if (batch.isCurrentBatch !== wantActive) {
               await batchService.updateBatch(batch.$id, { isCurrentBatch: wantActive });
             }
          }
        } else {
          // Loop and patch batchRequests collection
          for (const batch of currentBatches) {
             const wantActive = batch.$id === batchId;
             if (batch._requestId && Boolean(batch.isCurrentBatch) !== wantActive) {
               // Update request
               await batchRequestService.updateRequestStatus(batch._requestId, batch.status, wantActive);
             }
          }
        }
      } catch (dbErr) {
         console.warn("Failed to persist isCurrentBatch to DB, fallback to localStorage working:", dbErr);
      }
      
      return { activeBatchId: batchId, activeBatchData: newActiveBatchData };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const activeBatchSlice = createSlice({
  name: 'activeBatch',
  initialState: {
    activeBatchId: null,
    activeBatchData: null,
    userBatches: [],
    studentRequests: [],
    isLoading: true,
    isInitialized: false,
    error: null,
  },
  reducers: {
    upsertStudentRequest: (state, action) => {
      const request = action.payload;
      if (!request?.$id) return;
      const requestIndex = state.studentRequests.findIndex((item) => item.$id === request.$id);
      if (requestIndex >= 0) {
        state.studentRequests[requestIndex] = request;
      } else {
        state.studentRequests.push(request);
      }
    },
    removeStudentRequest: (state, action) => {
      state.studentRequests = state.studentRequests.filter((request) => request.$id !== action.payload);
    },
    clearActiveBatch: (state) => {
      state.activeBatchId = null;
      state.activeBatchData = null;
      state.userBatches = [];
      state.studentRequests = [];
      state.isLoading = false;
      state.isInitialized = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize cases
      .addCase(initializeActiveBatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeActiveBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.userBatches = action.payload.userBatches;
        state.studentRequests = action.payload.studentRequests || [];
        state.activeBatchId = action.payload.activeBatchId;
        state.activeBatchData = action.payload.activeBatchData;
      })
      .addCase(initializeActiveBatch.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload;
      })
      // Set Active Branch cases
      .addCase(setActiveBatch.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(setActiveBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeBatchId = action.payload.activeBatchId;
        state.activeBatchData = action.payload.activeBatchData;
        
        // Note: we also update the isCurrentBatch flag within the userBatches list
        // so it reflects accurately in dropdowns without re-fetching.
        state.userBatches = state.userBatches.map(b => ({
            ...b,
            isCurrentBatch: b.$id === action.payload.activeBatchId
        }));
      })
      .addCase(setActiveBatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearActiveBatch, upsertStudentRequest, removeStudentRequest } = activeBatchSlice.actions;

// Selectors
export const selectActiveBatchId = (state) => state.activeBatch.activeBatchId;
export const selectActiveBatchData = (state) => state.activeBatch.activeBatchData;
export const selectActiveBatch = (state) => state.activeBatch.activeBatchData;
export const selectUserBatches = (state) => state.activeBatch.userBatches;
export const selectActiveBatchLoading = (state) => state.activeBatch.isLoading;
export const selectActiveBatchInitialized = (state) => state.activeBatch.isInitialized;

export default activeBatchSlice.reducer;
