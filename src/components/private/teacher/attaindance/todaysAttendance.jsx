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

  const profile = useSelector(selectProfile);
  const {
    data: batchData,
    isLoading: batchLoading,
    error: batchError,
  } = useGetBatchQuery(profile.batchId);

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

  // Check existing attendance on mount
  useEffect(() => {
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
  }, [profile.userId, profile.batchId]);

  // Calculate distance when location updates
  useEffect(() => {
    if (deviceLocation && batchData?.location) {
      setUserLocation(deviceLocation);
      const dist = calculateDistance(
        deviceLocation.lat,
        deviceLocation.lon,
        batchData.location.lat,
        batchData.location.lon
      );
      setDistance(dist);
    }
  }, [deviceLocation, batchData, calculateDistance]);

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
  const loading = batchLoading || locationLoading || checkingAttendance;
  const error = batchError || locationError;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* User Info Card */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {profile?.userName || profile?.name || "Student"}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {attendanceMarked && (
                <div className="animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400">
                  {checkingAttendance
                    ? "Checking attendance status..."
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
          <Card className="border-0 shadow-lg bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Unable to Load
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {batchError?.message
                      ? batchError.message
                      : locationError?.message ||
                        "Failed to get your location."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Status Card */}
        {!loading && !error && batchData && (
          <>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {attendanceMarked ? (
                  <div className="text-center py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center animate-in zoom-in duration-700">
                      <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        All Set!
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Your attendance has been marked successfully
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Distance Display */}
                    <div className="text-center space-y-2 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Distance from Campus
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <p className="text-4xl font-bold text-slate-900 dark:text-white">
                          {distance !== null ? formatDistance(distance) : "---"}
                        </p>
                        <Badge
                          variant={isWithinRange ? "default" : "destructive"}
                          className="animate-in fade-in zoom-in duration-300"
                        >
                          {isWithinRange ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {isWithinRange ? "In Range" : "Out of Range"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Required: Within {circleRadius / 1000}km radius
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleMarkAttendance}
                        disabled={
                          !isWithinRange || marking || distance === null
                        }
                        className="w-full h-12 text-base font-semibold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                            Mark Attendance
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => setShowMap(!showMap)}
                        variant="outline"
                        className="w-full h-12 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Map className="mr-2 h-5 w-5" />
                        {showMap ? "Hide Map" : "Show Map"}
                        {showMap ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>

                      {!deviceLocation && (
                        <Button
                          onClick={getDeviceLocation}
                          variant="secondary"
                          className="w-full h-12 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <MapPin className="mr-2 h-5 w-5" />
                          Get My Location
                        </Button>
                      )}
                    </div>

                    {!isWithinRange && distance !== null && (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-red-800 dark:text-red-200 text-center">
                          You're too far from campus. Please move closer to mark
                          attendance.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Map Card - Collapsible */}
            {showMap && (
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <CardContent className="p-0">
                  <div className="h-[300px] w-full relative">
                    <MapContainer
                      center={[batchData.location.lat, batchData.location.lon]}
                      zoom={13}
                      style={{ height: "100%", width: "100%", zIndex: 0 }}
                      zoomControl={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* Campus Marker */}
                      <Marker
                        position={[
                          batchData.location.lat,
                          batchData.location.lon,
                        ]}
                        icon={campusIcon}
                      />

                      {/* Range Circle */}
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

                      {/* User Marker */}
                      {userLocation && (
                        <>
                          <Marker
                            position={[userLocation.lat, userLocation.lon]}
                            icon={userIcon}
                          />
                          {/* Line between user and campus */}
                          <Polyline
                            positions={[
                              [userLocation.lat, userLocation.lon],
                              [batchData.location.lat, batchData.location.lon],
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

                      {/* Fit bounds */}
                      {userLocation && (
                        <MapBounds
                          userLocation={userLocation}
                          campusLocation={batchData.location}
                        />
                      )}
                    </MapContainer>

                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-slate-700 dark:text-slate-300">
                          Campus
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-700 dark:text-slate-300">
                          You
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
