import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const options = {
      amount: order.totals.total * 100,
      currency: "INR",
      receipt: `receipt_${order._id}`,
    };
    const razorpayOrder = await razorpay.orders.create(options);

    await Payment.create({
      order: order._id,
      user: req.user._id,
      method: "razorpay",
      amount: order.totals.total,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
    });

    res.json({ success: true, razorpayOrderId: razorpayOrder.id, amount: order.totals.total * 100 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder").update(sign).digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: "paid", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, paidAt: new Date() }
    );
    await Order.findByIdAndUpdate(orderId, { "totals.paymentStatus": "paid" });

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateUPILink = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const upiId = process.env.MERCHANT_UPI_ID || "merchant@upi";
    const upiLink = `upi://pay?pa=${upiId}&pn=QuickHungry&am=${order.totals.total}&cu=INR&tn=Order${order._id}`;

    res.json({ success: true, upiLink, amount: order.totals.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateQRCodeData = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const upiId = process.env.MERCHANT_UPI_ID || "merchant@upi";
    const qrData = `upi://pay?pa=${upiId}&pn=QuickHungry&am=${order.totals.total}&cu=INR&tn=QR${order._id}`;

    res.json({ success: true, qrData, amount: order.totals.total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId }).populate("order", "status totals");
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
