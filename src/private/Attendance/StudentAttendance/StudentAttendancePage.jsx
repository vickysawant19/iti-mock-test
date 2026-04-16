import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { format } from "date-fns";
import { useStudentAttendance } from "./hooks/useStudentAttendance";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import AttendanceTable from "./components/AttendanceTable";
import AttendanceCalendar from "./components/AttendanceCalendar";
import { TopStatsRow, RightPanelStats } from "./components/AttendanceStatsSummary";
import { Loader2, Calendar as CalendarIcon, Table as TableIcon, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import useLocationManager from "@/hooks/useLocationManager";
import { avatarFallback } from "@/utils/avatarFallback";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

const StudentAttendancePage = () => {
  const profile = useSelector(selectProfile);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'calendar'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const {
    isLoadingAttendance,
    isLoadingOverallStats,
    batchData,
    tradeData,
    studentAttendance,
    holidays,
    workingDays,
    finalAttendanceRecords,
    attendanceByDate,
    rawAttendanceByDate,
    overallStats,
    monthlyStats,
    currentMonth,
    selectedDate,
    setSelectedDate,
    handleMonthChange,
    markAttendance,
    markBulkBlank,
    isBulkMarking,
    blankDays,
    lastUpdatedDate,
  } = useStudentAttendance(profile);

  // Also getting live location status for the header strip
  const { deviceLocation, locationText, loading: locLoading, calculateDistance } = useLocationManager(false);
  const distance = (!deviceLocation || !batchData?.location) ? Infinity : calculateDistance(
      deviceLocation.lat, deviceLocation.lon, batchData.location.lat, batchData.location.lon
  );
  
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = workingDays?.get(todayStr);
  const modalAttendance = workingDays?.get(modalDate);
  const tableRecords = finalAttendanceRecords || studentAttendance?.attendanceRecords || [];
  // Allow calendar double-click on today as long as marking is enabled — the modal enforces location
  const canOpenTodayMarkModal = Boolean(batchData?.canMarkAttendance);
  // Full location check used by the modal button itself (passed as prop)
  const isInLocationRange =
    Number.isFinite(distance) &&
    distance <= (batchData?.circleRadius || 1000);


  return (
    <div className="min-h-screen bg-[#f0f4ff] dark:bg-slate-950 px-3 py-4 md:px-5 md:py-6 xl:px-8 pb-20 font-sans">
      <div className="w-full max-w-[1700px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 rounded-[22px] p-6 pt-6 pb-4 mb-5 text-white shadow-lg">
          <div className="absolute top-[-80px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/5 blur-sm" />
          <div className="absolute bottom-[-60px] right-[120px] w-[160px] h-[160px] rounded-full bg-white/5 blur-sm" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="flex items-center justify-center flex-shrink-0">
                 <InteractiveAvatar
                    src={profile?.profileImage}
                    fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "S"}
                    userId={profile?.userId}
                    editable={false}
                    className="w-12 h-12 shadow-sm border-2 border-white/30"
                 />
               </div>
               <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Student Portal</div>
                  <h1 className="text-xl font-extrabold leading-tight">My Attendance</h1>
                  <div className="text-xs text-white/80 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{profile?.userName || profile?.name}</span>
                    <span className="opacity-50">·</span>
                    <span>{tradeData?.tradeName ? `${tradeData.tradeName} | ` : ""}{batchData?.BatchName || "N/A"}</span>
                  </div>
               </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!batchData?.canMarkAttendance}
              className="bg-white text-blue-600 font-bold text-sm px-5 py-2.5 rounded-[14px] flex items-center gap-2 shadow-sm hover:-translate-y-0.5 transition-transform active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div className={`w-2 h-2 ${batchData?.canMarkAttendance ? 'bg-emerald-500 animate-pulse shadow-[0_0_0_0_rgba(16,185,129,0.5)]' : 'bg-slate-300'} rounded-full`} />
              Mark Attendance
            </button>
          </div>

          {/* Location Strip */}
          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
               <MapPin className="w-4 h-4 text-emerald-300" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{locLoading ? "Checking Location..." : (isInLocationRange ? "Inside College Area" : "Outside Area")}</div>
                <div className="text-[11px] text-white/70 truncate">{distance === Infinity || locLoading ? locationText || "Locating..." : `${Math.round(distance)}m from institute`}</div>
             </div>
             {todayAttendance?.status === 'present' && (
                <div className="bg-emerald-400/20 border border-emerald-400/40 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0">
                   <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                   Marked Present
                </div>
             )}
          </div>
        </div>


        {/* View Tabs */}
        <div className="flex bg-white dark:bg-slate-900 rounded-[14px] p-1 border border-slate-200 dark:border-slate-800 mb-4 gap-1">
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
              viewMode === "table" ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <TableIcon size={14} /> Table View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
              viewMode === "calendar" ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <CalendarIcon size={14} /> Calendar View
          </button>
        </div>

        {/* Bulk-mark banner — only shown when both marking and past-marking are on, and there are blank days */}
        {!isLoadingAttendance && batchData?.canMarkAttendance && batchData?.canMarkPrevious && blankDays.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 mb-4 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Users size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                <span className="font-extrabold text-blue-600">{blankDays.length}</span> blank day{blankDays.length !== 1 ? "s" : ""} with no record this month
              </span>
            </div>
            <div className="flex gap-2">
              <button
                id="bulk-mark-present-btn"
                disabled={isBulkMarking}
                onClick={() => markBulkBlank("present", "Bulk marked present")}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
              >
                {isBulkMarking ? <Loader2 size={11} className="animate-spin" /> : <span className="text-[13px] leading-none">✓</span>}
                Mark All Present
              </button>
              <button
                id="bulk-mark-absent-btn"
                disabled={isBulkMarking}
                onClick={() => markBulkBlank("absent", "Bulk marked absent")}
                className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
              >
                {isBulkMarking ? <Loader2 size={11} className="animate-spin" /> : <span className="text-[13px] leading-none">✗</span>}
                Mark All Absent
              </button>
            </div>
          </div>
        )}

        {/* Main Grid Split */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          
          {/* Left Column (Table/Calendar) */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                 <h2 className="text-[13px] font-bold text-slate-800 dark:text-white">Attendance Log</h2>
                 <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">{currentMonth}</span>
              </div>
              <div className="p-0">
                {isLoadingAttendance ? (
                  // Calendar skeleton — mirrors full real calendar structure top-to-bottom
                  <div className="p-3 animate-pulse">
                    {/* Month/year picker row skeleton */}
                    <div className="flex items-center justify-between gap-2 mb-3 px-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      <div className="flex gap-2 flex-1 justify-center">
                        <div className="h-8 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="h-8 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    </div>
                    {/* Day-of-week header */}
                    <div className="grid grid-cols-7 mb-1">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                        <div key={d} className="flex justify-center py-1.5">
                          <div className="h-3 w-6 rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                      ))}
                    </div>
                    {/* 5 rows × 7 tiles — height matches real tile height: 72px */}
                    {Array.from({ length: 5 }).map((_, row) => (
                      <div key={row} className="grid grid-cols-7">
                        {Array.from({ length: 7 }).map((_, col) => (
                          <div
                            key={col}
                            className="border border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800/60"
                            style={{ height: 72 }}
                          />
                        ))}
                      </div>
                    ))}
                    {/* Legend row — matches real calendar: mt-4, colored dots + labels */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {[
                        { color: "bg-emerald-500", label: "Present" },
                        { color: "bg-rose-500",    label: "Absent" },
                        { color: "bg-violet-500",  label: "Leave" },
                        { color: "bg-amber-400",   label: "Holiday" },
                      ].map(({ color, label }) => (
                        <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <span className={`h-2.5 w-2.5 rounded-full ${color} opacity-40`} />
                          {label}
                        </span>
                      ))}
                    </div>
                    {/* "Click a date…" hint placeholder — matches real calendar: mt-3, text-xs */}
                    <div className="mt-3 h-3 w-56 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ) : viewMode === "table" ? (
                  <AttendanceTable attendanceRecords={tableRecords} holidays={holidays} />
                ) : (
                  <AttendanceCalendar
                    profile={profile}
                    batchData={batchData}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    handleMonthChange={handleMonthChange}
                    holidays={holidays}
                    workingDays={workingDays}
                    attendanceByDate={attendanceByDate}
                    rawAttendanceByDate={rawAttendanceByDate}
                    lastUpdatedDate={lastUpdatedDate}
                    openMarkModal={(dateKey) => {
                      setModalDate(dateKey || todayStr);
                      setIsModalOpen(true);
                    }}
                    canOpenTodayMarkModal={canOpenTodayMarkModal}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Analytics) */}
          <div className="w-full xl:w-[320px] xl:sticky xl:top-4">
            <RightPanelStats
              stats={monthlyStats || {}}
              overallStats={overallStats}
              monthlyStats={monthlyStats}
              currentMonth={currentMonth}
              batchData={batchData}
              selectedDate={selectedDate}
              isLoadingMonthly={isLoadingAttendance}
              isLoadingOverall={isLoadingOverallStats}
            />
          </div>

        </div>

      </div>

      {/* Modal Overlay */}
      <MarkAttendanceModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         batchData={batchData}
         onMarkAttendance={markAttendance}
         selectedDate={modalDate}
         selectedAttendance={modalAttendance}
         todayAttendance={todayAttendance}
      />
    </div>
  );
};

export default StudentAttendancePage;
