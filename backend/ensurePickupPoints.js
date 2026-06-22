import dotenv from "dotenv";
import connectDB from "./config/db.js";
import PickupPoint from "./models/PickupPoint.js";

dotenv.config();

// Idempotently make sure some pickup points exist, WITHOUT wiping other data.
// Run with: npm run ensure-pickups
const DEFAULTS = [
  "Main Library",
  "Sports Field",
  "Cafeteria Entrance",
  "Student Center",
  "Block 101 Gate",
];

const ensurePickupPoints = async () => {
  try {
    await connectDB();

    let created = 0;
    for (const name of DEFAULTS) {
      const exists = await PickupPoint.findOne({ name });
      if (!exists) {
        await PickupPoint.create({ name });
        created++;
      }
    }

    const total = await PickupPoint.countDocuments();
    console.log(`Pickup points ensured. Added ${created}, total now ${total}.`);
    process.exit(0);
  } catch (error) {
    console.error("ensurePickupPoints error:", error);
    process.exit(1);
  }
};

ensurePickupPoints();
