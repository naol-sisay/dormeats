import express from "express";
import {
  getMenuItems,
  getMyMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public-ish (any logged-in user) listing
router.get("/", protect, getMenuItems);

// Vendor-only management
router.get("/mine", protect, authorize("vendor"), getMyMenuItems);
router.post("/", protect, authorize("vendor"), createMenuItem);
router.put("/:id", protect, authorize("vendor"), updateMenuItem);
router.delete("/:id", protect, authorize("vendor"), deleteMenuItem);

export default router;
