import { useState, useEffect } from "react";
import { haversineDistance } from "../util";

/**
 * Calculate haversine distance between two geographic points
 * @param {Object} coords1 - First point with lat and lon properties
 * @param {Object} coords2 - Second point with lat and lon properties
 * @returns {number} - Distance in meters
 */

/**
 * Custom hook to manage device location, batch location, and related calculations
 * @param {Object} params - Configuration parameters
 * @param {boolean} params.isTeacher - Whether the current user is a teacher
 * @param {Object} params.batchData - Batch data including location
 * @returns {Object} - Location state and utilities
 */
const useLocationManager = ({ isTeacher, batchData }) => {
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationText, setLocationText] = useState({
    device: "",
    batch: "",
  });
  const [distance, setDistance] = useState(Infinity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set up continuous location tracking
  useEffect(() => {
    if (isTeacher) return;

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

        setDeviceLocation(newLocation);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError({
          code: error.code,
          message: error.message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Cleanup function to clear the watch when the component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTeacher]);

  // Manual refresh method (if needed)
  const getDeviceLocation = () => {
    if (isTeacher) return;

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
      },
      (error) => {
        setError({
          code: error.code,
          message: error.message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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

  // Update location text and distance when locations change
  useEffect(() => {
    if (isTeacher) return; // Skip for teachers

    if (deviceLocation && batchData?.location) {
      // Calculate distance
      const dist = haversineDistance(deviceLocation, batchData.location);
      setDistance(dist);

      // Fetch location text for both coordinates
      const updateLocationText = async () => {
        try {
          const deviceText = await fetchLocationText(
            deviceLocation.lat,
            deviceLocation.lon
          );
          const batchText = await fetchLocationText(
            batchData.location.lat,
            batchData.location.lon
          );

          setLocationText({
            device: deviceText,
            batch: batchText,
          });
        } catch (error) {
          console.error("Error updating location text:", error);
        }
      };

      updateLocationText();
    }
  }, [deviceLocation, batchData, isTeacher]);

  return {
    deviceLocation,
    locationText,
    distance,
    loading,
    error,
    getDeviceLocation, // Method to manually refresh location
    isTeacher,
  };
};

export default useLocationManager;
