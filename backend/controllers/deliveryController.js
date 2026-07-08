import DeliveryAgent from "../models/DeliveryAgent.js";
import Order from "../models/Order.js";
import TrackingLocation from "../models/TrackingLocation.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "30d" });

export const agentLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const agent = await DeliveryAgent.findOne({ phone });
    if (!agent || !(await agent.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, token: generateToken(agent._id), agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryAgent: req.agent._id, status: { $ne: "delivered" } }).sort("-createdAt");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    order.status = "preparing";
    order.deliveryAgent = req.agent._id;
    await order.save();
    await DeliveryAgent.findByIdAndUpdate(req.agent._id, { currentOrder: order._id, isAvailable: false });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startDelivery = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, { status: "picked-up", trackingEnabled: true }, { new: true });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, orderId } = req.body;
    const location = await TrackingLocation.create({
      order: orderId,
      deliveryAgent: req.agent._id,
      latitude,
      longitude,
    });
    await Order.findByIdAndUpdate(orderId, { riderLocation: { latitude, longitude } });
    if (req.app.get("io")) {
      req.app.get("io").to(`order_${orderId}`).emit("rider-location", { latitude, longitude, timestamp: location.timestamp });
    }
    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeDelivery = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, { status: "delivered", trackingEnabled: false }, { new: true });
    await DeliveryAgent.findByIdAndUpdate(req.agent._id, { currentOrder: null, isAvailable: true, $inc: { totalDeliveries: 1 } });
    if (req.app.get("io")) {
      req.app.get("io").to(`order_${order._id}`).emit("status-update", { status: "delivered" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgentProfile = async (req, res) => {
  const agent = await DeliveryAgent.findById(req.agent._id).select("-password");
  res.json({ success: true, agent });
};
