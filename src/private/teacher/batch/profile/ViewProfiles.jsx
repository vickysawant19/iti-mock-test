import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectProfile } from "@/store/profileSlice";
import { format } from "date-fns";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import {
  Eye,
  Edit3,
  Phone,
  Calendar,
  IdCard,
  UserCircle2,
  Search,
  Users2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmbeddedProfileForm from "@/private/profile/EmbeddedProfileForm";
import EditEnrollmentTab from "../students/EditEnrollmentTab";

const ViewProfiles = ({ students, batchId }) => {
  const profile = useSelector(selectProfile);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewProfileUserId, setViewProfileUserId] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState("profile");

  if (!students || !students.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Users2 className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          No Students Found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
          There are no students enrolled in this batch yet.
        </p>
      </div>
    );
  }

  // Filter out the current user's profile and apply search
  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => student.userId !== profile.userId)
      .filter((student) => {
        const q = searchTerm.toLowerCase();
        return (
          student.userName?.toLowerCase().includes(q) ||
          student.studentId?.toLowerCase().includes(q) ||
          student.registerId?.toLowerCase().includes(q) ||
          student.email?.toLowerCase().includes(q)
        );
      });
  }, [students, profile.userId, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search Header for Profiles Tab */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Student Profiles
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
              {filteredStudents.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Manage and view detailed student information
          </p>
        </div>

        <div className="relative group max-w-md w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, Roll No, Reg ID or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {filteredStudents.map((student, index) => (
          <div
            key={student.userId || index}
            className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col"
          >
            {/* Top Section: Profile Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <InteractiveAvatar
                  src={student.profileImage}
                  fallbackText={student.userName?.charAt(0) || "U"}
                  userId={student.userId}
                  editable={false}
                  className="w-20 h-20 rounded-2xl ring-4 ring-gray-50 dark:ring-gray-800 shadow-lg text-2xl font-black"
                />
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    student.status?.toLowerCase() === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {student.status || "inactive"}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {student.userName}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 min-w-0">
                  {student.email || "No email provided"}
                </p>
              </div>
            </div>

            {/* Middle Section: Metadata Grid */}
            <div className="px-6 py-4 grid grid-cols-1 gap-3 bg-gray-50/50 dark:bg-gray-800/20 border-y border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <IdCard className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
                    Roll Number / ID
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {student.studentId || "PENDING"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <IdCard className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
                    Registration ID
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                    {student.registerId || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <UserCircle2 className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
                    Trade Roles
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                    {Array.isArray(student.role)
                      ? student.role.join(", ")
                      : student.role || "Trainee"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none mb-0.5">
                    Admission Date
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {student.enrolledAt
                      ? format(new Date(student.enrolledAt), "MMM dd, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Section: Actions */}
            <div className="mt-auto p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => setViewProfileUserId(student.userId)}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all active:scale-95 border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                title="View Full Profile"
              >
                <Eye className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Detail
                </span>
              </button>

              <a
                href={`tel:${student.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-all active:scale-95 border border-transparent hover:border-green-100 dark:hover:border-green-800"
                title="Call Student"
              >
                <Phone className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Call
                </span>
              </a>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium italic">
              No students match your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* View/Edit Profile Modal */}
      <Dialog
        open={!!viewProfileUserId}
        onOpenChange={(open) => {
          if (!open) {
            setViewProfileUserId(null);
            setActiveProfileTab("profile");
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full p-0 gap-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-20 dark:bg-gray-900/95 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DialogTitle className="text-xl">Student Management</DialogTitle>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-max shadow-inner">
                <button
                  onClick={() => setActiveProfileTab("profile")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeProfileTab === "profile"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  Profile Details
                </button>
                <button
                  onClick={() => setActiveProfileTab("enrollment")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeProfileTab === "enrollment"
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  Enrollment Record
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6">
            {viewProfileUserId && activeProfileTab === "profile" && (
              <EmbeddedProfileForm
                explicitUserId={viewProfileUserId}
                defaultBatchId={batchId}
                onSuccess={() => {
                  setViewProfileUserId(null);
                  window.location.reload(); // Simple reload to refresh data after edit
                }}
                onCancel={() => setViewProfileUserId(null)}
              />
            )}
            {viewProfileUserId && activeProfileTab === "enrollment" && (
              <EditEnrollmentTab
                batchId={batchId}
                studentId={viewProfileUserId}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewProfiles;
