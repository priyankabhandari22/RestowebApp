import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { fullName, phone, password, address, landmark } = req.body;

    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists with this phone number" });
    }

    const user = await User.create({
      fullName,
      phone,
      password,
      address,
      landmark,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          landmark: user.landmark,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "User already exists with this phone number" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").trim();
    const password = String(req.body?.password || "");

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone and password are required" });
    }

    const user = await User.findOne({ phone });

    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          landmark: user.landmark,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid phone number or password" });
    }
  } catch {
    res.status(500).json({ success: false, message: "Unable to process login right now" });
  }
};
