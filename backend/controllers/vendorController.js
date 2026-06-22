import Vendor from "../models/Vendor.js";

// GET /api/vendors  -> students see only approved vendors
export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ approved: true });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vendors/:id
export const getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
