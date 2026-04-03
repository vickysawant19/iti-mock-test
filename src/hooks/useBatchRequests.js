import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Query } from "appwrite";
import { selectUser } from "@/store/userSlice";
import { selectProfile } from "@/store/profileSlice";
import batchRequestService from "@/appwrite/batchRequestService";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";

/**
 * Provides all batch request operations for both teachers and students.
 *
 * For students:
 *   - sendRequest(batchId)             → send a join request
 *   - fetchStudentRequests()           → get all requests made by this student
 *
 * For teachers:
 *   - fetchTeacherRequests(batchIds)   → get pending requests across batches
 *   - acceptRequest(requestId, batchId, studentId) → approve + add to batchStudents + update student profile
 *   - rejectRequest(requestId)         → reject
 *
 * State:
 *   - requests   : current list of request documents
 *   - isLoading  : loading flag
 *   - pendingCount: number of pending requests (for notification badge)
 */
export function useBatchRequests() {
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Student ──────────────────────────────────────────────────────────────

  const sendRequest = useCallback(
    async (batchId) => {
      if (!user?.$id) throw new Error("Not authenticated.");
      const result = await batchRequestService.sendRequest(batchId, user.$id);
      setRequests((prev) => {
        const filtered = prev.filter((r) => r.batchId !== batchId);
        return [...filtered, result];
      });
      return result;
    },
    [user]
  );

  const fetchStudentRequests = useCallback(async () => {
    if (!user?.$id) return [];
    setIsLoading(true);
    try {
      const data = await batchRequestService.getStudentRequests(user.$id);
      setRequests(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ─── Teacher ──────────────────────────────────────────────────────────────

  const fetchTeacherRequests = useCallback(async (batchIds = []) => {
    if (!batchIds.length) return [];
    setIsLoading(true);
    try {
      const all = await Promise.all(
        batchIds.map((id) => batchRequestService.getRequests(id, "pending"))
      );
      const flat = all.flat();
      setRequests(flat);
      return flat;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (requestId, batchId, studentId) => {
    // 1. Update request status
    await batchRequestService.updateRequestStatus(requestId, "approved");
    // 2. Add student to batchStudents
    await batchStudentService.addStudent(batchId, studentId);
    // 3. Update student's activeBatchId in their profile (non-critical)
    try {
      const profiles = await userProfileService.getBatchUserProfile([
        Query.equal("userId", studentId),
      ]);
      if (profiles?.[0]?.$id) {
        await userProfileService.patchUserProfile(profiles[0].$id, { batchId });
      }
    } catch (_) {}
    // 4. Remove from local state
    setRequests((prev) => prev.filter((r) => r.$id !== requestId));
  }, []);


  const rejectRequest = useCallback(async (requestId) => {
    await batchRequestService.updateRequestStatus(requestId, "rejected");
    setRequests((prev) => prev.filter((r) => r.$id !== requestId));
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return {
    requests,
    isLoading,
    pendingCount,
    sendRequest,
    fetchStudentRequests,
    fetchTeacherRequests,
    acceptRequest,
    rejectRequest,
  };
}
