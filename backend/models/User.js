import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "vendor", "admin", "carrier"],
      default: "student",
    },
    // Only relevant for vendor accounts: admin must approve them first
    approved: { type: Boolean, default: false },
    // Account approval lifecycle. Used for carrier accounts (admin controlled):
    // pending -> approved | disapproved, and approved <-> suspended.
    // Defaults to "approved" so existing users and non-carrier roles are unaffected.
    status: {
      type: String,
      enum: ["pending", "approved", "disapproved", "suspended"],
      default: "approved",
    },
    // Link a vendor user to its Vendor (shop) document
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  },
  { timestamps: true }
);

// Hash the password before saving (only when it changed)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper to compare a plain password with the stored hash
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
