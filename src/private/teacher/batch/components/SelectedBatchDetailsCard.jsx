import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  CheckCircle2,
  XCircle,
  Building2,
  Award,
  ShieldCheck,
  ClipboardList,
  ChevronRight,
  Layers
} from "lucide-react";
import { getCurrentSession, formatSessionLabel } from "../util/batchSessionUtil";

const SelectedBatchDetailsCard = ({
  batchData,
  collegeData,
  tradeData,
  studentCount = 0,
  onEditClick,
  className = ""
}) => {
  const navigate = useNavigate();

  if (!batchData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Batch Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a batch to view its details.</p>
      </div>
    );
  }

  // Parse JSON properties safely
  let locationObj = null;
  try {
    locationObj = typeof batchData.location === "string" ? JSON.parse(batchData.location) : batchData.location;
  } catch (e) {
    locationObj = null;
  }

  let attendanceTimeObj = null;
  try {
    attendanceTimeObj = typeof batchData.attendanceTime === "string" ? JSON.parse(batchData.attendanceTime) : batchData.attendanceTime;
  } catch (e) {
    attendanceTimeObj = null;
  }

  let sessionsArr = [];
  try {
    sessionsArr = typeof batchData.sessions === "string" ? JSON.parse(batchData.sessions) : batchData.sessions;
    if (!Array.isArray(sessionsArr)) sessionsArr = [];
  } catch (e) {
    sessionsArr = [];
  }

  const currentSession = getCurrentSession(batchData);
  const sessionLabel = currentSession ? formatSessionLabel(currentSession) : "";

  const handleEdit = () => {
    if (onEditClick) {
      onEditClick(batchData.$id);
    } else {
      navigate(`/batches/${batchData.$id}/settings`);
    }
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Header Banner Card */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                batchData.isActive !== false
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${batchData.isActive !== false ? "bg-emerald-500" : "bg-rose-500"}`} />
                {batchData.isActive !== false ? "Active Batch" : "Inactive / Archived"}
              </span>

              {sessionLabel && (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Clock className="h-3.5 w-3.5" />
                  {sessionLabel}
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {batchData.BatchName || "Batch Details"}
            </h2>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              <span>Teacher: <strong className="font-medium text-slate-800 dark:text-slate-200">{batchData.teacherName || "Instructor"}</strong></span>
              {batchData.$id && <span className="text-slate-300 dark:text-slate-600">•</span>}
              {batchData.$id && <span className="font-mono text-xs">ID: {batchData.$id}</span>}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={handleEdit}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Edit className="h-4 w-4" />
              Edit Batch
            </button>

            <button
              onClick={() => navigate(`/batches/${batchData.$id}/students`)}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Users className="w-4 h-4" />
              Students ({studentCount})
            </button>

            <button
              onClick={() => navigate("/attendance/register")}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ClipboardList className="h-4 w-4" />
              Attendance
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Quick Metrics Cards */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Trade Info */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trade / Sector</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                {tradeData?.tradeName || batchData.tradeName || "Trade Details"}
              </p>
              {tradeData?.tradeCode && (
                <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {tradeData.tradeCode}
                </span>
              )}
            </div>
          </div>

          {/* College / Institution */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Institution</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                {collegeData?.collegeName || batchData.collegeName || "College Details"}
              </p>
              {collegeData?.city && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{collegeData.city}</p>
              )}
            </div>
          </div>

          {/* Academic Timeline */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Duration</p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                {batchData.start_date ? batchData.start_date.split("T")[0] : "N/A"} → {batchData.end_date ? batchData.end_date.split("T")[0] : "N/A"}
              </p>
            </div>
          </div>

          {/* Enrolled Roster */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Enrolled Roster</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {studentCount} <span className="text-xs font-bold text-slate-500">Students</span>
              </p>
            </div>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────────────────── */}
        {/* Attendance & Location Settings */}
        {/* ───────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Attendance Rules Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Attendance & Marking Policy</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Student Self-Marking</span>
                <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-lg ${
                  batchData.canMarkAttendance !== false
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
                }`}>
                  {batchData.canMarkAttendance !== false ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Allowed</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Disabled</>
                  )}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Backdated Marking</span>
                <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-lg ${
                  batchData.canMarkPrevious
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                }`}>
                  {batchData.canMarkPrevious ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Allowed</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Disabled</>
                  )}
                </span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-bold block mb-1">Daily Time Window</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  {attendanceTimeObj?.start && attendanceTimeObj?.end ? (
                    `${attendanceTimeObj.start} to ${attendanceTimeObj.end}`
                  ) : (
                    "Unrestricted (All Day)"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Location & Geofence Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Campus Geofence & Location</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Allowed Radius</span>
                <span className="font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                  {batchData.circleRadius || 1000} Meters
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Coordinates</span>
                {locationObj?.lat && locationObj?.lon ? (
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>Lat: {locationObj.lat}</span>
                    <span>Lon: {locationObj.lon}</span>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No GPS location set</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────────────────── */}
        {/* Academic Sessions Timeline */}
        {/* ───────────────────────────────────────────────────────────────────────── */}
        {sessionsArr.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Configured Sessions & Academic Terms</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{sessionsArr.length} Session(s)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sessionsArr.map((sess, idx) => {
                const isCurrent = currentSession?.id === sess.id || (sess.startDate && sess.endDate && new Date() >= new Date(sess.startDate) && new Date() <= new Date(sess.endDate));
                return (
                  <div
                    key={sess.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-300 dark:border-blue-700 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {sess.name || `Session ${idx + 1}`}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                          Active Term
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {sess.startDate ? sess.startDate.split("T")[0] : "N/A"} → {sess.endDate ? sess.endDate.split("T")[0] : "N/A"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SelectedBatchDetailsCard;
