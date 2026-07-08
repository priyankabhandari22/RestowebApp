import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getTrackingData } from "../controllers/trackingController.js";

const router = express.Router();

router.get("/:orderId", protect, getTrackingData);

export default router;
