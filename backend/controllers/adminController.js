import Order from "../models/Order.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "fullName phone")
      .populate("deliveryAgent", "fullName phone")
      .sort("-createdAt");
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryAgentId } = req.body;
    const update = {};
    if (status) update.status = status;
    if (deliveryAgentId) update.deliveryAgent = deliveryAgentId;
    const order = await Order.findByIdAndUpdate(req.params.orderId, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (deliveryAgentId) {
      await DeliveryAgent.findByIdAndUpdate(deliveryAgentId, { currentOrder: order._id, isAvailable: false });
    }
    if (req.app.get("io")) {
      req.app.get("io").to(`order_${order._id}`).emit("status-update", { status: order.status });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeliveryAgents = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find().select("-password");
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDeliveryAgent = async (req, res) => {
  try {
    const { fullName, phone, password, vehicleType } = req.body;
    const agent = await DeliveryAgent.create({ fullName, phone, password, vehicleType });
    res.status(201).json({ success: true, agent: { ...agent.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({ status: { $in: ["received", "preparing", "picked-up", "on-the-way", "near-you"] } });
    const deliveredToday = await Order.countDocuments({ status: "delivered", updatedAt: { $gte: new Date().setHours(0, 0, 0, 0) } });
    const totalRevenue = await Order.aggregate([{ $match: { status: "delivered" } }, { $group: { _id: null, total: { $sum: "$totals.total" } } }]);
    const totalUsers = await User.countDocuments();
    const availableAgents = await DeliveryAgent.countDocuments({ isAvailable: true });

    res.json({
      success: true,
      stats: {
        totalOrders,
        activeOrders,
        deliveredToday,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUsers,
        availableAgents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
