import jwt from "jsonwebtoken";
import User from "../models/User.js";
import DeliveryAgent from "../models/DeliveryAgent.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ success: false, message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ success: false, message: "User not found" });
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

export const protectAgent = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.agent = await DeliveryAgent.findById(decoded.id).select("-password");
    if (!req.agent) return res.status(401).json({ success: false, message: "Agent not found" });
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token failed" });
  }
};
