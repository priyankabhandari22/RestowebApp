import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Locate, MapPin, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const defaultCenter = [20.5937, 78.9629];

const LocationMarker = ({ position, onPositionChange }) => {
  useMapEvents({
    click(e) { onPositionChange([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? <Marker draggable position={position} eventHandlers={{ dragend: (e) => { const m = e.target.getLatLng(); onPositionChange([m.lat, m.lng]); } }} /> : null;
};

const FitBounds = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1 });
  }, [position, map]);
  return null;
};

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

const MapSelector = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const handlePositionChange = useCallback(async (pos) => {
    setPosition(pos);
    setLoading(true);
    setGeoError("");
    try {
      const addr = await reverseGeocode(pos[0], pos[1]);
      setAddress(addr);
      onLocationSelect?.({ latitude: pos[0], longitude: pos[1], address: addr });
    } catch {
      setAddress(`${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePositionChange([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        setGeoError(err.code === 1 ? "Location permission denied. Please enable location access." : "Unable to detect location. Try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="map-selector">
      <div className="map-selector-header">
        <MapPin size={16} />
        <span>Delivery Location</span>
        <button type="button" className="locate-btn" onClick={detectLocation} disabled={loading}>
          {loading ? <Loader2 size={14} className="spin" /> : <Locate size={14} />}
          Use Current Location
        </button>
      </div>
      {geoError && <p className="geo-error">{geoError}</p>}
      <div className="map-container">
        <MapContainer center={position || defaultCenter} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%", borderRadius: "14px" }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
          <FitBounds position={position} />
        </MapContainer>
      </div>
      {address && (
        <div className="selected-address">
          <MapPin size={14} />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
};

export default MapSelector;
