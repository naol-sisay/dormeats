import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

// Idempotently create (or reset) the admin account WITHOUT wiping other data.
// Run with: npm run ensure-admin
const ADMIN = {
  name: "admin",
  email: "dormeats@gmail.com",
  password: "abc123xyz",
  role: "admin",
  approved: true,
};

const ensureAdmin = async () => {
  try {
    await connectDB();

    let user = await User.findOne({ email: ADMIN.email });
    if (user) {
      // Make sure the existing account has admin role + the expected password.
      user.name = ADMIN.name;
      user.role = ADMIN.role;
      user.approved = true;
      user.password = ADMIN.password; // re-hashed by the pre-save hook
      await user.save();
      console.log(`Admin account updated: ${ADMIN.email}`);
    } else {
      await User.create(ADMIN);
      console.log(`Admin account created: ${ADMIN.email}`);
    }

    console.log(`Login -> email: ${ADMIN.email}  password: ${ADMIN.password}`);
    process.exit(0);
  } catch (error) {
    console.error("ensureAdmin error:", error);
    process.exit(1);
  }
};

ensureAdmin();
