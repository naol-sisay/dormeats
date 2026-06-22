import express from "express";
import {
  getPickupPoints,
  createPickupPoint,
} from "../controllers/pickupController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getPickupPoints);
router.post("/", protect, authorize("admin"), createPickupPoint);

export default router;
