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
  Sparkles,
  ExternalLink,
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
      navigate(`/manage-batch/edit/${batchData.$id}`);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden ${className}`}>
      
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Header Banner Card */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 p-6 sm:p-8 text-white">
        {/* Background glow orbs */}
        <div className="absolute top-[-80px] right-[-50px] w-[260px] h-[260px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-30px] w-[200px] h-[200px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${
                batchData.isActive !== false
                  ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 backdrop-blur-md"
                  : "bg-rose-400/20 text-rose-200 border border-rose-400/40 backdrop-blur-md"
              }`}>
                <span className={`w-2 h-2 rounded-full ${batchData.isActive !== false ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                {batchData.isActive !== false ? "Active Batch" : "Inactive / Archived"}
              </span>

              {sessionLabel && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  {sessionLabel}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {batchData.BatchName || "Batch Details"}
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 font-medium flex items-center gap-2 flex-wrap">
              <span>Teacher: <strong className="text-white">{batchData.teacherName || "Instructor"}</strong></span>
              {batchData.$id && <span className="opacity-40">•</span>}
              {batchData.$id && <span className="font-mono text-xs opacity-75">ID: {batchData.$id}</span>}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleEdit}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 active:scale-95 text-indigo-700 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-white"
            >
              <Edit className="w-4 h-4 text-indigo-600" />
              Edit Batch
            </button>

            <button
              onClick={() => navigate("/manage-batch/students")}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-white/25 backdrop-blur-md"
            >
              <Users className="w-4 h-4" />
              Students ({studentCount})
            </button>

            <button
              onClick={() => navigate("/attendance/register")}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-300"
            >
              <ClipboardList className="w-4 h-4 text-amber-950" />
              Register
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Quick Metrics Cards */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Trade Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
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
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
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
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
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
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
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
