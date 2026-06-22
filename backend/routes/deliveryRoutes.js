import express from "express";
import {
  getAvailableOrders,
  getAvailableBatches,
  getActive,
  getHistory,
  acceptOrder,
  acceptBatch,
  pickupOrder,
  pickupBatchOrder,
  deliverOrder,
  deliverBatch,
} from "../controllers/deliveryController.js";
import { protect, requireApprovedCarrier } from "../middleware/auth.js";

const router = express.Router();

// Every route is for approved carriers only
router.use(protect, requireApprovedCarrier);

router.get("/available/orders", getAvailableOrders);
router.get("/available/batches", getAvailableBatches);
router.get("/active", getActive);
router.get("/history", getHistory);

router.post("/orders/:id/accept", acceptOrder);
router.post("/batches/:id/accept", acceptBatch);

router.put("/orders/:id/pickup", pickupOrder);
router.put("/batches/:id/orders/:orderId/pickup", pickupBatchOrder);

router.put("/orders/:id/deliver", deliverOrder);
router.put("/batches/:id/deliver", deliverBatch);

export default router;
