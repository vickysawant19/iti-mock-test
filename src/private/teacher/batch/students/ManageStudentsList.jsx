import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Loader2,
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  Users,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { selectUser } from "@/store/userSlice";
import batchRequestService from "@/appwrite/batchRequestService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmbeddedProfileForm from "@/private/profile/EmbeddedProfileForm";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import batchStudentService from "@/appwrite/batchStudentService";
import userProfileService from "@/appwrite/userProfileService";
import conf from "@/config/config";
import { Query } from "appwrite";

export default function ManageStudentsList({ selectedBatch }) {
  const user = useSelector(selectUser);
  const teacherId = user?.$id;

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [viewProfileUserId, setViewProfileUserId] = useState(null);

  const fetchList = async () => {
    if (!selectedBatch) {
      setStudents([]);
      return;
    }
    setIsLoading(true);
    try {
      // 1. Fetch existing requests for this batch
      const requests = await batchRequestService.getRequests(selectedBatch);
      const requestMap = {};
      requests.forEach((r) => {
        requestMap[r.studentId] = r;
      });

      // 2. Fetch active students in this batch
      const activeStudents =
        await batchStudentService.getBatchStudents(selectedBatch);
      const activeSet = new Set(activeStudents.map((s) => s.studentId));

      // 3. Collect unique student IDs from requests and active
      const studentIds = new Set();
      requests.forEach((r) => studentIds.add(r.studentId));
      activeStudents.forEach((s) => studentIds.add(s.studentId));

      // 4. Also fetch profiles directly tied to this batchId, and cache them immediately
      const targetProfiles =
        await userProfileService.getProfilesByBatchId(selectedBatch);
      
      const profileMap = {};
      targetProfiles.forEach((p) => {
        profileMap[p.userId] = p; // populate profileMap directly
        
        const roles = Array.isArray(p.role) ? p.role : [p.role];
        const hasStudentRole = roles.some(
          (role) => String(role || "").toLowerCase() === "student",
        );
        const isTeacherProfile = p.userId === teacherId;

        if (hasStudentRole && !isTeacherProfile) {
          studentIds.add(p.userId);
        }
      });

      const uniqueIds = Array.from(studentIds);
      if (uniqueIds.length === 0) {
        setStudents([]);
        return;
      }

      // 5. Fetch full profiles ONLY for missing IDs
      const missingIds = uniqueIds.filter(id => !profileMap[id]);
      if (missingIds.length > 0) {
        const profilesRes = await userProfileService.database.listDocuments(
          conf.databaseId,
          conf.userProfilesCollectionId,
          [Query.equal("userId", missingIds), Query.limit(100)],
        );

        profilesRes.documents.forEach((p) => {
          profileMap[p.userId] = p;
        });
      }

      // 6. Map everything correctly
      const list = uniqueIds.map((id) => {
        const profile = profileMap[id] || {};
        const req = requestMap[id];
        const isActive = activeSet.has(id);

        let status = "unrequested";
        let requestId = req ? req.$id : null;

        if (isActive) {
          status = "approved";
        } else if (req) {
          status = req.status; // pending, rejected, or approved
        }

        return {
          userId: id,
          profileId: profile.$id,
          userName: profile.userName || "Unknown",
          email: profile.email || "No email",
          phone: profile.phone || "No phone",
          profileImage: profile.profileImage || null,
          status,
          requestId,
        };
      });

      setStudents(list);
    } catch (err) {
      console.error("Error fetching student list:", err);
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [selectedBatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchList();
    setIsRefreshing(false);
  };

  const handleAction = async (action, student) => {
    setProcessingId(student.userId);
    try {
      if (action === "request") {
        await batchRequestService.sendRequest(
          selectedBatch,
          student.userId,
          "teacher",
        );
        toast.success("Request sent on behalf of student.");
      } else if (action === "approve") {
        await batchRequestService.approveRequest(
          student.requestId,
          selectedBatch,
          student.userId,
        );
        toast.success("Request approved.");
      } else if (action === "reject") {
        await batchRequestService.rejectRequest(student.requestId);
        toast.success("Request rejected.");
      } else if (action === "re-request") {
        await batchRequestService.updateRequestStatus(
          student.requestId,
          "pending",
        );
        toast.success("Request sent again.");
      } else if (action === "direct-assign") {
        await batchRequestService.assignStudentDirectly(
          student.userId,
          selectedBatch,
        );
        toast.success("Student assigned directly.");
      } else if (action === "revoke") {
        await batchRequestService.revokeStudent(
          selectedBatch,
          student.userId,
          student.requestId,
        );
        toast.info("Student approval revoked.");
      } else if (action === "delete") {
        await batchRequestService.deleteRequest(student.requestId);
        toast.success("Rejected request deleted successfully.");
      }
      await fetchList();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to perform action: ${action}`);
    } finally {
      setProcessingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = {
      all: students.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      unrequested: 0,
    };
    students.forEach((s) => {
      if (c[s.status] !== undefined) {
        c[s.status]++;
      }
    });
    return c;
  }, [students]);

  const displayed = useMemo(() => {
    let list = students;
    if (filter !== "all") {
      list = list.filter((s) => s.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.userName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [students, search, filter]);

  if (!selectedBatch) {
    return (
      <div className="py-12 text-center text-slate-500 bg-white shadow-sm rounded-md dark:bg-gray-800">
        Please select a batch to view students.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected", "unrequested"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded-full capitalize transition-colors ${
                  filter === f
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {f}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            ),
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-md border border-gray-200 focus:outline-none focus:border-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center h-8 px-2 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-y border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  <div className="flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  </div>
                  <span className="text-xs mt-2 block">
                    Loading students...
                  </span>
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  <Users className="w-8 h-8 mx-auto text-gray-300 mb-2 dark:text-gray-600" />
                  No students found.
                </td>
              </tr>
            ) : (
              displayed.map((student) => (
                <tr
                  key={student.userId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <InteractiveAvatar
                        src={student.profileImage}
                        fallbackText={student.userName?.charAt(0) || "U"}
                        userId={student.userId}
                        editable={false}
                        className="w-8 h-8 text-xs rounded-full border border-gray-100 shadow-sm"
                      />
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {student.userName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{student.email}</div>
                    <div className="text-gray-400">{student.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        student.status === "approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : student.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : student.status === "rejected"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {student.status === "unrequested" && (
                        <>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => handleAction("request", student)}
                            className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Request
                          </button>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() =>
                              handleAction("direct-assign", student)
                            }
                            className="border border-blue-600 text-blue-600 px-2 py-1 text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                          >
                            Assign Direct
                          </button>
                        </>
                      )}
                      {student.status === "pending" && (
                        <>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => handleAction("approve", student)}
                            className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => handleAction("reject", student)}
                            className="border border-red-600 text-red-600 px-2 py-1 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      {student.status === "rejected" && (
                        <>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => handleAction("re-request", student)}
                            className="bg-gray-600 text-white px-2 py-1 text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                          >
                            Re-request
                          </button>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => handleAction("delete", student)}
                            className="border border-red-600 text-red-600 px-2 py-1 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 flex items-center gap-1"
                            title="Delete Request"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </>
                      )}
                      {student.status === "approved" && (
                        <>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => setViewProfileUserId(student.userId)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 flex items-center transition-colors"
                          >
                            <Eye
                              className="w-4 h-4 cursor-pointer"
                              title="View/Edit Profile"
                            />
                          </button>
                          <button
                            disabled={processingId === student.userId}
                            onClick={() => handleAction("revoke", student)}
                            className="border border-red-600 text-red-600 px-2 py-1 text-xs rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 flex items-center gap-1"
                            title="Revoke and Reject Request"
                          >
                            <XCircle className="w-3 h-3" /> Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!viewProfileUserId}
        onOpenChange={(open) => {
          if (!open) setViewProfileUserId(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full p-0 gap-0">
          <DialogHeader className="p-6 pb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-20 dark:bg-gray-900/95 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="text-xl">Student Profile</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {viewProfileUserId && (
              <EmbeddedProfileForm
                explicitUserId={viewProfileUserId}
                defaultBatchId={selectedBatch}
                onSuccess={(updatedProfile) => {
                  setViewProfileUserId(null);
                  setStudents(prev => prev.map(s => {
                    if (s.userId === updatedProfile.userId) {
                      return {
                        ...s,
                        userName: updatedProfile.userName || "Unknown",
                        email: updatedProfile.email || "No email",
                        phone: updatedProfile.phone || "No phone",
                        profileImage: updatedProfile.profileImage || null,
                      };
                    }
                    return s;
                  }));
                }}
                onCancel={() => setViewProfileUserId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
