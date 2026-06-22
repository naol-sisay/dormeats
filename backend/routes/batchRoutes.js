import express from "express";
import {
  createBatch,
  getBatches,
  getMyBatches,
  updateBatchStatus,
  autoBatch,
  updateBatch,
  assignBatchCarrier,
  cancelBatch,
} from "../controllers/batchController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createBatch);
router.post("/auto", protect, authorize("admin"), autoBatch);
router.get("/", protect, authorize("admin"), getBatches);
router.get("/mine", protect, authorize("carrier"), getMyBatches);
router.put("/:id/status", protect, authorize("carrier"), updateBatchStatus);
router.put("/:id/assign", protect, authorize("admin"), assignBatchCarrier);
router.put("/:id/cancel", protect, authorize("admin"), cancelBatch);
router.put("/:id", protect, authorize("admin"), updateBatch);

export default router;
