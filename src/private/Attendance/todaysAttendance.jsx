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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import useLocationManager from "@/hooks/useLocationManager";
import { newAttendanceService } from "@/appwrite/newAttendanceService";
import { useSelector } from "react-redux";
import { selectProfile } from "@/store/profileSlice";
import { useGetBatchQuery } from "@/store/api/batchApi";
import holidayService from "@/appwrite/holidaysService";
import { format } from "date-fns";

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

  const {
    data: batchData,
    isLoading: batchLoading,
    error: batchError,
  } = useGetBatchQuery({ batchId: profile.batchId });

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

  // Check for holiday first
  useEffect(() => {
    (async () => {
      try {
        const res = await holidayService.getHolidayByDate(
          format(new Date(), "yyyy-MM-dd"),
          profile.batchId
        );
        setHoliday(res);
      } catch (e) {
        console.log(e);
      } finally {
        setCheckingAttendance(false);
      }
    })();
  }, [profile]);

  // Only check existing attendance if NOT a holiday
  useEffect(() => {
    if (holiday) {
      setCheckingAttendance(false);
      return;
    }

    const fetchExistingAttendance = async () => {
      try {
        const response = await newAttendanceService.getAttendanceByDate(
          profile.userId,
          profile.batchId,
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
  }, [profile.userId, profile.batchId, holiday]);

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
          batchId: profile.batchId,
          tradeId: profile.tradeId,
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
    batchLoading || (holiday ? false : locationLoading) || checkingAttendance;
  const error = batchError || (!holiday && locationError);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-24">
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/10">
              <User className="h-8 w-8 text-white" />
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

        {/* Loading State */}
        {loading && (
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-3xl">
            <CardContent className="py-20">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  {checkingAttendance
                    ? "Checking for holidays..."
                    : batchLoading
                    ? "Loading batch data..."
                    : "Getting your location..."}
                </p>
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
