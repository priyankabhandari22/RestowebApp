import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

const sendNotFound = (res, message) => res.status(404).json({ message });

const parsePrice = (price) => Number(String(price).replace(/[^\d]/g, "")) || 0;

const buildOrderPayload = async (body) => {
  const { customer, items, totals, paymentMethod, status, userId } = body || {};

  const normalizedItems = Array.isArray(items)
    ? items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
        price: parsePrice(item.price),
        quantity: Number(item.quantity) || 1,
      }))
    : [];

  let user = null;

  if (userId && mongoose.isValidObjectId(userId)) {
    user = await User.findById(userId);
  }

  if (!user && customer?.phone) {
    user = await User.findOneAndUpdate(
      { phone: customer.phone },
      {
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        landmark: customer.landmark || "",
        deliveryTime: customer.deliveryTime || "asap",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  return {
    user,
    normalizedItems,
    totals: {
      subtotal: Number(totals?.subtotal) || 0,
      deliveryFee: Number(totals?.deliveryFee) || 0,
      tax: Number(totals?.tax) || 0,
      total: Number(totals?.total) || 0,
    },
    paymentMethod: paymentMethod || "upi-card",
    status: status || "received",
  };
};

export const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find().populate("user").sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load orders.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const order = await Order.findById(req.params.id).populate("user");

    if (!order) {
      return sendNotFound(res, "Order not found.");
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load the order.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB is not connected. Add MONGODB_URI to your .env file.",
      });
    }

    const { user, normalizedItems, totals, paymentMethod, status } = await buildOrderPayload(req.body);

    if (!user) {
      return res.status(400).json({
        message: "A valid userId or customer details are required to create an order.",
      });
    }

    if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) {
      return res.status(400).json({
        message: "At least one order item is required.",
      });
    }

    const order = await Order.create({
      user: user._id,
      items: normalizedItems,
      totals,
      paymentMethod,
      status,
    }).then((savedOrder) => savedOrder.populate("user"));

    res.status(201).json({
      message: "Order saved successfully.",
      orderId: order._id,
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to save the order.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB is not connected. Add MONGODB_URI to your .env file.",
      });
    }

    const existingOrder = await Order.findById(req.params.id);

    if (!existingOrder) {
      return sendNotFound(res, "Order not found.");
    }

    const { user, normalizedItems, totals, paymentMethod, status } = await buildOrderPayload(req.body);

    if (req.body?.customer || req.body?.userId) {
      if (!user) {
        return res.status(400).json({
          message: "A valid userId or customer details are required to update the order.",
        });
      }

      existingOrder.user = user._id;
    }

    if (Array.isArray(req.body?.items)) {
      existingOrder.items = normalizedItems;
    }

    if (req.body?.totals) {
      existingOrder.totals = totals;
    }

    if (req.body?.paymentMethod) {
      existingOrder.paymentMethod = paymentMethod;
    }

    if (req.body?.status) {
      existingOrder.status = status;
    }

    await existingOrder.save();

    const order = await Order.findById(existingOrder._id).populate("user");

    res.json({
      message: "Order updated successfully.",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update order.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const deletedOrder = await Order.findByIdAndDelete(req.params.id).populate("user");

    if (!deletedOrder) {
      return sendNotFound(res, "Order not found.");
    }

    res.json({
      message: "Order deleted successfully.",
      order: deletedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete order.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};