import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import Order from "../models/Order.js";

// GET /api/admin/users  -> list all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort("-createdAt");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/vendors  -> list all vendors (approved or not)
export const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort("-createdAt");
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/vendors/:id/approve  -> approve a vendor
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.approved = true;
    vendor.status = "approved";
    await vendor.save();

    // Keep the owner user's approved flag in sync
    if (vendor.ownerId) {
      await User.findByIdAndUpdate(vendor.ownerId, { approved: true });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/vendors/:id/disapprove  -> disapprove a vendor
export const disapproveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.approved = false;
    vendor.status = "disapproved";
    await vendor.save();

    // Keep the owner user's approved flag in sync
    if (vendor.ownerId) {
      await User.findByIdAndUpdate(vendor.ownerId, { approved: false });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/carriers  -> list carriers (for approval + assigning batches)
export const getCarriers = async (req, res) => {
  try {
    const carriers = await User.find({ role: "carrier" })
      .select("name email status")
      .sort("-createdAt");
    res.json(carriers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/admin/carriers/:id/status  -> approve/disapprove/suspend/reactivate
export const setCarrierStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["approved", "disapproved", "suspended", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "status must be approved, disapproved, suspended or pending",
      });
    }

    const carrier = await User.findById(req.params.id);
    if (!carrier || carrier.role !== "carrier") {
      return res.status(404).json({ message: "Carrier not found" });
    }

    carrier.status = status;
    await carrier.save();

    res.json({
      _id: carrier._id,
      name: carrier.name,
      email: carrier.email,
      status: carrier.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/orders  -> all orders (for batching)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("vendorId", "name location")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
