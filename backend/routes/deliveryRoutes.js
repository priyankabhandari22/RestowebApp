import express from "express";
import { protectAgent } from "../middleware/authMiddleware.js";
import {
  agentLogin,
  getAssignedOrders,
  acceptOrder,
  startDelivery,
  updateLocation,
  completeDelivery,
  getAgentProfile,
} from "../controllers/deliveryController.js";

const router = express.Router();

router.post("/login", agentLogin);
router.get("/profile", protectAgent, getAgentProfile);
router.get("/orders", protectAgent, getAssignedOrders);
router.put("/orders/:orderId/accept", protectAgent, acceptOrder);
router.put("/orders/:orderId/start-delivery", protectAgent, startDelivery);
router.post("/location", protectAgent, updateLocation);
router.put("/orders/:orderId/complete", protectAgent, completeDelivery);

export default router;
