import mongoose from "mongoose";
import Order from "../models/Order.js";

// @desc    Get all orders (Admin only or filter by user)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("user", "fullName phone address landmark")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load orders.", error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "fullName phone address landmark");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Check ownership
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading order.", error: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { items, totals, paymentMethod, customerName, phone, address, landmark } = req.body;

    const order = new Order({
      user: req.user._id,
      customerName,
      phone,
      address,
      landmark,
      items,
      totals,
      paymentMethod,
    });

    const savedOrder = await order.save();
    const populatedOrder = await savedOrder.populate("user", "fullName phone");

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this order" });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Order deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting order.", error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("user", "fullName phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, message: "Order status updated.", order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
