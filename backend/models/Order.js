import mongoose from "mongoose";

// Each line in an order: which item, its name/price (snapshot) and quantity
const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    // Links the per-vendor orders that came from a single multi-vendor checkout
    groupId: { type: mongoose.Schema.Types.ObjectId, index: true },
    items: [orderItemSchema],
    total: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        // legacy batch flow values (kept for backward compatibility)
        "batched",
        "out_for_delivery",
        // carrier delivery flow
        "assigned",
        "picked_up",
        "delivered",
        "finished",
        // customer cancelled before preparation completed
        "cancelled",
      ],
      default: "pending",
    },
    pickupPoint: { type: String, required: true },
    // Delivery handling
    deliveryType: { type: String, enum: ["single", "batch"], default: "single" },
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    // Carrier marks this vendor's items collected (pickup checklist)
    pickedUp: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    // Optional customer rating/feedback after delivery
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
