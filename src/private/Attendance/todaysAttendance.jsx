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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
        {/* Header Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">
                  {profile?.userName || profile?.name || "Student"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-blue-100">
                  <Calendar className="w-4 h-4" />
                  <p className="text-sm">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {attendanceMarked && (
                <div className="animate-bounce">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Holiday Notice */}
        {holiday && !loading && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 dark:bg-amber-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">
                    Holiday Today
                  </h3>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
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
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400">
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Status Card - Only show if NOT a holiday */}
        {!loading && !error && batchData && !holiday && (
          <>
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {attendanceMarked ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                      <CheckCircle2 className="w-14 h-14 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Attendance Marked!
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">
                        You're all set for today
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Distance Display */}
                    <div className="text-center space-y-3 py-4">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Distance from Campus
                      </p>
                      <div className="flex items-baseline justify-center gap-2">
                        <p className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          {distance !== null ? formatDistance(distance) : "---"}
                        </p>
                      </div>
                      <Badge
                        variant={isWithinRange ? "default" : "destructive"}
                        className="text-sm px-4 py-1.5"
                      >
                        {isWithinRange ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            In Range
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Out of Range
                          </>
                        )}
                      </Badge>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        Required: Within {circleRadius / 1000}km radius
                      </p>
                    </div>

                    {/* Warning Message */}
                    {!isWithinRange && distance !== null && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                          <Navigation className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800 dark:text-red-200">
                            You're too far from campus. Please move closer to
                            mark attendance.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={handleMarkAttendance}
                          disabled={
                            !isWithinRange || marking || distance === null
                          }
                          className="h-14 text-base font-semibold rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                          size="lg"
                        >
                          {marking ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-5 w-5" />
                              Mark
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => setShowMap(!showMap)}
                          variant="outline"
                          className="h-14 rounded-xl text-base font-semibold"
                        >
                          <Map className="mr-2 h-5 w-5" />
                          {showMap ? "Hide" : "Show"} Map
                        </Button>
                      </div>

                      {!deviceLocation && (
                        <Button
                          onClick={getDeviceLocation}
                          variant="secondary"
                          className="w-full h-12 rounded-xl"
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Get My Location
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* Map Section - Inside Same Card */}
                {showMap && !attendanceMarked && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="h-[350px] md:h-[400px] w-full relative rounded-xl overflow-hidden">
                      <MapContainer
                        center={[
                          batchData.location.lat,
                          batchData.location.lon,
                        ]}
                        zoom={13}
                        style={{ height: "100%", width: "100%", zIndex: 0 }}
                        zoomControl={true}
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

                      {/* Map Legend */}
                      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-lg p-3 z-[1000] space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            Campus
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
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
