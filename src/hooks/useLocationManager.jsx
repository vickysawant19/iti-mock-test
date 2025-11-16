import { useState, useEffect } from "react";
import { haversineDistance } from "@/utils/haversineDistance";

/**
 * Calculate haversine distance between two geographic points
 * @param {Object} coords1 - First point with lat and lon properties
 * @param {Object} coords2 - Second point with lat and lon properties
 * @returns {number} - Distance in meters
 */

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

  // Set up continuous location tracking
  useEffect(() => {
    if (enableLocation) return;
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

  // Update location text when device location changes
  useEffect(() => {
    if (enableLocation) return;

    if (deviceLocation) {
      // Fetch location text for device coordinates
      const updateLocationText = async () => {
        try {
          const deviceText = await fetchLocationText(
            deviceLocation.lat,
            deviceLocation.lon
          );

          setLocationText(deviceText);
        } catch (error) {
          console.error("Error updating location text:", error);
        }
      };

      updateLocationText();
    }
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
