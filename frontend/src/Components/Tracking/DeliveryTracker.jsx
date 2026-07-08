import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Clock, Bike } from "lucide-react";
import { getSocket, joinOrderRoom, leaveOrderRoom } from "../../services/socket";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const riderIcon = L.divIcon({
  className: "rider-marker",
  html: '<div class="rider-pulse"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const statusSteps = [
  { key: "received", label: "Order Placed" },
  { key: "preparing", label: "Preparing Food" },
  { key: "picked-up", label: "Picked Up" },
  { key: "on-the-way", label: "On The Way" },
  { key: "near-you", label: "Near You" },
  { key: "delivered", label: "Delivered" },
];

const DeliveryTracker = ({ orderId, customerLocation, restaurantLocation }) => {
  const [riderPos, setRiderPos] = useState(null);
  const [status, setStatus] = useState("received");
  const [eta, setEta] = useState("");
  const [distance, setDistance] = useState("");
  const [agent, setAgent] = useState(null);
  const mapRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    joinOrderRoom(orderId);

    socket.on("rider-location", (data) => {
      setRiderPos([data.latitude, data.longitude]);
      if (data.eta) setEta(data.eta);
      if (data.distance) setDistance(data.distance);
    });

    socket.on("status-update", (data) => {
      setStatus(data.status);
    });

    const fetchData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const user = JSON.parse(localStorage.getItem("restoUser") || "{}");
        const res = await fetch(`${API_BASE_URL}/api/tracking/${orderId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStatus(data.order.status);
          setAgent(data.order.deliveryAgent);
          if (data.order.riderLocation?.latitude) {
            setRiderPos([data.order.riderLocation.latitude, data.order.riderLocation.longitude]);
          }
          if (data.order.estimatedDeliveryTime) setEta(data.order.estimatedDeliveryTime);
          if (data.order.distanceRemaining) setDistance(`${data.order.distanceRemaining} km`);
        }
      } catch {}
    };
    fetchData();

    return () => {
      leaveOrderRoom(orderId);
      socket.off("rider-location");
      socket.off("status-update");
    };
  }, [orderId]);

  useEffect(() => {
    if (riderPos && customerLocation) {
      setRouteCoords([riderPos, [customerLocation.latitude, customerLocation.longitude]]);
    }
  }, [riderPos, customerLocation]);

  const currentStepIdx = statusSteps.findIndex((s) => s.key === status);
  const currentStep = statusSteps[currentStepIdx];

  const defaultCenter = customerLocation ? [customerLocation.latitude, customerLocation.longitude] : [20.5937, 78.9629];

  return (
    <div className="delivery-tracker">
      <div className="tracker-header">
        <div className="tracker-status-icon">
          {status === "delivered" ? "🎉" : status === "on-the-way" || status === "near-you" ? <Navigation size={24} /> : <Bike size={24} />}
        </div>
        <div>
          <h3>{currentStep?.label || "Order Placed"}</h3>
          {eta && <p className="tracker-eta">Estimated: {eta}</p>}
          {distance && <p className="tracker-distance">{distance} away</p>}
        </div>
      </div>

      <div className="tracker-steps">
        {statusSteps.slice(0, 6).map((step, i) => (
          <div key={step.key} className={`tracker-step ${i <= currentStepIdx ? "done" : ""} ${i === currentStepIdx ? "active" : ""}`}>
            <div className="step-dot">{i < currentStepIdx ? "✓" : i + 1}</div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <div className="tracker-map">
        <MapContainer center={defaultCenter} zoom={14} style={{ height: "300px", width: "100%", borderRadius: "14px" }} ref={mapRef}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {customerLocation && <Marker position={[customerLocation.latitude, customerLocation.longitude]} icon={L.divIcon({ className: "customer-marker", html: '<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"/>', iconSize: [16, 16], iconAnchor: [8, 8] })}><Popup>Your Location</Popup></Marker>}
          {restaurantLocation && <Marker position={[restaurantLocation.latitude, restaurantLocation.longitude]} icon={L.divIcon({ className: "restaurant-marker", html: '<div style="background:#f97316;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"/>', iconSize: [16, 16], iconAnchor: [8, 8] })}><Popup>Restaurant</Popup></Marker>}
          {riderPos && <Marker position={riderPos} icon={riderIcon}><Popup>Rider</Popup></Marker>}
          {routeCoords.length === 2 && <Polyline positions={routeCoords} color="#f97316" weight={3} opacity={0.6} />}
        </MapContainer>
      </div>

      {agent && (
        <div className="tracker-agent">
          <MapPin size={14} />
          <span>Delivery by <strong>{agent.fullName}</strong></span>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracker;
