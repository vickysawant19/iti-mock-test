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
  Eye,
  Trash2,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  User,
  Phone,
  Mail,
  Hash,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
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
import { Query } from "appwrite";

// ─── Pre-Approval Modal ───────────────────────────────────────────────────────
function ApprovalReviewModal({
  isOpen,
  onClose,
  student,
  profile,
  isFetchingProfile,
  batchStartDate,
  onConfirmApprove,
  isApproving,
}) {
  const defaultDate = batchStartDate
    ? format(new Date(batchStartDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const [enrollmentDate, setEnrollmentDate] = useState(defaultDate);
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEnrollmentDate(defaultDate);
      setStatus("active");
      setErrors({});
    }
  }, [isOpen, defaultDate]);

  const validate = () => {
    const e = {};
    if (!enrollmentDate) e.enrollmentDate = "Enrollment date is required";
    if (!status) e.status = "Status is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirmApprove({ enrollmentDate, status });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-lg leading-tight">Review Before Approving</h2>
              <p className="text-blue-200 text-sm">Verify student profile and set enrollment details</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Student Identity Card */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
            <InteractiveAvatar
              src={student?.profileImage}
              fallbackText={student?.userName?.charAt(0) || "S"}
              userId={student?.userId}
              editable={false}
              className="w-14 h-14 rounded-full border-2 border-white shadow-md flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="font-bold text-base text-gray-900 dark:text-white truncate">
                {student?.userName || "Unknown Student"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{student?.email}</div>
            </div>
          </div>

          {/* Profile Details */}
          {isFetchingProfile ? (
            <div className="flex items-center justify-center py-8 gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm">Loading profile...</span>
            </div>
          ) : profile ? (
            <div className="grid grid-cols-2 gap-3">
              <ProfileField icon={User} label="Full Name" value={profile.userName} />
              <ProfileField icon={Hash} label="Student ID" value={profile.studentId} />
              <ProfileField icon={Phone} label="Phone" value={profile.phone} />
              <ProfileField icon={Mail} label="Email" value={profile.email} />
              {profile.DOB && (
                <ProfileField icon={CalendarDays} label="Date of Birth" value={profile.DOB} />
              )}
              {profile.address && (
                <ProfileField icon={null} label="Address" value={profile.address} className="col-span-2" />
              )}
              {/* Profile completeness badge */}
              <div className="col-span-2">
                {profile.isProfileComplete ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Profile Complete
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full w-fit dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Profile Incomplete
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
              Could not fetch profile details. You can still set enrollment info below.
            </div>
          )}

          {/* ── Required Enrollment Fields ── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              Enrollment Details <span className="text-rose-500 text-xs">(Required)</span>
            </h3>

            {/* Enrollment Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Enrollment Date <span className="text-rose-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(defaults to batch start date)</span>
              </label>
              <input
                type="date"
                value={enrollmentDate}
                onChange={(e) => {
                  setEnrollmentDate(e.target.value);
                  if (errors.enrollmentDate) setErrors((p) => ({ ...p, enrollmentDate: null }));
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.enrollmentDate
                    ? "border-rose-400 ring-1 ring-rose-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.enrollmentDate && (
                <p className="text-rose-500 text-xs mt-1">{errors.enrollmentDate}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Enrollment Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (errors.status) setErrors((p) => ({ ...p, status: null }));
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.status
                    ? "border-rose-400 ring-1 ring-rose-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="completed">Completed</option>
              </select>
              {errors.status && (
                <p className="text-rose-500 text-xs mt-1">{errors.status}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            disabled={isApproving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isApproving || isFetchingProfile}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isApproving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Approve Student</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small helper component for profile fields
function ProfileField({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`${className} bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon className="w-3 h-3 text-gray-400" />}
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
        {value || <span className="text-gray-400 italic text-xs">Not set</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManageStudentsList({ selectedBatch, batchData }) {
  const user = useSelector(selectUser);
  const teacherId = user?.$id;

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [viewProfileUserId, setViewProfileUserId] = useState(null);

  // ── Approval Review Modal state ──
  const [approvalModal, setApprovalModal] = useState(null); // { student }
  const [approvalProfile, setApprovalProfile] = useState(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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

      const uniqueIds = Array.from(studentIds);
      if (uniqueIds.length === 0) {
        setStudents([]);
        return;
      }

      // 4. Fetch full profiles ONLY for the collected relevant IDs
      const profileMap = {};
      if (uniqueIds.length > 0) {
        const profiles = await userProfileService.getBatchUserProfile([
          Query.equal("userId", uniqueIds),
          Query.limit(100),
        ]);

        profiles.forEach((p) => {
          profileMap[p.userId] = p;
        });
      }

      // 5. Map everything correctly
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

  // ── Open the approval review modal ──
  const openApprovalModal = async (student) => {
    setApprovalModal({ student });
    setApprovalProfile(null);
    setIsFetchingProfile(true);
    try {
      const profile = await userProfileService.getUserProfile(student.userId);
      setApprovalProfile(profile || null);
    } catch {
      setApprovalProfile(null);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // ── Confirm approval: patch profile then call approveRequest ──
  const handleConfirmApprove = async ({ enrollmentDate, status }) => {
    if (!approvalModal?.student) return;
    const student = approvalModal.student;

    setIsApproving(true);
    try {
      // 1. Patch the student profile with enrollment details
      if (approvalProfile?.$id) {
        await userProfileService.patchUserProfile(approvalProfile.$id, {
          enrolledAt: new Date(enrollmentDate).toISOString(),
          status,
        });
      }

      // 2. Approve the request
      await batchRequestService.approveRequest(
        student.requestId,
        selectedBatch,
        student.userId,
      );

      toast.success(`${student.userName} approved successfully!`);
      setApprovalModal(null);
      await fetchList();
    } catch (err) {
      console.error("Approval error:", err);
      toast.error("Failed to approve student. Please try again.");
    } finally {
      setIsApproving(false);
    }
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
        try {
          const studentProfile = await userProfileService.getUserProfile(student.userId);
          if (studentProfile && studentProfile.$id) {
            await userProfileService.patchUserProfile(studentProfile.$id, { batchId: null });
          }
        } catch (profileErr) {
          console.warn("Could not clear batchId from student profile:", profileErr);
        }
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
    <>
      {/* ── Pre-Approval Review Modal ── */}
      <ApprovalReviewModal
        isOpen={!!approvalModal}
        onClose={() => !isApproving && setApprovalModal(null)}
        student={approvalModal?.student}
        profile={approvalProfile}
        isFetchingProfile={isFetchingProfile}
        batchStartDate={batchData?.start_date}
        onConfirmApprove={handleConfirmApprove}
        isApproving={isApproving}
      />

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
                    <span className="text-xs mt-2 block">Loading students...</span>
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
                              onClick={() => handleAction("direct-assign", student)}
                              className="border border-blue-600 text-blue-600 px-2 py-1 text-xs rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                            >
                              Assign Direct
                            </button>
                          </>
                        )}
                        {student.status === "pending" && (
                          <>
                            {/* Approve → opens pre-approval review modal */}
                            <button
                              disabled={processingId === student.userId}
                              onClick={() => openApprovalModal(student)}
                              className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {processingId === student.userId ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Approve
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
                              <Eye className="w-4 h-4 cursor-pointer" title="View/Edit Profile" />
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

        {/* View/Edit Profile Modal */}
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
                    setStudents((prev) =>
                      prev.map((s) => {
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
                      }),
                    );
                  }}
                  onCancel={() => setViewProfileUserId(null)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
