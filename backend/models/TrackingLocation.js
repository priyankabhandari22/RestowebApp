import mongoose from "mongoose";

const trackingLocationSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAgent", required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

trackingLocationSchema.index({ order: 1, timestamp: -1 });

const TrackingLocation = mongoose.models.TrackingLocation || mongoose.model("TrackingLocation", trackingLocationSchema);
export default TrackingLocation;
