import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  getDeliveryAgents,
  createDeliveryAgent,
  getDashboardStats,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/orders", protect, getAllOrders);
router.put("/orders/:orderId/status", protect, updateOrderStatus);
router.get("/delivery-agents", protect, getDeliveryAgents);
router.post("/delivery-agents", protect, createDeliveryAgent);
router.get("/stats", protect, getDashboardStats);

export default router;
