import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true },
    landmark: { type: String, default: "" },
    deliveryTime: { type: String, default: "asap" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;