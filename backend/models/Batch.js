import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickupPoint: { type: String, required: true },
    deliveryType: { type: String, default: "batch" },
    status: {
      type: String,
      enum: [
        "batched",
        "assigned",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "batched",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);
