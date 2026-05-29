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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    totals: {
      subtotal: { type: Number, required: true, default: 0 },
      deliveryFee: { type: Number, required: true, default: 0 },
      tax: { type: Number, required: true, default: 0 },
      total: { type: Number, required: true, default: 0 },
    },
    paymentMethod: { type: String, default: "upi-card" },
    status: { type: String, default: "received" },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
