import express from "express";
import {
  getUsers,
  getAllVendors,
  approveVendor,
  disapproveVendor,
  getCarriers,
  setCarrierStatus,
  getAllOrders,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Every route here is admin-only
router.use(protect, authorize("admin"));

router.get("/users", getUsers);
router.get("/vendors", getAllVendors);
router.put("/vendors/:id/approve", approveVendor);
router.put("/vendors/:id/disapprove", disapproveVendor);
router.get("/carriers", getCarriers);
router.put("/carriers/:id/status", setCarrierStatus);
router.get("/orders", getAllOrders);

export default router;
