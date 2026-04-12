import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Query } from 'appwrite';
import batchRequestService from '@/appwrite/batchRequestService';
import batchService from '@/appwrite/batchService';
import batchStudentService from '@/appwrite/batchStudentService';

export const initializeActiveBatch = createAsyncThunk(
  'activeBatch/initialize',
  async (userProfile, { rejectWithValue }) => {
    if (!userProfile?.$id) return rejectWithValue("No profile");

    try {
      const isTeacher = userProfile.role?.includes("Teacher");
      const userId = userProfile.userId || userProfile.$id;
      let userBatches = [];
      let activeBatchId = null;

      // 1. Fetch relevant batches depending on user role
      if (isTeacher) {
        const response = await batchService.listBatches([
          Query.equal("teacherId", userId),
          Query.orderDesc("$createdAt")
        ]);
        userBatches = response.documents || [];
      } else {
        // Student logic: fetch actual enrollments as the reliable source of truth
        const studentBatches = await batchStudentService.getStudentBatches(userId);
        
        if (studentBatches.length > 0) {
          const batchIds = studentBatches.map(sb => sb.batchId?.$id || sb.batchId);
          const uniqueBatchIds = [...new Set(batchIds)];
          
          userBatches = await batchService.getBatchesByIds(uniqueBatchIds);
          
          // Optionally grab requests to map `isCurrentBatch` and `_requestId`
          const requests = await batchRequestService.getStudentRequests(userId);
          const approvedRequests = requests.filter(req => req.status === "approved");

          userBatches = userBatches.map(batch => {
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
        const localCacheId = localStorage.getItem(`activeBatch_${userId}`);
        const dbActiveBatch = userBatches.find(b => b.isCurrentBatch);

        // Preference: Database flag -> LocalStorage -> First available
        if (dbActiveBatch) {
          activeBatchId = dbActiveBatch.$id;
        } else if (localCacheId && userBatches.some(b => b.$id === localCacheId)) {
          activeBatchId = localCacheId;
        } else {
          activeBatchId = userBatches[0].$id;
        }

        // Keep local cache synced
        localStorage.setItem(`activeBatch_${userId}`, activeBatchId);
      }

      // 3. Fetch detailed active batch data
      let activeBatchData = null;
      if (activeBatchId) {
        activeBatchData = await batchService.getBatch(activeBatchId);
      }

      return {
        userBatches,
        activeBatchId,
        activeBatchData,
        isTeacher
      };
    } catch (e) {
      console.error("Initialize Active Batch Error:", e);
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
    isLoading: true,
    error: null,
  },
  reducers: {
    clearActiveBatch: (state) => {
      state.activeBatchId = null;
      state.activeBatchData = null;
      state.userBatches = [];
      state.isLoading = false;
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
        state.userBatches = action.payload.userBatches;
        state.activeBatchId = action.payload.activeBatchId;
        state.activeBatchData = action.payload.activeBatchData;
      })
      .addCase(initializeActiveBatch.rejected, (state, action) => {
        state.isLoading = false;
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

export const { clearActiveBatch } = activeBatchSlice.actions;

// Selectors
export const selectActiveBatchId = (state) => state.activeBatch.activeBatchId;
export const selectActiveBatchData = (state) => state.activeBatch.activeBatchData;
export const selectUserBatches = (state) => state.activeBatch.userBatches;
export const selectActiveBatchLoading = (state) => state.activeBatch.isLoading;

export default activeBatchSlice.reducer;
