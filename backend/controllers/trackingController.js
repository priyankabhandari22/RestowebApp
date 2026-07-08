import TrackingLocation from "../models/TrackingLocation.js";
import Order from "../models/Order.js";

export const getTrackingData = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("deliveryAgent", "fullName phone vehicleType rating");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    const locations = await TrackingLocation.find({ order: req.params.orderId }).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, order, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
