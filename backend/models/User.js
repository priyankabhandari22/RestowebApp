import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z\s]+$/.test(v);
        },
        message: "Name can only contain letters and spaces",
      },
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Phone number must be exactly 10 digits",
      },
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    address: { type: String, required: true },
    landmark: { type: String, default: "" },
    deliveryTime: { type: String, default: "asap" },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const input = String(candidatePassword || "");
  const stored = String(this.password || "");

  if (!input || !stored) {
    return false;
  }

  // Support legacy plaintext passwords to prevent 500s during login.
  if (!stored.startsWith("$2")) {
    return input === stored;
  }

  return bcrypt.compare(input, stored);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;