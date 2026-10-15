import { useState, useEffect, useRef } from "react";
import { haversineDistance } from "@/utils/haversineDistance";

// Module-level cache — persists for the lifetime of the page session.
// Stores the last coordinate pair we successfully reverse-geocoded.
let geocodeCache = { lat: null, lon: null, text: "" };

/**
 * Custom hook to manage device location and related calculations
 * @param {boolean} enableLocation - Whether to enable location tracking
 * @returns {Object} - Location state and utilities
 */
const useLocationManager = (enableLocation = false) => {
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationText, setLocationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const geocodeFetchingRef = useRef(false); // prevent concurrent fetches

  // Set up continuous location tracking
  useEffect(() => {
    if (!enableLocation) return;  // disabled — skip GPS tracking
    setLoading(true);

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError({
        code: "GEOLOCATION_NOT_SUPPORTED",
        message: "Geolocation is not supported by this browser.",
      });
      setLoading(false);
      return;
    }

    // Watch for location changes
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setDeviceLocation((prev) => {
          // Only update state (and trigger reverse-geocode) if moved > 30 m
          if (prev) {
            const dlat = Math.abs(prev.lat - newLocation.lat);
            const dlon = Math.abs(prev.lon - newLocation.lon);
            // ~30 m in degrees latitude ≈ 0.00027
            if (dlat < 0.00027 && dlon < 0.00027) return prev;
          }
          return newLocation;
        });
        setLoading(false);
        setError(null);
      },
      (error) => {
        // If high accuracy times out (e.g. indoors or slow satellite lock), fallback to network/coarse location
        if (error.code === 3 && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const fallbackLoc = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp,
              };
              setDeviceLocation(fallbackLoc);
              setLoading(false);
              setError(null);
            },
            (fallbackErr) => {
              setError({ code: fallbackErr.code, message: fallbackErr.message });
              setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
          return;
        }

        setError({
          code: error.code,
          message: error.message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000, // reuse a cached fix up to 30 s old
      }
    );

    // Cleanup function to clear the watch when the component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enableLocation]);

  // Manual refresh method (if needed)
  const getDeviceLocation = () => {
    if (!navigator.geolocation) {
      setError({
        code: "GEOLOCATION_NOT_SUPPORTED",
        message: "Geolocation is not supported by this browser.",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setDeviceLocation(newLocation);
        setLoading(false);
        setError(null);
        return newLocation;
      },
      (error) => {
        // If high accuracy timed out, retry with network location
        if (error.code === 3) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const fallbackLocation = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp,
              };
              setDeviceLocation(fallbackLocation);
              setLoading(false);
              setError(null);
            },
            (fbErr) => {
              setError({ code: fbErr.code, message: fbErr.message });
              setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
          return;
        }

        setError({
          code: error.code,
          message: error.message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0,
      }
    );
  };

  // Fetch location text from coordinates
  const fetchLocationText = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await response.json();
      return data.locality || data.city || "Unknown location";
    } catch (error) {
      console.error("Error fetching location text:", error);
      return "Error fetching location";
    }
  };

  // Calculate distance between any two coordinate pairs
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      console.error("Invalid coordinates provided to calculateDistance");
      return null;
    }

    const coords1 = { lat: lat1, lon: lon1 };
    const coords2 = { lat: lat2, lon: lon2 };

    return haversineDistance(coords1, coords2);
  };

  // Update location text when device location changes.
  // Only calls the reverse-geocode API when the user has moved > 200m from
  // the position we last geocoded — GPS oscillation within 200m reuses the cache.
  useEffect(() => {
    if (!enableLocation) return; // disabled — skip reverse-geocode
    if (!deviceLocation) return;

    const updateLocationText = async () => {
      // Reuse cached text if we haven't moved more than 200 m
      if (geocodeCache.lat !== null) {
        const movedMeters = haversineDistance(
          { lat: geocodeCache.lat, lon: geocodeCache.lon },
          { lat: deviceLocation.lat, lon: deviceLocation.lon }
        );
        if (movedMeters < 200) {
          // Close enough — reuse cached text without a network call
          if (geocodeCache.text) setLocationText(geocodeCache.text);
          return;
        }
      }

      // Guard against concurrent fetches
      if (geocodeFetchingRef.current) return;
      geocodeFetchingRef.current = true;

      try {
        const deviceText = await fetchLocationText(
          deviceLocation.lat,
          deviceLocation.lon
        );
        geocodeCache = { lat: deviceLocation.lat, lon: deviceLocation.lon, text: deviceText };
        setLocationText(deviceText);
      } catch (error) {
        console.error("Error updating location text:", error);
      } finally {
        geocodeFetchingRef.current = false;
      }
    };

    updateLocationText();
  }, [deviceLocation, enableLocation]);

  return {
    deviceLocation,
    locationText,
    loading,
    error,
    getDeviceLocation, // Method to manually refresh location
    calculateDistance, // Method to calculate distance between any two coordinates
    enableLocation,
  };
};

export default useLocationManager;
