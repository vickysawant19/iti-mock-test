import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { format } from "date-fns";
import { useStudentAttendance } from "./hooks/useStudentAttendance";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import AttendanceTable from "./components/AttendanceTable";
import AttendanceCalendar from "./components/AttendanceCalendar";
import { TopStatsRow, RightPanelStats } from "./components/AttendanceStatsSummary";
import { Loader2, Calendar as CalendarIcon, Table as TableIcon, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import useLocationManager from "@/hooks/useLocationManager";
import { avatarFallback } from "@/utils/avatarFallback";

const StudentAttendancePage = () => {
  const profile = useSelector(selectProfile);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'calendar'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const {
    isLoadingAttendance,
    batchData,
    studentAttendance,
    holidays,
    workingDays,
    finalAttendanceRecords,
    attendanceByDate,
    totalAttendance,
    currentMonth,
    selectedDate,
    setSelectedDate,
    handleMonthChange,
    markAttendance,
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
  const canOpenTodayMarkModal =
    Boolean(batchData?.canMarkAttendance) &&
    Number.isFinite(distance) &&
    distance <= (batchData?.circleRadius || 1000);

  if (!profile?.batchId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">No Batch Assigned</h2>
        <p className="text-slate-500 mb-6">You need to be part of a batch to view and mark attendance.</p>
        <Link to="/profile" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium">
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4ff] dark:bg-slate-950 px-3 py-4 md:px-5 md:py-6 xl:px-8 pb-20 font-sans">
      <div className="w-full max-w-[1700px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 rounded-[22px] p-6 pt-6 pb-4 mb-5 text-white shadow-lg">
          <div className="absolute top-[-80px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/5 blur-sm" />
          <div className="absolute bottom-[-60px] right-[120px] w-[160px] h-[160px] rounded-full bg-white/5 blur-sm" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/20 border-2 border-white/30 rounded-[14px] flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                 {avatarFallback(profile?.name || "Student")}
               </div>
               <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Student Portal</div>
                  <h1 className="text-xl font-extrabold leading-tight">My Attendance</h1>
                  <div className="text-xs text-white/80 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{profile?.name}</span>
                    <span className="opacity-50">·</span>
                    <span>{batchData?.name || "N/A"}</span>
                  </div>
               </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-blue-600 font-bold text-sm px-5 py-2.5 rounded-[14px] flex items-center gap-2 shadow-sm hover:-translate-y-0.5 transition-transform active:scale-95 whitespace-nowrap"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_0_0_rgba(16,185,129,0.5)]" />
              Mark Attendance
            </button>
          </div>

          {/* Location Strip */}
          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
               <MapPin className="w-4 h-4 text-emerald-300" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{locLoading ? "Checking Location..." : (distance <= (batchData?.circleRadius || 1000) ? "Inside College Area" : "Outside Area")}</div>
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

        {/* Top Stats Row */}
        <TopStatsRow 
          totalDays={totalAttendance?.totalDays || 0}
          presentDays={totalAttendance?.presentDays || 0}
          absentDays={totalAttendance?.absentDays || 0}
          attendancePercentage={totalAttendance?.attendancePercentage || 0}
        />

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
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : viewMode === "table" ? (
                  <AttendanceTable attendanceRecords={tableRecords} holidays={holidays} />
                ) : (
                  <div className="p-3">
                  <AttendanceCalendar
                    profile={profile}
                    batchData={batchData}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    handleMonthChange={handleMonthChange}
                    holidays={holidays}
                    workingDays={workingDays}
                    attendanceByDate={attendanceByDate}
                    lastUpdatedDate={lastUpdatedDate}
                    openMarkModal={(dateKey) => {
                      setModalDate(dateKey || todayStr);
                      setIsModalOpen(true);
                    }}
                    canOpenTodayMarkModal={canOpenTodayMarkModal}
                  />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Analytics) */}
          <div className="w-full xl:w-[320px] xl:sticky xl:top-4">
            <RightPanelStats stats={totalAttendance || {}} currentMonth={currentMonth} />
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
