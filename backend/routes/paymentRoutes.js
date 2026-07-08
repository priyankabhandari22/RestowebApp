import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  generateUPILink,
  generateQRCodeData,
  getPaymentStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/razorpay/create-order", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.post("/upi/link", protect, generateUPILink);
router.post("/qr/data", protect, generateQRCodeData);
router.get("/status/:orderId", protect, getPaymentStatus);

export default router;
