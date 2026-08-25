import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { format } from "date-fns";
import { useStudentAttendance } from "./hooks/useStudentAttendance";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import AttendanceCalendar from "./components/AttendanceCalendar";
import { RightPanelStats } from "./components/AttendanceStatsSummary";
import { MapPin, Sparkles, CheckCircle2 } from "lucide-react";
import useLocationManager from "@/hooks/useLocationManager";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

const StudentAttendancePage = () => {
  const profile = useSelector(selectProfile);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const {
    isLoadingAttendance,
    isLoadingOverallStats,
    batchData,
    tradeData,
    holidays,
    workingDays,
    attendanceByDate,
    rawAttendanceByDate,
    overallStats,
    monthlyStats,
    currentMonth,
    selectedDate,
    setSelectedDate,
    handleMonthChange,
    markAttendance,
    lastUpdatedDate,
    enrollmentDate,
  } = useStudentAttendance(profile);


  // Single GPS tracker for this page — shared with the modal via props
  const { deviceLocation, locationText, loading: locLoading, error: locError, calculateDistance } = useLocationManager(true);
  const distance = (!deviceLocation || !batchData?.location) ? Infinity : calculateDistance(
      deviceLocation.lat, deviceLocation.lon, batchData.location.lat, batchData.location.lon
  );
  
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = workingDays?.get(todayStr);
  const modalAttendance = workingDays?.get(modalDate);
  // Allow calendar double-click on today as long as marking is enabled — the modal enforces location
  const canOpenTodayMarkModal = Boolean(batchData?.canMarkAttendance);
  // Full location check used by the modal button itself (passed as prop)
  const isInLocationRange =
    Number.isFinite(distance) &&
    distance <= (batchData?.circleRadius || 1000);


  return (
    <div className="min-h-screen bg-[#f0f4ff] dark:bg-slate-950 px-3 py-4 md:px-5 md:py-6 xl:px-8 pb-20 font-sans">
      <div className="w-full max-w-[1700px] mx-auto animate-in fade-in duration-500">
        
        {/* Header with full Light & Dark mode support */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950/90 dark:to-slate-950 rounded-3xl p-5 sm:p-6 mb-5 text-white shadow-xl border border-blue-400/30 dark:border-indigo-500/20">
          {/* Ambient background glow orbs */}
          <div className="absolute top-[-90px] right-[-60px] w-[300px] h-[300px] rounded-full bg-white/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-80px] left-[-40px] w-[240px] h-[240px] rounded-full bg-white/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-[180px] h-[180px] rounded-full bg-pink-400/10 dark:bg-pink-500/10 blur-2xl pointer-events-none" />

          {/* Top Row: Profile & Action Button */}
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center flex-shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-white/40 to-white/10 dark:from-indigo-500 dark:to-purple-500 blur-xs opacity-70" />
                <InteractiveAvatar
                  src={profile?.profileImage}
                  fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "S"}
                  userId={profile?.userId}
                  editable={false}
                  className="w-14 h-14 relative shadow-md border-2 border-white/50 dark:border-white/40 rounded-full"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white dark:bg-indigo-500/20 dark:text-indigo-300 border border-white/30 dark:border-indigo-500/30">
                    <Sparkles className="w-3 h-3 text-amber-300 dark:text-indigo-400" />
                    Student Attendance Hub
                  </span>
                  {profile?.rollNo || profile?.rollNumber ? (
                    <span className="text-[10px] font-mono font-bold text-white/90 dark:text-white/60 bg-black/15 dark:bg-white/10 px-2 py-0.5 rounded-md">
                      Roll #{profile.rollNo || profile.rollNumber}
                    </span>
                  ) : null}
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-white flex items-center gap-2">
                  My Attendance Register
                </h1>

                <div className="text-xs text-white/90 dark:text-white/80 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white dark:text-indigo-200">{profile?.userName || profile?.name}</span>
                  <span className="opacity-40">|</span>
                  {tradeData?.tradeName && (
                    <>
                      <span className="bg-white/20 dark:bg-white/10 px-2 py-0.5 rounded-md text-[11px] font-medium text-white">
                        {tradeData.tradeName}
                      </span>
                      <span className="opacity-40">|</span>
                    </>
                  )}
                  <span className="bg-purple-900/30 dark:bg-purple-500/20 text-purple-100 dark:text-purple-200 px-2 py-0.5 rounded-md text-[11px] font-medium border border-purple-400/30 dark:border-purple-500/30">
                    {batchData?.BatchName || "Batch N/A"}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={!batchData?.canMarkAttendance}
              className="bg-white text-indigo-700 hover:bg-slate-50 dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 dark:hover:from-indigo-600 dark:hover:to-pink-600 dark:text-white font-extrabold text-sm px-6 py-3 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/30 transition-all transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full sm:w-auto justify-center cursor-pointer border border-white/60 dark:border-transparent"
            >
              <div className={`w-2.5 h-2.5 ${batchData?.canMarkAttendance ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-400'} rounded-full`} />
              <span>Mark Today's Attendance</span>
            </button>
          </div>

          {/* Location & Today Status Bar */}
          <div className="relative z-10 mt-5 pt-3.5 border-t border-white/15 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/15 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/20 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 ${locLoading ? 'bg-white/15 text-white/70' : locError ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40' : isInLocationRange ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'} rounded-xl flex items-center justify-center flex-shrink-0 transition-colors`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>{locLoading ? "Verifying GPS Location..." : locError ? "Location Access Error" : isInLocationRange ? "Inside College Campus" : "Outside Authorized Area"}</span>
                </div>
                <div className="text-[11px] text-white/80 dark:text-white/70 truncate">
                  {locError ? (locError.message || "Location permission required") : (distance === Infinity || locLoading ? locationText || "Locating institute bounds..." : `${Math.round(distance)}m from campus center`)}
                </div>
              </div>
            </div>

            {(todayAttendance?.attendanceStatus?.toLowerCase() || todayAttendance?.status) === 'present' && (
              <div className="bg-emerald-500/30 dark:bg-emerald-500/20 border border-emerald-300/50 dark:border-emerald-400/40 text-emerald-100 dark:text-emerald-200 text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-2 flex-shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 dark:text-emerald-400" />
                <span>Today Marked Present</span>
              </div>
            )}
          </div>
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
                  // Calendar skeleton
                  <div className="p-3 animate-pulse">
                    <div className="flex items-center justify-between gap-2 mb-3 px-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      <div className="flex gap-2 flex-1 justify-center">
                        <div className="h-8 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="h-8 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                        <div key={d} className="flex justify-center py-1.5">
                          <div className="h-3 w-6 rounded bg-slate-100 dark:bg-slate-800" />
                        </div>
                      ))}
                    </div>
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
                    <div className="mt-3 h-3 w-56 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ) : (
                  <AttendanceCalendar
                    profile={profile}
                    batchData={batchData}
                    enrollmentDate={enrollmentDate}
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
         enrollmentDate={enrollmentDate}
         onMarkAttendance={markAttendance}
         selectedDate={modalDate}
         selectedAttendance={modalAttendance}
         todayAttendance={todayAttendance}
         deviceLocation={deviceLocation}
         locationText={locationText}
         locLoading={locLoading}
         locError={locError}
         calculateDistance={calculateDistance}
      />

    </div>
  );
};

export default StudentAttendancePage;
