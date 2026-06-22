import express from "express";
import {
  createOrder,
  getMyOrders,
  getVendorOrders,
  updateOrderStatus,
  submitFeedback,
  cancelOrder,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("student"), createOrder);
router.get("/mine", protect, authorize("student"), getMyOrders);
router.get("/vendor", protect, authorize("vendor"), getVendorOrders);
router.put("/:id/status", protect, authorize("vendor"), updateOrderStatus);
router.put("/:id/feedback", protect, authorize("student"), submitFeedback);
router.put("/:id/cancel", protect, authorize("student"), cancelOrder);

export default router;
