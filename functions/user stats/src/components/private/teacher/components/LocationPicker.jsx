import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { haversineDistance } from "../attaindance/calculateDistance";

// Default coordinates for Mumbai, India
const DEFAULT_LAT = 19.076;
const DEFAULT_LON = 72.8777;

const deviceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2536/2536745.png",
  iconSize: [41, 41],
  iconAnchor: [20.5, 41], // Centered bottom anchor
  popupAnchor: [0, -41],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [20.5, 41],
});

const batchIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/18796/18796384.png",
  iconSize: [41, 41],
  iconAnchor: [20.5, 41], // Centered bottom anchor
  popupAnchor: [0, -41],
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [20.5, 41],
});

const LocationPicker = ({
  setValue,
  deviceLocation = { lat: DEFAULT_LAT, lon: DEFAULT_LON },
  batchLocation = { lat: DEFAULT_LAT, lon: DEFAULT_LON },
  disableSelection = false,
  circleRadius = 1000,
  zoom = 13,
}) => {
  const [location, setLocation] = useState(deviceLocation);

  // Memoize distance calculation
  const distance = useMemo(
    () => haversineDistance(deviceLocation, batchLocation),
    [deviceLocation, batchLocation]
  );

  // Reset location when deviceLocation changes
  useEffect(() => {
    setLocation(deviceLocation);
  }, [deviceLocation]);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        if (!disableSelection) {
          const { lat, lng } = e.latlng;
          const newLocation = { lat, lon: lng };
          setLocation(newLocation);
          setValue?.("location", newLocation);
        }
      },
    });

    return location.lat && location.lon ? (
      <Marker position={[location.lat, location.lon]} icon={deviceIcon}>
        <Popup>
          Selected Location: <br />
          Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}
        </Popup>
      </Marker>
    ) : null;
  };

  const MapCenterUpdater = () => {
    const map = useMap();
    useEffect(() => {
      if (deviceLocation.lat && deviceLocation.lon) {
        map.setView([deviceLocation.lat, deviceLocation.lon]);
      }
    }, [deviceLocation, map]);
    return null;
  };

  return (
    <div className="h-80">
      <MapContainer
        // key={`${deviceLocation.lat}-${deviceLocation.lon}`}
        center={[deviceLocation.lat, deviceLocation.lon]}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Marker
          position={[batchLocation.lat, batchLocation.lon]}
          icon={batchIcon}
        >
          <Popup>College Location</Popup>
        </Marker>

        <Circle
          center={
            disableSelection
              ? [batchLocation.lat, batchLocation.lon]
              : [location.lat, location.lon]
          }
          radius={circleRadius}
          pathOptions={{
            color: "#ff0000",
            fillColor: "#ffff00",
            fillOpacity: 0.2,
            weight: 1,
          }}
        />

        <LocationMarker />
        <MapCenterUpdater />

        {location.lat && location.lon && (
          <Polyline
            positions={[
              [batchLocation.lat, batchLocation.lon],
              [location.lat, location.lon],
            ]}
            pathOptions={{ color: "blue", dashArray: "5, 10" }}
          >
            <Popup>
              Distance:{" "}
              {distance > 1000
                ? `${(distance / 1000).toFixed(2)} km`
                : `${Math.round(distance)} meters`}
            </Popup>
          </Polyline>
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
