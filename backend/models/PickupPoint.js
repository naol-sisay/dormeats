import mongoose from "mongoose";

const pickupPointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("PickupPoint", pickupPointSchema);
