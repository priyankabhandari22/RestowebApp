import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    id: Number,
    name: { type: String, required: true },
    category: String,
    image: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      validate: {
        validator: function (v) { return /^[a-zA-Z\s]{3,}$/.test(v); },
        message: "Customer name must be at least 3 letters",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v) { return /^\d{10}$/.test(v); },
        message: "Phone must be exactly 10 digits",
      },
    },
    address: { type: String, required: [true, "Delivery address is required"] },
    landmark: { type: String, required: [true, "Landmark is required"] },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) { return v && v.length > 0; },
        message: "Order must contain at least one item",
      },
    },
    totals: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      tax: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    paymentMethod: { type: String, default: "upi-card" },
    status: {
      type: String,
      enum: ["received", "preparing", "picked-up", "on-the-way", "near-you", "delivered", "cancelled"],
      default: "received",
    },
    deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryAgent", default: null },
    customerLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    restaurantLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    riderLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    trackingEnabled: { type: Boolean, default: false },
    estimatedDeliveryTime: { type: String },
    distanceRemaining: { type: Number },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
