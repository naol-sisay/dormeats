import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    // Whether the admin has approved this vendor to receive orders.
    // Kept in sync with `status` for backward compatibility (students
    // and order flows query on `approved: true`).
    approved: { type: Boolean, default: false },
    // Approval lifecycle: pending -> approved | disapproved
    status: {
      type: String,
      enum: ["pending", "approved", "disapproved"],
      default: "pending",
    },
    // The user account that owns this vendor
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
