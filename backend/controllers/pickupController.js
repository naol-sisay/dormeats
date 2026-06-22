import PickupPoint from "../models/PickupPoint.js";

// GET /api/pickup-points  -> list pickup points (anyone logged in)
export const getPickupPoints = async (req, res) => {
  try {
    const points = await PickupPoint.find().sort("name");
    res.json(points);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/pickup-points  (admin) -> add a pickup point
export const createPickupPoint = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const point = await PickupPoint.create({ name });
    res.status(201).json(point);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
