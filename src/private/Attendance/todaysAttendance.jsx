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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24">
        <div className="max-w-xl mx-auto space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-24 h-24 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            {isTeacher ? (
              <Plus className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            ) : (
              <Search className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isTeacher ? "Create Your Batch" : "No Batch Joined"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isTeacher 
                ? "As an instructor, you need to create a batch before you can manage attendance and track student progress."
                : "You haven't joined any batch yet. To mark your attendance, you first need to join a batch."}
            </p>
          </div>
          <Button 
            onClick={() => navigate(isTeacher ? "/batches" : "/batches/browse")} 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 shadow-xl shadow-blue-500/20"
          >
            {isTeacher ? "Create Batch" : "Browse Batches"}
          </Button>
        </div>
      </div>
    );
  }

  // Loading Skeleton for a premium first impression
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-5">
              <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Main Status Skeleton */}
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="space-y-2 text-center w-full">
                  <Skeleton className="h-6 w-1/2 mx-auto rounded-lg" />
                  <Skeleton className="h-4 w-1/3 mx-auto rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>

              <Skeleton className="h-16 w-full rounded-2xl" />
            </CardContent>
          </Card>

          {/* Loading status text */}
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm italic">
            <Loader2 className="w-3 h-3 animate-spin" />
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24">
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="flex items-center justify-center flex-shrink-0">
               <InteractiveAvatar
                  src={profile?.profileImage}
                  fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "U"}
                  userId={profile?.userId}
                  editable={false}
                  className="w-16 h-16 shadow-inner border border-white/10"
               />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight truncate">
                {profile?.userName || profile?.name || "Student"}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-blue-100">
                <Calendar className="h-4 w-4" />
                <p className="font-medium text-sm">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Holiday Notice */}
        {holiday && !loading && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 dark:bg-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">
                    Holiday Today
                  </h3>
                  <p className="text-amber-800 dark:text-amber-200 mt-1 font-medium">
                    {holiday?.holidayText ||
                      holiday?.day ||
                      (holiday?.date
                        ? format(new Date(holiday.date), "EEEE")
                        : "Enjoy your day off!")}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                    No attendance required today
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Error State */}
        {!loading && error && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-red-900 dark:text-red-100">
                    Unable to Load
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    {batchError?.message ||
                      locationError?.message ||
                      "Failed to get your location."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-white/50 border-red-200 hover:bg-white/80 text-red-700"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Status Card - Only show if NOT a holiday */}
        {!loading && !error && batchData && !holiday && (
          <>
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
              <CardContent className="p-0">
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
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          Attendance Marked
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          You have successfully marked your attendance for today.
                        </p>
                      </div>
                      <div className="w-full pt-2">
                         <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 text-green-700 px-4 py-3 dark:bg-green-900/20 dark:text-green-300 border border-green-100 dark:border-green-900/50">
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
                        className="h-8 px-3 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
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
                      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50">
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
                        className={`w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-300 ${
                          isWithinRange 
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] active:scale-[0.98]" 
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
                  <div className="border-t border-slate-100 dark:border-slate-800">
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
