import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Map,
  ChevronDown,
  ChevronUp,
  Calendar,
  Navigation,
  Clock,
  Search,
  Plus,
  GraduationCap,
  Building,
  Briefcase,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useLocationManager from "@/hooks/useLocationManager";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import { selectProfile } from "@/store/profileSlice";
import { useGetBatchQuery } from "@/store/api/batchApi";
import { useGetTradeQuery } from "@/store/api/tradeApi";
import { useGetCollegeQuery } from "@/store/api/collegeApi";
import holidayService from "@/appwrite/holidaysService";
import batchStudentService from "@/appwrite/batchStudentService";
import { format } from "date-fns";
import { formatAttendanceTime } from "@/services/attendanceTrackingService";
import { useNavigate } from "react-router-dom";
import { avatarFallback } from "@/utils/avatarFallback";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import NoBatchTeacherView from "@/components/components/NoBatchTeacherView";

// Custom marker icons
const campusIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const userIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="background: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4); animation: pulse 2s infinite;"></div>
  <style>@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }</style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to handle map bounds
function MapBounds({ userLocation, campusLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && campusLocation) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lon],
        [campusLocation.lat, campusLocation.lon],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [userLocation, campusLocation, map]);

  return null;
}

const AttendanceTracker = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [batchLocation, setBatchLocation] = useState(null);
  const [circleRadius, setCircleRadius] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(null);
  const [marking, setMarking] = useState(false);
  const [distance, setDistance] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [holiday, setHoliday] = useState(null);
  const profile = useSelector(selectProfile);
  const { activeBatchId: resolvedBatchId, isLoading: batchStateLoading } = useSelector((state) => state.activeBatch);
  const isResolvingBatch = batchStateLoading;
  const isTeacher = profile?.role?.includes("Teacher") || profile?.role?.includes("Admin");

  const {
    data: batchData,
    isLoading: batchLoading,
    error: batchError,
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
    error: locationError,
    getDeviceLocation,
    calculateDistance,
  } = useLocationManager(true);

  useEffect(() => {
    if (batchData) {
      setCircleRadius(parseInt(batchData?.circleRadius || 0));
      setBatchLocation(batchData?.location || null);
    }
  }, [batchData]);

  // activeBatchSlice handles batch resolution automatically

  // Check for holiday first
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

  // Only check existing attendance if NOT a holiday (or if user is a teacher) and batch is joined
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
            const statusVal = String(response?.attendanceStatus || response?.status || "").toLowerCase();
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

  // Calculate distance when location updates (only if not a holiday, or if user is a teacher)
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
        setExistingAttendance(res || {
          markedAt: nowIso,
          status: "present",
          attendanceStatus: "PRESENT",
        });
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
    isResolvingBatch || batchLoading || ((holiday && !isTeacher) ? false : locationLoading) || checkingAttendance;
  const error = batchError || (!(holiday && !isTeacher) && locationError);

  // If user truly has no batch (even after resolution), show "No Batch Joined/Created" UI
  if (!resolvedBatchId && !batchLoading && !checkingAttendance && !isResolvingBatch) {
    const isTeacher = profile?.role?.includes("Teacher") || profile?.role?.includes("Admin");
    
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden">
        {/* Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
        </div>
        <NoBatchTeacherView isTeacher={isTeacher} />
      </div>
    );
  }

  // Loading Skeleton for a premium first impression
  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 pb-24 overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse"></div>
        </div>

        {/* Full Width Edge-to-Edge Header Skeleton */}
        <div className="relative overflow-hidden rounded-none bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto min-w-[300px]">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Body Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="space-y-2 text-center w-full">
                  <Skeleton className="h-6 w-1/2 mx-auto rounded-lg" />
                  <Skeleton className="h-4 w-1/3 mx-auto rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>

            <div className="lg:col-span-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm h-[380px]">
              <Skeleton className="h-full w-full rounded-2xl" />
            </div>
          </div>

          {/* Loading status text */}
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium pt-2">
            <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
            <span>
              {checkingAttendance
                ? "Verifying batch enrollment..."
                : batchLoading
                ? "Syncing batch schedules..."
                : "Resolving your location..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-0 m-0 pb-24 overflow-hidden font-sans">
      {/* Ambient Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-full mx-auto space-y-5 m-0 p-0">
        {/* Modern Integrated Edge-to-Edge Header (Matching App Theme) */}
        <div className="relative overflow-hidden rounded-none bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border-b border-indigo-500/20 shadow-md m-0 p-5 sm:p-6">
          {/* Ambient Lighting Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-7xl mx-auto space-y-5 relative z-10">
            {/* Top Profile & Greeting Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <InteractiveAvatar
                    src={profile?.profileImage}
                    fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "U"}
                    userId={profile?.userId}
                    editable={false}
                    className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white/20 dark:ring-indigo-400/30 shadow-xl rounded-2xl"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[2.5px] border-slate-900 bg-emerald-400 shadow-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-widest">
                      {isTeacher ? "Teacher Portal" : "Student Portal"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm ${
                      isTeacher
                        ? "bg-purple-500/30 text-purple-200 border-purple-400/40 shadow-xs"
                        : "bg-emerald-500/30 text-emerald-200 border-emerald-400/40 shadow-xs"
                    }`}>
                      {isTeacher ? "Teacher" : "Student"}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words mt-0.5">
                    {profile?.userName || profile?.name || (isTeacher ? "Teacher" : "Student")}
                  </h1>
                </div>
              </div>

              {/* Today's Date Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-100 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Flat Header Metadata Row (Batch, Trade, College) */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-white/90">
              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block">Batch</span>
                  <span className="text-xs font-extrabold text-white break-words leading-snug">
                    {batchData?.BatchName || "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block">Trade</span>
                  <span className="text-xs font-extrabold text-white break-words leading-snug">
                    {tradeData?.tradeName || "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block">College</span>
                  <span className="text-xs font-extrabold text-white break-words leading-snug">
                    {collegeData?.collageName || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Body Container (Flat Edge-to-Edge Layout, No Cards System) */}
        <div className="w-full px-4 sm:px-8 py-6">
          {/* Holiday Notice */}
          {holiday && !loading && (
            <div className="bg-amber-50/80 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs mb-6">
              <div className="flex items-start gap-3.5">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-100">
                    Holiday Today
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 mt-0.5">
                    {holiday?.holidayText || holiday?.day || (holiday?.date ? format(new Date(holiday.date), "EEEE") : "Enjoy your day off!")} — No attendance required today.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-red-50/80 dark:bg-red-950/40 border-l-4 border-red-500 p-4 rounded-r-xl shadow-xs mb-6">
              <div className="flex items-start gap-3.5">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-base text-red-900 dark:text-red-100">
                    Unable to Load Attendance
                  </h3>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-0.5">
                    {batchError?.message || locationError?.message || "Failed to get your location."}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-3 bg-white dark:bg-slate-900 border-red-300 text-red-700 font-bold text-xs"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Attendance Marking & Geolocation Section (Seamless Flat Layout) */}
          {!loading && !error && batchData && (!holiday || isTeacher) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              {/* Left Column: Attendance Status & Mark Action */}
              <div className="lg:col-span-6 space-y-6">
                {attendanceMarked ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20 duration-1000" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Attendance Marked
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Your attendance has been recorded for today.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 border border-emerald-200 dark:border-emerald-800 text-sm font-bold">
                      <Clock className="w-4 h-4" />
                      <span>Marked at {formatAttendanceTime(existingAttendance || new Date(), "hh:mm a")}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Distance & Status Display */}
                    <div className="flex flex-col items-center text-center space-y-3 py-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Current Distance from Campus
                      </span>
                      <div className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                        {distance !== null ? formatDistance(distance) : "---"}
                      </div>
                      <Badge
                        variant={isWithinRange ? "default" : "destructive"}
                        className={`text-xs px-3.5 py-1 font-bold ${
                          isWithinRange 
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                            : "bg-rose-500 hover:bg-rose-600 text-white"
                        }`}
                      >
                        {isWithinRange ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            In Range ({circleRadius}m Geofence)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            Out of Range (Max {circleRadius}m)
                          </span>
                        )}
                      </Badge>
                    </div>

                    {/* Warning Message */}
                    {!isWithinRange && distance !== null && (
                      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-3">
                        <Navigation className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>You are currently out of campus range. Please move closer to mark attendance.</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={handleMarkAttendance}
                        disabled={!isWithinRange || marking || distance === null}
                        className={`w-full h-14 text-base font-extrabold rounded-xl shadow-md transition-all ${
                          isWithinRange 
                            ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white cursor-pointer active:scale-[0.99]" 
                            : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        {marking ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Marking Attendance...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Mark Attendance Now
                          </>
                        )}
                      </Button>

                      {!deviceLocation && (
                        <Button
                          onClick={getDeviceLocation}
                          variant="outline"
                          className="w-full h-11 rounded-xl text-xs font-bold border-slate-300 dark:border-slate-700"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Re-Detect Location
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Campus Geofence Map */}
              {batchData?.location && (
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-extrabold text-sm">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span>Campus Location & Geofence Map</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">Radius: {circleRadius}m</span>
                  </div>
                  <div className="h-[380px] sm:h-[420px] w-full relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                    <MapContainer
                      center={[
                        batchData.location.lat,
                        batchData.location.lon,
                      ]}
                      zoom={14}
                      style={{ height: "100%", width: "100%", zIndex: 0 }}
                      zoomControl={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <Marker
                        position={[
                          batchData.location.lat,
                          batchData.location.lon,
                        ]}
                        icon={campusIcon}
                      />

                      <Circle
                        center={[
                          batchData.location.lat,
                          batchData.location.lon,
                        ]}
                        radius={circleRadius || 0}
                        pathOptions={{
                          color: "#3b82f6",
                          fillColor: "#3b82f6",
                          fillOpacity: 0.15,
                          weight: 2,
                        }}
                      />

                      {userLocation && (
                        <>
                          <Marker
                            position={[userLocation.lat, userLocation.lon]}
                            icon={userIcon}
                          />
                          <Polyline
                            positions={[
                              [userLocation.lat, userLocation.lon],
                              [
                                batchData.location.lat,
                                batchData.location.lon,
                              ],
                            ]}
                            pathOptions={{
                              color: isWithinRange ? "#10b981" : "#ef4444",
                              weight: 2,
                              opacity: 0.7,
                              dashArray: "5, 10",
                            }}
                          />
                        </>
                      )}

                      {userLocation && (
                        <MapBounds
                          userLocation={userLocation}
                          campusLocation={batchData.location}
                        />
                      )}
                    </MapContainer>

                    {/* Map Legend Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-sm p-2.5 z-[400] flex justify-between items-center border border-slate-200 dark:border-slate-800 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span className="text-slate-700 dark:text-slate-300">Campus</span>
                      </div>
                      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-slate-700 dark:text-slate-300">Your Location</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Creative Sticky Mobile-First Bottom Action Bar */}
      {!loading && !error && batchData && (!holiday || isTeacher) && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 p-3 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between gap-3">
            {/* Live Distance Status Pill */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <span className={`w-2 h-2 rounded-full ${isWithinRange ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
                <span>{isWithinRange ? "In Range" : "Out of Range"}</span>
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                {distance !== null ? `${formatDistance(distance)} away` : "Locating..."}
              </div>
            </div>

            {/* Primary Mark Attendance Action Button */}
            {attendanceMarked ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Marked ({formatAttendanceTime(existingAttendance || new Date(), "h:mm a")})</span>
              </div>
            ) : (
              <Button
                onClick={handleMarkAttendance}
                disabled={!isWithinRange || marking || distance === null}
                size="sm"
                className={`h-11 px-4 text-xs font-black rounded-xl shadow-md transition-all shrink-0 ${
                  isWithinRange
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white active:scale-95"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                }`}
              >
                {marking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Mark Attendance
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
