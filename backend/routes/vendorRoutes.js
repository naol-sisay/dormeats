import express from "express";
import { getVendors, getVendor } from "../controllers/vendorController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getVendors);
router.get("/:id", protect, getVendor);

export default router;
