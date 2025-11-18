import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Navigation,
  MapPinned,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  html: `<div style="position: relative;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg>
    </div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const userIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="position: relative;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); animation: pulse 2s infinite;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    </div>
  </div>
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to handle map bounds
function MapBounds({ userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 13);
    }
  }, [userLocation, map]);

  return null;
}

const AttendanceTracker = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [marking, setMarking] = useState(false);
  const [distance, setDistance] = useState(null);

  const profile = useSelector(selectProfile);
  const {
    data: batchData,
    isLoading: batchLoading,
    error: batchError,
  } = useGetBatchQuery(profile.batchId);

  const {
    deviceLocation,
    locationText,
    loading: locationLoading,
    error: locationError,
    getDeviceLocation,
    calculateDistance,
    enableLocation,
  } = useLocationManager();

  console.log(deviceLocation);

  // Check localStorage for attendance marked today
  const checkLocalAttendance = () => {
    const stored = localStorage.getItem("attendanceMarked");
    if (stored) {
      try {
        const { timestamp, marked } = JSON.parse(stored);
        const now = new Date();
        const markedDate = new Date(timestamp);

        // Check if it's the same day
        const isSameDay =
          now.getFullYear() === markedDate.getFullYear() &&
          now.getMonth() === markedDate.getMonth() &&
          now.getDate() === markedDate.getDate();

        if (isSameDay && marked) {
          return true;
        } else {
          // Clear expired data
          localStorage.removeItem("attendanceMarked");
        }
      } catch (e) {
        localStorage.removeItem("attendanceMarked");
      }
    }
    return false;
  };

  // Check localStorage and fetch attendance on mount
  useEffect(() => {
    // Check localStorage first
    if (checkLocalAttendance()) {
      setAttendanceMarked(true);
      return;
    }

    // Otherwise fetch from API
    const fetchExistingAttendance = async () => {
      try {
        const response = await newAttendanceService.getAttendanceByDate(
          profile.userId,
          profile.batchId,
          new Date()
        );
        console.log("new response", response);
        if (response && response?.status === "present") {
          setAttendanceMarked(true);
          // Store in localStorage
          localStorage.setItem(
            "attendanceMarked",
            JSON.stringify({
              timestamp: new Date().toISOString(),
              marked: true,
            })
          );
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchExistingAttendance();
  }, [profile.userId, profile.batchId]);

  // Calculate distance when location updates
  useEffect(() => {
    if (deviceLocation && batchData?.location) {
      console.log("deviceLocation", deviceLocation);
      setUserLocation(deviceLocation);
      const dist = calculateDistance(
        deviceLocation.lat,
        deviceLocation.lon,
        batchData.location.lat,
        batchData.location.lon
      );
      console.log("distance", dist);
      setDistance(dist);
    }
  }, [deviceLocation, batchData, calculateDistance]);

  const handleMarkAttendance = async () => {
    if (distance > batchData?.distance) return;
    if (attendanceMarked) return;

    setMarking(true);
    try {
      const res = await newAttendanceService.createAttendance({
        userId: profile.userId,
        batchId: profile.batchId,
        tradeId: profile.tradeId,
        date: new Date(),
        status: "present",
        remarks: "",
      });

      // Store in localStorage with timestamp
      localStorage.setItem(
        "attendanceMarked",
        JSON.stringify({ timestamp: new Date().toISOString(), marked: true })
      );
      setAttendanceMarked(true);
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

  const isWithinRange =
    distance !== null && distance <= (batchData?.distance || 0);
  const loading = batchLoading || locationLoading;
  const error = batchError || locationError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center py-6 px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 mb-3">
            <MapPinned className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Attendance Tracker
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1">
            Check in from campus to mark your attendance
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="px-4 pb-6">
            <Card className="border-2 shadow-xl">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                      {batchLoading
                        ? "Loading batch data..."
                        : "Fetching your location..."}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Please wait a moment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="px-4 pb-6">
            <Alert variant="destructive" className="border-2">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Unable to Load</AlertTitle>
              <AlertDescription>
                {batchError
                  ? "Failed to load batch data. Please try again."
                  : locationError ||
                    "Failed to get your location. Please enable location services."}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Status Card */}
        {!loading && !error && batchData && (
          <div className="px-4 pb-4">
            <Card className="border-2 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {attendanceMarked ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Attendance Status
                    </>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Check-In Status
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {attendanceMarked
                    ? "You're all set for today"
                    : "Verify your location to mark attendance"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attendanceMarked ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-900 dark:text-green-100 text-sm">
                      Successfully Checked In
                    </AlertTitle>
                    <AlertDescription className="text-green-800 dark:text-green-200 text-xs">
                      Your attendance has been recorded for today. See you next
                      time!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Distance from Campus
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                          {distance !== null
                            ? formatDistance(distance)
                            : "Calculating..."}
                        </p>
                      </div>
                      <Badge
                        variant={isWithinRange ? "default" : "destructive"}
                        className="h-fit text-xs"
                      >
                        {isWithinRange ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Within Range
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Out of Range
                          </span>
                        )}
                      </Badge>
                    </div>

                    {!isWithinRange && distance !== null && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">
                          Too Far from Campus
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          You need to be within
                          {parseInt(batchData?.circleRadius) / 1000}km of campus
                          to mark attendance.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleMarkAttendance}
                      disabled={!isWithinRange || marking || distance === null}
                      className="w-full h-11 text-sm font-semibold shadow-lg"
                      size="lg"
                    >
                      {marking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Marking Attendance...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Attendance
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Map Card */}
        {!loading && !error && batchData && (
          <div className="px-4 pb-4">
            <Card className="border-2 shadow-xl overflow-hidden">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Live Location Map
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Blue circle shows the allowed check-in range
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[350px] sm:h-[400px] md:h-[450px] w-full">
                  <MapContainer
                    center={[batchData.location.lat, batchData.location.lon]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Campus Marker */}
                    <Marker
                      position={[
                        batchData.location.lat,
                        batchData.location.lon,
                      ]}
                      icon={campusIcon}
                    >
                      <Popup>
                        <div className="text-center font-semibold text-sm">
                          Campus Location
                        </div>
                      </Popup>
                    </Marker>

                    {/* Range Circle */}
                    <Circle
                      center={[batchData.location.lat, batchData.location.lon]}
                      radius={Number(batchData?.distance || 0)}
                      pathOptions={{
                        color: "#3b82f6",
                        fillColor: "#3b82f6",
                        fillOpacity: 0.1,
                        weight: 2,
                      }}
                    />

                    {/* User Marker */}
                    {userLocation && (
                      <Marker
                        position={[userLocation.lat, userLocation.lon]}
                        icon={userIcon}
                      >
                        <Popup>
                          <div className="text-center font-semibold text-sm">
                            Your Location
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Fit bounds to show both markers */}
                    {userLocation && <MapBounds userLocation={userLocation} />}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Legend */}
        {!loading && !error && batchData && (
          <div className="px-4 pb-6">
            <Card className="border shadow-md">
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-4 justify-center text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex-shrink-0"></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Campus Location
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-md flex-shrink-0"></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Your Location
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-950 flex-shrink-0"></div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Check-in Range ({batchData.distance / 1000}km)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
