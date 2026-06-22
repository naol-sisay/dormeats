import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import generateToken from "../utils/generateToken.js";

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, location } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      // New carriers must be approved by an admin before they can work.
      // Everyone else is approved by default (schema default).
      status: role === "carrier" ? "pending" : "approved",
    });

    // If registering as a vendor, also create the shop.
    // NOTE: For this launch period, vendors are AUTO-APPROVED on signup so they
    // can start selling immediately without waiting for manual admin approval.
    // To restore manual approval later, set both `approved` flags back to false.
    if (user.role === "vendor") {
      const AUTO_APPROVE_VENDORS = true;

      const vendor = await Vendor.create({
        name,
        location: location || "Campus",
        approved: AUTO_APPROVE_VENDORS,
        ownerId: user._id,
      });
      user.vendorId = vendor._id;
      user.approved = AUTO_APPROVE_VENDORS;
      await user.save();
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
      status: user.status,
      vendorId: user.vendorId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
      status: user.status,
      vendorId: user.vendorId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json(req.user);
};
