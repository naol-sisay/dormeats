import MenuItem from "../models/MenuItem.js";

// GET /api/menu?vendorId=xxx  -> list menu items (optionally by vendor)
export const getMenuItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;
    const items = await MenuItem.find(filter);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/menu/mine  -> menu items for the logged-in vendor
export const getMyMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ vendorId: req.user.vendorId });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/menu  (vendor only)
export const createMenuItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    const item = await MenuItem.create({
      vendorId: req.user.vendorId,
      name,
      price,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/menu/:id  (vendor only, own items)
export const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.vendorId.toString() !== req.user.vendorId.toString()) {
      return res.status(403).json({ message: "Not your item" });
    }
    item.name = req.body.name ?? item.name;
    item.price = req.body.price ?? item.price;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/menu/:id  (vendor only, own items)
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.vendorId.toString() !== req.user.vendorId.toString()) {
      return res.status(403).json({ message: "Not your item" });
    }
    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
