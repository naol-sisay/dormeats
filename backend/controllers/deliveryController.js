import Order from "../models/Order.js";
import Batch from "../models/Batch.js";

// A carrier may only have ONE active delivery (single order) or batch at a time.
const hasActiveAssignment = async (carrierId) => {
  const activeOrder = await Order.findOne({
    carrierId,
    deliveryType: "single",
    status: { $in: ["assigned", "picked_up"] },
  });
  if (activeOrder) return true;

  const activeBatch = await Batch.findOne({
    carrierId,
    status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
  });
  return !!activeBatch;
};

// --- Available work ----------------------------------------------------------

// GET /api/deliveries/available/orders -> ready single deliveries (no batch/carrier)
export const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: "ready",
      batchId: { $in: [null, undefined] },
      carrierId: { $in: [null, undefined] },
    })
      .populate("vendorId", "name location")
      .populate("userId", "name")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/deliveries/available/batches -> grouped batches with no carrier yet
export const getAvailableBatches = async (req, res) => {
  try {
    const batches = await Batch.find({
      status: "batched",
      carrierId: { $in: [null, undefined] },
    })
      .populate({
        path: "orders",
        populate: { path: "vendorId", select: "name location" },
      })
      .sort("-createdAt");
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- My work -----------------------------------------------------------------

// GET /api/deliveries/active -> the carrier's current single order and/or batch
export const getActive = async (req, res) => {
  try {
    const orders = await Order.find({
      carrierId: req.user._id,
      deliveryType: "single",
      status: { $in: ["assigned", "picked_up"] },
    })
      .populate("vendorId", "name location")
      .populate("userId", "name");

    const batches = await Batch.find({
      carrierId: req.user._id,
      status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
    }).populate({
      path: "orders",
      populate: { path: "vendorId", select: "name location" },
    });

    res.json({ orders, batches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/deliveries/history -> the carrier's completed deliveries
export const getHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      carrierId: req.user._id,
      deliveryType: "single",
      status: { $in: ["delivered", "finished"] },
    })
      .populate("vendorId", "name location")
      .sort("-deliveredAt");

    const batches = await Batch.find({
      carrierId: req.user._id,
      status: "delivered",
    })
      .populate({
        path: "orders",
        populate: { path: "vendorId", select: "name location" },
      })
      .sort("-updatedAt");

    res.json({ orders, batches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Accept ------------------------------------------------------------------

// POST /api/deliveries/orders/:id/accept -> claim a single delivery
export const acceptOrder = async (req, res) => {
  try {
    if (await hasActiveAssignment(req.user._id)) {
      return res.status(400).json({
        message: "Finish your current delivery before accepting another.",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "ready" || order.batchId || order.carrierId) {
      return res
        .status(400)
        .json({ message: "This delivery is no longer available." });
    }

    order.carrierId = req.user._id;
    order.deliveryType = "single";
    order.status = "assigned";
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/deliveries/batches/:id/accept -> claim a batch
export const acceptBatch = async (req, res) => {
  try {
    if (await hasActiveAssignment(req.user._id)) {
      return res.status(400).json({
        message: "Finish your current delivery before accepting another.",
      });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (batch.status !== "batched" || batch.carrierId) {
      return res
        .status(400)
        .json({ message: "This batch is no longer available." });
    }

    batch.carrierId = req.user._id;
    batch.status = "assigned";
    await batch.save();

    await Order.updateMany(
      { _id: { $in: batch.orders } },
      { $set: { carrierId: req.user._id, status: "assigned" } }
    );

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Pickup checklist --------------------------------------------------------

// PUT /api/deliveries/orders/:id/pickup -> mark a single delivery collected
export const pickupOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.carrierId || order.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your delivery" });
    }

    order.pickedUp = true;
    order.status = "picked_up";
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/deliveries/batches/:id/orders/:orderId/pickup
// -> mark one vendor's order in the batch as collected
export const pickupBatchOrder = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (!batch.carrierId || batch.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your batch" });
    }
    if (!batch.orders.map((o) => o.toString()).includes(req.params.orderId)) {
      return res.status(404).json({ message: "Order not in this batch" });
    }

    await Order.findByIdAndUpdate(req.params.orderId, {
      $set: { pickedUp: true, status: "picked_up" },
    });

    // When every vendor in the batch has been collected, advance the batch
    const remaining = await Order.countDocuments({
      _id: { $in: batch.orders },
      pickedUp: { $ne: true },
    });
    if (remaining === 0 && batch.status === "assigned") {
      batch.status = "picked_up";
      await batch.save();
    }

    const populated = await Batch.findById(batch._id).populate({
      path: "orders",
      populate: { path: "vendorId", select: "name location" },
    });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Delivery completion (the completion event) ------------------------------

// PUT /api/deliveries/orders/:id/deliver -> complete a single delivery
export const deliverOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.carrierId || order.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your delivery" });
    }

    order.status = "finished";
    order.pickedUp = true;
    order.deliveredAt = new Date();
    await order.save();

    res.json({ message: "Delivery Completed", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/deliveries/batches/:id/deliver -> complete a batch
export const deliverBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (!batch.carrierId || batch.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your batch" });
    }

    batch.status = "delivered";
    await batch.save();

    await Order.updateMany(
      { _id: { $in: batch.orders } },
      { $set: { status: "finished", pickedUp: true, deliveredAt: new Date() } }
    );

    res.json({ message: "Delivery Completed", batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
