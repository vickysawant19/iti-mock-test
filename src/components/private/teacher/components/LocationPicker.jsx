import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Map, ScanFace } from "lucide-react";

const LocationPicker = ({
  setValue,
  deviceLocation = { lat: 15, lon: 73 },
  batchLocation = { lat: 15.9186944, lon: 73.8656256 },
}) => {
  const [location, setLocation] = useState(deviceLocation);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setLocation({ lat, lon: lng });
        setValue("location", { lat, lon: lng });
      },
    });

    return location.lat !== 0 && location.lon !== 0 ? (
      <>
        <Marker position={[location.lat, location.lon]} />
      </>
    ) : null;
  };

  const MapCenterUpdater = () => {
    const map = useMap();
    useEffect(() => {
      map.setView([deviceLocation.lat, deviceLocation.lon], map.getZoom());
    }, [deviceLocation, map]);
    return null;
  };

  return (
    <div className="h-80">
      <MapContainer
        center={[deviceLocation.lat, deviceLocation.lon]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[batchLocation.lat, batchLocation.lon]} />
        <Circle
          center={[location.lat, location.lon]}
          radius={1000} // 1km radius
          pathOptions={{
            color: "red",
            fillColor: "yellow",
            fillOpacity: 0.2,
            weight: 0.7,
          }}
        />
        <LocationMarker />
        <MapCenterUpdater />
        {location.lat !== 0 && location.lon !== 0 && (
          <Polyline
            positions={[
              [batchLocation.lat, batchLocation.lon],
              [location.lat, location.lon],
            ]}
            pathOptions={{ color: "blue", dashArray: "5, 10" }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
