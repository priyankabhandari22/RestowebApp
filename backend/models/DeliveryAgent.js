import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const deliveryAgentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    vehicleType: { type: String, enum: ["bike", "scooter", "cycle", "walk"], default: "bike" },
    rating: { type: Number, default: 5.0 },
    totalDeliveries: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliveryAgentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

deliveryAgentSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const DeliveryAgent = mongoose.models.DeliveryAgent || mongoose.model("DeliveryAgent", deliveryAgentSchema);
export default DeliveryAgent;
