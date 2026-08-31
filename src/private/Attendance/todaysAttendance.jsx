/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import {
  CheckCircle2,
  Loader2,
  Calendar,
  Navigation,
  Clock,
  GraduationCap,
  Building,
  Briefcase,
  Maximize2,
  Minimize2,
  Compass,
  Sparkles,
  ShieldCheck,
  Radio,
  LocateFixed,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useLocationManager from "@/hooks/useLocationManager";
import { newAttendanceService } from "@/services/attendance/newAttendanceService";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { useGetBatchQuery } from "@/store/api/batchApi";
import { useGetTradeQuery } from "@/store/api/tradeApi";
import { useGetCollegeQuery } from "@/store/api/collegeApi";
import holidayService from "@/services/attendance/holidaysService";
import { format } from "date-fns";
import { formatAttendanceTime } from "@/services/attendance/attendanceTrackingService";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";

// Custom Animated Markers for Leaflet
const campusIcon = new L.DivIcon({
  className: "custom-marker-campus",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 rounded-full bg-blue-500/30 animate-ping"></div>
      <div class="relative w-8 h-8 rounded-2xl bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIconWithinRange = new L.DivIcon({
  className: "custom-marker-user-in",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></div>
      <div class="relative w-9 h-9 rounded-full bg-emerald-500 border-3 border-white shadow-xl flex items-center justify-center text-white">
        <div class="w-3.5 h-3.5 rounded-full bg-white animate-pulse"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIconOutOfRange = new L.DivIcon({
  className: "custom-marker-user-out",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 rounded-full bg-rose-500/25 animate-ping"></div>
      <div class="relative w-9 h-9 rounded-full bg-rose-500 border-3 border-white shadow-xl flex items-center justify-center text-white">
        <div class="w-3.5 h-3.5 rounded-full bg-white"></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Map Controller for Dynamic View Changes & Auto Bounds
// eslint-disable-next-line react/prop-types
function MapController({ userLocation, campusLocation, mapKey }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && campusLocation) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lon],
        [campusLocation.lat, campusLocation.lon],
      ]);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
    } else if (campusLocation) {
      map.setView([campusLocation.lat, campusLocation.lon], 15);
    }
  }, [userLocation, campusLocation, map, mapKey]);

  return null;
}

