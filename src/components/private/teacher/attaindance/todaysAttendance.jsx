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

// Sample location (e.g., school/college coordinates)
const SAMPLE_LOCATION = {
  lat: 40.7128,
  lng: -74.006,
  name: "Campus Location",
};

const MAX_DISTANCE = 10000; // 10000 meters

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
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [SAMPLE_LOCATION.lat, SAMPLE_LOCATION.lng]
      );
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [userLocation, map]);

  return null;
}

const AttendanceTracker = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Get user location
  useEffect(() => {
    const marked = localStorage.getItem("attendanceMarked");
    if (marked) {
      setAttendanceMarked(true);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);

          const dist = calculateDistance(
            userPos.lat,
            userPos.lng,
            SAMPLE_LOCATION.lat,
            SAMPLE_LOCATION.lng
          );
          setDistance(dist);
          setLoading(false);
        },
        (err) => {
          setError(
            "Unable to access your location. Please enable location permissions."
          );
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  const handleMarkAttendance = async () => {
    if (distance > MAX_DISTANCE) return;

    setMarking(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    localStorage.setItem("attendanceMarked", "true");
    setAttendanceMarked(true);
    setMarking(false);
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const isWithinRange = distance !== null && distance <= MAX_DISTANCE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 mb-4">
            <MapPinned className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Attendance Tracker
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Check in from campus to mark your attendance
          </p>
        </div>

        {/* Status Card */}
        {!loading && (
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {attendanceMarked ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    Attendance Status
                  </>
                ) : (
                  <>
                    <Navigation className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Check-In Status
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {attendanceMarked
                  ? "You're all set for today"
                  : "Verify your location to mark attendance"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Location Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : attendanceMarked ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-100">
                    Successfully Checked In
                  </AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Your attendance has been recorded for today. See you next
                    time!
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Distance from Campus
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatDistance(distance)}
                      </p>
                    </div>
                    <Badge
                      variant={isWithinRange ? "default" : "destructive"}
                      className="h-fit"
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

                  {!isWithinRange && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Too Far from Campus</AlertTitle>
                      <AlertDescription>
                        You need to be within {MAX_DISTANCE / 1000}km of campus
                        to mark attendance.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleMarkAttendance}
                    disabled={!isWithinRange || marking}
                    className="w-full h-12 text-base font-semibold shadow-lg"
                    size="lg"
                  >
                    {marking ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Marking Attendance...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Mark Attendance
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map Card */}
        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Live Location Map
            </CardTitle>
            <CardDescription>
              Blue circle shows the allowed check-in range
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-[400px] md:h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                      Loading Map
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Fetching your location...
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="h-[400px] md:h-[500px] flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="text-center space-y-2">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Unable to load map
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[400px] md:h-[500px] w-full">
                <MapContainer
                  center={[SAMPLE_LOCATION.lat, SAMPLE_LOCATION.lng]}
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
                    position={[SAMPLE_LOCATION.lat, SAMPLE_LOCATION.lng]}
                    icon={campusIcon}
                  >
                    <Popup>
                      <div className="text-center font-semibold">
                        {SAMPLE_LOCATION.name}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Range Circle */}
                  <Circle
                    center={[SAMPLE_LOCATION.lat, SAMPLE_LOCATION.lng]}
                    radius={MAX_DISTANCE}
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
                      position={[userLocation.lat, userLocation.lng]}
                      icon={userIcon}
                    >
                      <Popup>
                        <div className="text-center font-semibold">
                          Your Location
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Fit bounds to show both markers */}
                  {userLocation && <MapBounds userLocation={userLocation} />}
                </MapContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="border shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Campus Location
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-md"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your Location
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-950"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Check-in Range ({MAX_DISTANCE / 1000}km)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceTracker;
