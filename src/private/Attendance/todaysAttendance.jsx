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
import { useNavigate } from "react-router-dom";
import { avatarFallback } from "@/utils/avatarFallback";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

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
  } = useLocationManager();

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

  // Only check existing attendance if NOT a holiday and batch is joined
  useEffect(() => {
    if (!resolvedBatchId || holiday) {
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
          if (response?.status === "present") {
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
  }, [profile?.userId, resolvedBatchId, holiday]);

  // Calculate distance when location updates (only if not a holiday)
  useEffect(() => {
    if (!holiday && deviceLocation && batchData?.location) {
      setUserLocation(deviceLocation);
      const dist = calculateDistance(
        deviceLocation.lat,
        deviceLocation.lon,
        batchData.location.lat,
        batchData.location.lon
      );
      setDistance(dist);
    }
  }, [deviceLocation, batchData, calculateDistance, holiday]);

  const handleMarkAttendance = async () => {
    if (distance > circleRadius) return;
    if (attendanceMarked) return;
    if (!resolvedBatchId) return;

    setMarking(true);
    try {
      if (existingAttendance) {
        await newAttendanceService.updateAttendanceStatus(
          existingAttendance.$id,
          "present"
        );
        setAttendanceMarked(true);
      } else {
        await newAttendanceService.createAttendance({
          userId: profile.userId,
          batchId: resolvedBatchId,
          tradeId: batchData?.tradeId || null,
          date: new Date(),
          status: "present",
          remarks: "",
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
    isResolvingBatch || batchLoading || (holiday ? false : locationLoading) || checkingAttendance;
  const error = batchError || (!holiday && locationError);

  // If user truly has no batch (even after resolution), show "No Batch Joined/Created" UI
  if (!resolvedBatchId && !batchLoading && !checkingAttendance && !isResolvingBatch) {
    const isTeacher = profile?.role?.includes("Teacher");
    
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden">
        {/* Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
        </div>
        <div className="relative z-10 max-w-xl mx-auto space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-10 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-pink-100/80 dark:bg-pink-900/30 flex items-center justify-center mx-auto">
              {isTeacher ? (
                <Plus className="w-10 h-10 text-pink-600 dark:text-pink-400" />
              ) : (
                <Search className="w-10 h-10 text-pink-600 dark:text-pink-400" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isTeacher ? "Create Your Batch" : "No Batch Joined"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                {isTeacher 
                  ? "As an instructor, you need to create a batch before you can manage attendance and track student progress."
                  : "You haven't joined any batch yet. To mark your attendance, you first need to join a batch."}
              </p>
            </div>
            <Button 
              onClick={() => navigate(isTeacher ? "/batches" : "/batches/browse")} 
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-2xl px-8 shadow-lg shadow-pink-500/20 font-bold transition-all hover:-translate-y-0.5"
            >
              {isTeacher ? "Create Batch" : "Browse Batches"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading Skeleton for a premium first impression
  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse"></div>
        </div>
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </div>

          {/* Main Status Skeleton */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2 text-center w-full">
                <Skeleton className="h-6 w-1/2 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-1/3 mx-auto rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>

          {/* Loading status text */}
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24 overflow-hidden font-sans">
      {/* Ambient Animated Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-400/10 blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-5">
        {/* Enhanced Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl">
          {/* Gradient Banner */}
          <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
          </div>

          <div className="px-5 sm:px-6 pb-6 relative">
            {/* Avatar + Name Row */}
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="relative shrink-0">
                <InteractiveAvatar
                  src={profile?.profileImage}
                  fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "U"}
                  userId={profile?.userId}
                  editable={false}
                  className="w-20 h-20 ring-4 ring-white/80 dark:ring-slate-900 shadow-xl rounded-2xl"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 bg-emerald-500 shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {profile?.userName || profile?.name || "Student"}
                </h2>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <p className="text-xs font-semibold">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Batch Detail Chips */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:bg-white/70 cursor-default">
                <GraduationCap className="w-4 h-4 text-pink-500 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">{batchData?.BatchName || "—"}</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:bg-white/70 cursor-default">
                <Briefcase className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trade</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">{tradeData?.tradeName || "—"}</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700 rounded-2xl p-3 text-center transition-all hover:shadow-md hover:bg-white/70 cursor-default">
                <Building className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">{collegeData?.collageName || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Holiday Notice */}
        {holiday && !loading && (
          <div className="bg-amber-50/60 dark:bg-amber-950/30 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/50 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 dark:bg-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-lg text-amber-900 dark:text-amber-100 tracking-tight">
                  Holiday Today
                </h3>
                <p className="text-amber-800 dark:text-amber-200 mt-1 font-medium">
                  {holiday?.holidayText ||
                    holiday?.day ||
                    (holiday?.date
                      ? format(new Date(holiday.date), "EEEE")
                      : "Enjoy your day off!")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 font-medium">
                  No attendance required today
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50/60 dark:bg-red-950/30 backdrop-blur-xl border border-red-200/50 dark:border-red-800/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-red-900 dark:text-red-100 tracking-tight">
                  Unable to Load
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1 font-medium">
                  {batchError?.message ||
                    locationError?.message ||
                    "Failed to get your location."}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 bg-white/60 backdrop-blur-sm border-red-200 hover:bg-white/80 text-red-700 rounded-xl font-semibold"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Status Card - Only show if NOT a holiday */}
        {!loading && !error && batchData && !holiday && (
          <>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                {attendanceMarked ? (
                  <div className="p-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20 duration-1000" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-xl shadow-green-500/30">
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Attendance Marked
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          You have successfully marked your attendance for today.
                        </p>
                      </div>
                      <div className="w-full pt-2">
                         <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50/60 text-emerald-700 px-4 py-3 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-100/50 dark:border-emerald-900/50 backdrop-blur-sm">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">
                              Marked at {existingAttendance?.$createdAt ? format(new Date(existingAttendance.$createdAt), "hh:mm a") : format(new Date(), "hh:mm a")}
                            </span>
                         </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-6 relative">
                    {/* View Map Button - Absolute Top Right */}
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        onClick={() => setShowMap(!showMap)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full transition-colors"
                      >
                        <Map className="h-3.5 w-3.5 mr-1.5" />
                        {showMap ? "Hide Map" : "View Map"}
                      </Button>
                    </div>

                    {/* Distance Display */}
                    <div className="text-center space-y-4 py-2 mt-2">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                        Distance from Campus
                      </p>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                          {distance !== null ? formatDistance(distance) : "---"}
                        </p>
                        <Badge
                          variant={isWithinRange ? "default" : "destructive"}
                          className={`text-sm px-4 py-1.5 rounded-full ${
                            isWithinRange 
                              ? "bg-green-500 hover:bg-green-600" 
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {isWithinRange ? (
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              In Range
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <XCircle className="w-4 h-4" />
                              Out of Range
                            </span>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Allowed Radius: {circleRadius}m
                      </p>
                    </div>

                    {/* Warning Message */}
                    {!isWithinRange && distance !== null && (
                      <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-900/20 border border-red-100/50 dark:border-red-900/50 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                            <Navigation className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">
                              You are too far away
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                              Please move closer to the campus to mark your attendance.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <Button
                        onClick={handleMarkAttendance}
                        disabled={!isWithinRange || marking || distance === null}
                        className={`w-full h-16 text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 ${
                          isWithinRange 
                            ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5" 
                            : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                        }`}
                      >
                        {marking ? (
                          <>
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Marking Attendance...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-6 w-6" />
                            Mark Attendance Now
                          </>
                        )}
                      </Button>

                      {!deviceLocation && (
                        <Button
                          onClick={getDeviceLocation}
                          variant="secondary"
                          className="w-full h-12 rounded-xl text-base font-medium"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Locate Me
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Map Section */}
                {showMap && !attendanceMarked && (
                  <div className="border-t border-white/30 dark:border-slate-800">
                    <div className="h-[350px] w-full relative">
                      <MapContainer
                        center={[
                          batchData.location.lat,
                          batchData.location.lon,
                        ]}
                        zoom={13}
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
                            fillOpacity: 0.1,
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
                      <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg p-3 z-[400] flex justify-between items-center border border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm ring-2 ring-white dark:ring-slate-900"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Campus
                          </span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            You
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