const AttendanceTracker = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [circleRadius, setCircleRadius] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(null);
  const [marking, setMarking] = useState(false);
  const [distance, setDistance] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [holiday, setHoliday] = useState(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const profile = useSelector(selectProfile);
  const { activeBatchId: resolvedBatchId, isLoading: batchStateLoading } = useSelector(
    (state) => state.activeBatch
  );
  const isResolvingBatch = batchStateLoading;
  const isTeacher = profile?.role?.includes("Teacher") || profile?.role?.includes("Admin");

  const {
    data: batchData,
    isLoading: batchLoading,
  } = useGetBatchQuery(
    { batchId: resolvedBatchId },
    { skip: !resolvedBatchId }
  );

  const tradeId = batchData?.tradeId?.$id || batchData?.tradeId;
  const collegeId = batchData?.collegeId?.$id || batchData?.collegeId;

  const { data: tradeData } = useGetTradeQuery(tradeId, { skip: !tradeId });
  const { data: collegeData } = useGetCollegeQuery(collegeId, { skip: !collegeId });

  const {
    deviceLocation,
    loading: locationLoading,
    getDeviceLocation,
    calculateDistance,
  } = useLocationManager(true);

  // Sync batch radius
  useEffect(() => {
    if (batchData) {
      setCircleRadius(parseInt(batchData?.circleRadius || 0));
    }
  }, [batchData]);

  // Check for holiday
  useEffect(() => {
    if (!resolvedBatchId) {
      setCheckingAttendance(false);
      return;
    }

    (async () => {
      try {
        const res = await holidayService.getHolidayByDate(
          format(new Date(), "yyyy-MM-dd"),
          resolvedBatchId
        );
        setHoliday(res);
      } catch (e) {
        console.log(e);
      } finally {
        setCheckingAttendance(false);
      }
    })();
  }, [resolvedBatchId]);

  // Check existing attendance for today
  useEffect(() => {
    if (!resolvedBatchId || (holiday && !isTeacher)) {
      setCheckingAttendance(false);
      return;
    }

    const fetchExistingAttendance = async () => {
      try {
        const response = await newAttendanceService.getAttendanceByDate(
          profile.userId,
          resolvedBatchId,
          new Date()
        );
        if (response) {
          setExistingAttendance(response);
          const statusVal = String(
            response?.attendanceStatus || response?.status || ""
          ).toLowerCase();
          if (statusVal === "present") {
            setAttendanceMarked(true);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setCheckingAttendance(false);
      }
    };

    fetchExistingAttendance();
  }, [profile?.userId, resolvedBatchId, holiday, isTeacher]);

  // Calculate distance when location updates
  useEffect(() => {
    if ((!holiday || isTeacher) && deviceLocation && batchData?.location) {
      setUserLocation(deviceLocation);
      const dist = calculateDistance(
        deviceLocation.lat,
        deviceLocation.lon,
        batchData.location.lat,
        batchData.location.lon
      );
      setDistance(dist);
    }
  }, [deviceLocation, batchData, calculateDistance, holiday, isTeacher]);

  const handleMarkAttendance = async () => {
    if (distance > circleRadius) return;
    if (attendanceMarked) return;
    if (!resolvedBatchId) return;

    setMarking(true);
    try {
      if (existingAttendance) {
        const res = await newAttendanceService.updateAttendanceStatus(
          existingAttendance.$id,
          "present"
        );
        setExistingAttendance((prev) => ({
          ...(prev || {}),
          ...(res || {}),
          status: "present",
          attendanceStatus: "PRESENT",
          markedAt: res?.markedAt || new Date().toISOString(),
        }));
        setAttendanceMarked(true);
      } else {
        const nowIso = new Date().toISOString();
        const res = await newAttendanceService.createAttendance({
          userId: profile.userId,
          batchId: resolvedBatchId,
          tradeId: batchData?.tradeId || null,
          date: new Date(),
          dayType: holiday ? "HOLIDAY" : "WORKING",
          attendanceStatus: "PRESENT",
          source: "MANUAL",
          status: "present",
          remarks: "",
          markedAt: nowIso,
        });
        setExistingAttendance(
          res || {
            markedAt: nowIso,
            status: "present",
            attendanceStatus: "PRESENT",
          }
        );
        setAttendanceMarked(true);
      }
    } catch (error) {
      console.error("Failed to mark attendance:", error);
    } finally {
      setMarking(false);
    }
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const isWithinRange = distance !== null && distance <= (circleRadius || 0);
  const loading =
    isResolvingBatch ||
    batchLoading ||
    (holiday && !isTeacher ? false : locationLoading) ||
    checkingAttendance;

  // If user has no batch assigned
  if (!resolvedBatchId && !batchLoading && !checkingAttendance && !isResolvingBatch) {
    return (
      <div className="relative min-h-screen bg-slate-950 p-4 md:p-6 pb-24 flex items-center justify-center">
        <NoBatchTeacherView isTeacher={isTeacher} />
      </div>
    );
  }

  // Loading Screen Skeleton
  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-white">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-3xl border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="w-7 h-7 text-blue-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-black tracking-tight mb-1">
          Connecting to Campus Radar...
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Verifying GPS coordinates & geofence perimeter
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      
      {/* ========================================================================= */}
      {/* 1. IMMERSIVE FULL-SCREEN MAP BACKGROUND */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0">
        {batchData?.location ? (
          <MapContainer
            center={[batchData.location.lat, batchData.location.lon]}
            zoom={15}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            zoomControl={false}
          >
            {/* Dark & High-Contrast Tiles for Sleek Aesthetic */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark:brightness-[0.6] dark:contrast-[1.25] dark:invert-[0.92] dark:hue-rotate-180 transition-all duration-700"
            />

            {/* Campus Geofence Circle */}
            <Circle
              center={[batchData.location.lat, batchData.location.lon]}
              radius={circleRadius || 0}
              pathOptions={{
                color: isWithinRange ? "#10b981" : "#3b82f6",
                fillColor: isWithinRange ? "#10b981" : "#3b82f6",
                fillOpacity: 0.18,
                weight: 2.5,
                dashArray: "6, 8",
              }}
            />

            {/* Campus Center Marker */}
            <Marker
              position={[batchData.location.lat, batchData.location.lon]}
              icon={campusIcon}
            />

            {/* User Location Marker & Trajectory */}
            {userLocation && (
              <>
                <Marker
                  position={[userLocation.lat, userLocation.lon]}
                  icon={isWithinRange ? userIconWithinRange : userIconOutOfRange}
                />
                <Polyline
                  positions={[
                    [userLocation.lat, userLocation.lon],
                    [batchData.location.lat, batchData.location.lon],
                  ]}
                  pathOptions={{
                    color: isWithinRange ? "#10b981" : "#ef4444",
                    weight: 2.5,
                    opacity: 0.8,
                    dashArray: "6, 10",
                  }}
                />
              </>
            )}

            <MapController
              userLocation={userLocation}
              campusLocation={batchData.location}
              mapKey={mapKey}
            />
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-slate-950 flex items-center justify-center">
            <p className="text-sm text-slate-500">Campus location not configured</p>
          </div>
        )}

        {/* Ambient Dark Gradient Vignette for Readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80 z-[1]" />
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING TOP COMMAND & IDENTITY BAR (WITH FULL BATCH & COLLEGE DETAILS) */}
      {/* ========================================================================= */}
      <div className={`relative z-20 transition-all duration-300 p-4 sm:p-6 ${
        isMapFullscreen ? "opacity-0 -translate-y-6 pointer-events-none" : "opacity-100 translate-y-0"
      }`}>
        <div className="max-w-6xl mx-auto backdrop-blur-2xl bg-slate-900/90 dark:bg-slate-950/90 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/60 space-y-4">
          
          {/* Top Profile & Greeting Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <InteractiveAvatar
                  src={profile?.profileImage}
                  fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "U"}
                  userId={profile?.userId}
                  editable={false}
                  className="w-14 h-14 sm:w-16 sm:h-16 ring-2 ring-blue-500/50 rounded-2xl shadow-xl"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 ${
                    attendanceMarked ? "bg-emerald-500" : isWithinRange ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300">
                    {isTeacher ? "Teacher Portal" : "Student Portal"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 border ${
                      isTeacher
                        ? "bg-purple-500/20 text-purple-300 border-purple-400/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                    }`}
                  >
                    {isTeacher ? "Teacher" : "Student"}
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  {profile?.userName || profile?.name || (isTeacher ? "Teacher" : "Student")}
                </h1>
              </div>
            </div>

            {/* Right Actions: Live Date & Time Badge + Edge Arrow Toggle Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-100 shadow-sm">
                <div className="flex items-center gap-1.5 text-indigo-200">
                  <Calendar className="h-4 w-4 text-indigo-300 shrink-0" />
                  <span>
                    {format(currentTime, "EEE, MMM d")}
                  </span>
                </div>
                <div className="w-px h-3.5 bg-white/20" />
                <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-extrabold tracking-wide">
                  <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
                  <span>{format(currentTime, "hh:mm:ss a")}</span>
                </div>
              </div>

              {/* Edge Arrow Chevron Toggle Button */}
              <button
                onClick={() => setShowDetails((prev) => !prev)}
                className={`h-9 px-3 rounded-2xl border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 group ${
                  showDetails
                    ? "bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-500/30"
                    : "bg-white/10 hover:bg-white/20 text-indigo-200 border-white/20 hover:border-indigo-400/50"
                }`}
                title={showDetails ? "Hide Batch & College Details" : "Show Batch & College Details"}
              >
                <span className="text-[11px] font-extrabold hidden sm:inline">
                  {showDetails ? "Hide Details" : "Details"}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-out ${
                    showDetails ? "rotate-180 text-white" : "rotate-0 text-indigo-300 group-hover:translate-y-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Full Metadata Details Row (Batch, Trade, College, Geofence) — Ultra-Smooth CSS Grid Accordion */}
          <div
            className={`grid transition-[grid-template-rows,opacity,padding] duration-300 ease-out ${
              showDetails
                ? "grid-rows-[1fr] opacity-100 pt-4 border-t border-white/10"
                : "grid-rows-[0fr] opacity-0 pt-0 border-t-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 text-white/90">
                
                {/* Batch Details */}
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block">
                      Batch Details
                    </span>
                    <span className="text-xs font-extrabold text-white break-words leading-snug">
                      {batchData?.BatchName || "—"}
                    </span>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300/80 block">
                      Trade
                    </span>
                    <span className="text-xs font-extrabold text-white break-words leading-snug">
                      {tradeData?.tradeName || "—"}
                    </span>
                  </div>
                </div>

                {/* College Details */}
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Building size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300/80 block">
                      College Name
                    </span>
                    <span className="text-xs font-extrabold text-white break-words leading-snug">
                      {collegeData?.collageName || "—"}
                    </span>
                  </div>
                </div>

                {/* Geofence Perimeter */}
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Radio size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300/80 block">
                      Geofence Radius
                    </span>
                    <span className="text-xs font-extrabold text-white break-words leading-snug">
                      {circleRadius ? `${circleRadius}m Perimeter` : "Configured"}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTRAL HOLOGRAPHIC ATTENDANCE RADAR STATION */}
      {/* ========================================================================= */}
      <div className={`relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 transition-all duration-300 ${
        isMapFullscreen ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}>
        <div className="w-full max-w-md backdrop-blur-3xl bg-slate-900/85 dark:bg-slate-950/85 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-center space-y-6 relative overflow-hidden">
          
          {/* Subtle Ambient Radar Glow Behind Station */}
          <div
            className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              attendanceMarked
                ? "bg-emerald-500/20"
                : isWithinRange
                ? "bg-emerald-500/20"
                : "bg-rose-500/15"
            }`}
          />

          {/* Holiday Card Display */}
          {holiday && !isTeacher ? (
            <div className="space-y-4 py-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Calendar size={32} />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Campus Holiday
                </span>
                <h3 className="text-2xl font-black text-white mt-3">
                  {holiday?.holidayText || "Day Off"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Attendance marking is excused for today.
                </p>
              </div>
            </div>
          ) : attendanceMarked ? (
            
            /* SUCCESS STATE: ATTENDANCE RECORDED */
            <div className="space-y-5 py-2">
              <div className="relative flex items-center justify-center mx-auto">
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 border border-white/20">
                  <CheckCircle2 size={40} className="stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck size={14} />
                  Verified Attendance
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Attendance Recorded!
                </h2>
                <p className="text-xs text-slate-400">
                  Your presence has been locked into the college register.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Check-In Time
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {formatAttendanceTime(existingAttendance || new Date(), "hh:mm:ss a")}
                    </div>
                  </div>
                </div>

                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-black">
                  PRESENT
                </Badge>
              </div>
            </div>
          ) : (
            
            /* ACTIVE MARKING STATE: LIVE DISTANCE RADAR */
            <div className="space-y-5">
              
              {/* Distance Display & Concentric Radar Ring */}
              <div className="relative flex flex-col items-center justify-center py-2">
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center">
                  
                  {/* Concentric Pulsing Radar Rings */}
                  <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-700 animate-ping ${
                      isWithinRange
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                    }`}
                  />
                  <div
                    className={`absolute inset-3 rounded-full border border-dashed transition-all duration-700 ${
                      isWithinRange
                        ? "border-emerald-500/40"
                        : "border-rose-500/40 animate-spin"
                    }`}
                  />

                  {/* Distance Number HUD */}
                  <div className="relative z-10 text-center">
                    <div className="text-4xl sm:text-5xl font-black tracking-tighter text-white">
                      {distance !== null ? formatDistance(distance) : "---"}
                    </div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
                      From Campus
                    </div>
                  </div>
                </div>

                {/* Geofence Status Pill */}
                <div className="mt-3">
                  {isWithinRange ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 animate-bounce">
                      <Radio size={14} className="animate-pulse text-emerald-400" />
                      Inside Geofence ({circleRadius}m Limit)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10">
                      <AlertTriangle size={14} className="text-rose-400" />
                      Outside Campus ({circleRadius}m Geofence)
                    </div>
                  )}
                </div>
              </div>

              {/* Warning Notice If Outside Boundary */}
              {!isWithinRange && distance !== null && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-200 text-left flex items-start gap-2.5">
                  <Navigation size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    You are outside the campus boundary. Please enter campus to activate attendance marking.
                  </span>
                </div>
              )}

              {/* Primary Mark Attendance Action Button */}
              <div className="space-y-3 pt-1">
                <Button
                  onClick={handleMarkAttendance}
                  disabled={!isWithinRange || marking || distance === null}
                  className={`w-full h-14 text-base font-black rounded-2xl shadow-xl transition-all duration-300 ${
                    isWithinRange
                      ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-emerald-500/30 cursor-pointer active:scale-95 animate-pulse"
                      : "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                  }`}
                >
                  {marking ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Locking Attendance...
                    </>
                  ) : isWithinRange ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Mark My Attendance Now
                    </>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5 mr-2" />
                      Move Inside Campus to Mark
                    </>
                  )}
                </Button>

                {/* Re-Detect GPS */}
                <button
                  onClick={() => {
                    getDeviceLocation();
                    setMapKey((k) => k + 1);
                  }}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <LocateFixed size={14} />
                  Calibrate / Re-detect GPS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FLOATING MAP & TELEMETRY CONTROLS DOCK */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5">
        
        {/* Toggle Fullscreen Map Mode */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMapFullscreen((prev) => !prev)}
          className="h-12 w-12 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-white/20 text-white hover:bg-slate-800 shadow-xl"
          title={isMapFullscreen ? "Exit Map Fullscreen" : "Inspect Map Fullscreen"}
        >
          {isMapFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </Button>

        {/* Recenter Map Action */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMapKey((k) => k + 1)}
          className="h-12 w-12 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-white/20 text-white hover:bg-slate-800 shadow-xl"
          title="Recenter Camera on Campus"
        >
          <Compass size={18} />
        </Button>
      </div>

      {/* Floating Map Legend Indicator */}
      <div className="fixed bottom-6 left-6 z-30 hidden sm:flex items-center gap-3 backdrop-blur-2xl bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-2 text-xs font-extrabold text-slate-300 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
          <span>Campus Center</span>
        </div>
        <div className="w-px h-3.5 bg-white/20" />
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isWithinRange ? "bg-emerald-500 animate-pulse shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
            }`}
          />
          <span>You ({distance !== null ? formatDistance(distance) : "Locating"})</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
