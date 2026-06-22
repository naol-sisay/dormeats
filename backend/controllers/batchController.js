import Batch from "../models/Batch.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// Shared populate shape for returning a batch with its orders + vendors
const populateBatch = (query) =>
  query
    .populate("carrierId", "name email")
    .populate({
      path: "orders",
      populate: { path: "vendorId", select: "name location" },
    });

// --- Automatic batching -----------------------------------------------------
// Group ready, unbatched, unassigned orders by pickup point. Any pickup point
// with 2+ such orders becomes a batch. Returns the batches created.
// Safe to call repeatedly (it only ever groups orders not already in a batch).
export const autoCreateBatches = async () => {
  const orders = await Order.find({
    status: "ready",
    batchId: { $in: [null, undefined] },
    carrierId: { $in: [null, undefined] },
  });

  // Bucket by pickup point
  const byPickup = {};
  for (const o of orders) {
    (byPickup[o.pickupPoint] ||= []).push(o);
  }

  const created = [];
  for (const [pickupPoint, group] of Object.entries(byPickup)) {
    if (group.length < 2) continue; // a lone order stays a single delivery

    const batch = await Batch.create({
      orders: group.map((o) => o._id),
      pickupPoint,
      status: "batched",
      deliveryType: "batch",
    });

    await Order.updateMany(
      { _id: { $in: group.map((o) => o._id) } },
      { $set: { batchId: batch._id, deliveryType: "batch" } }
    );
    created.push(batch);
  }

  return created;
};

// POST /api/batches/auto  (admin) -> run auto-batching on demand
export const autoBatch = async (req, res) => {
  try {
    const created = await autoCreateBatches();
    res.json({ created: created.length, batches: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/batches  (admin) -> group chosen orders into a batch
export const createBatch = async (req, res) => {
  try {
    const { orderIds, carrierId, pickupPoint } = req.body;

    if (!orderIds || orderIds.length === 0 || !pickupPoint) {
      return res
        .status(400)
        .json({ message: "orderIds and pickupPoint are required" });
    }

    const batch = await Batch.create({
      orders: orderIds,
      carrierId: carrierId || null,
      pickupPoint,
      status: carrierId ? "assigned" : "batched",
      deliveryType: "batch",
    });

    // Tag the included orders as belonging to this batch. They keep their
    // "ready" status until a carrier accepts (or are "assigned" if a carrier
    // was provided up front).
    await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: {
          batchId: batch._id,
          deliveryType: "batch",
          ...(carrierId ? { carrierId, status: "assigned" } : {}),
        },
      }
    );

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/batches  (admin) -> all batches
export const getBatches = async (req, res) => {
  try {
    const batches = await populateBatch(Batch.find()).sort("-createdAt");
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/batches/mine  (carrier) -> batches assigned to me
export const getMyBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ carrierId: req.user._id })
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

// PUT /api/batches/:id/status  (carrier) -> advance the batch (legacy path)
export const updateBatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["out_for_delivery", "delivered"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be out_for_delivery or delivered" });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (!batch.carrierId || batch.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your batch" });
    }

    batch.status = status;
    await batch.save();

    await Order.updateMany(
      { _id: { $in: batch.orders } },
      { $set: { status } }
    );

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Admin batch management --------------------------------------------------

// PUT /api/batches/:id  (admin) -> edit orders / pickup point of a batch
export const updateBatch = async (req, res) => {
  try {
    const { orderIds, pickupPoint } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (batch.status === "delivered" || batch.status === "cancelled") {
      return res
        .status(400)
        .json({ message: `Cannot edit a ${batch.status} batch` });
    }

    if (Array.isArray(orderIds)) {
      const oldIds = batch.orders.map((o) => o.toString());
      const newIds = orderIds.map((o) => o.toString());
      const removed = oldIds.filter((id) => !newIds.includes(id));
      const added = newIds.filter((id) => !oldIds.includes(id));

      // Release removed orders back to the available pool
      if (removed.length) {
        await Order.updateMany(
          { _id: { $in: removed } },
          {
            $set: { status: "ready", deliveryType: "single" },
            $unset: { batchId: "", carrierId: "" },
          }
        );
      }
      // Pull added orders into this batch
      if (added.length) {
        await Order.updateMany(
          { _id: { $in: added } },
          {
            $set: {
              batchId: batch._id,
              deliveryType: "batch",
              ...(batch.carrierId
                ? { carrierId: batch.carrierId, status: "assigned" }
                : {}),
            },
          }
        );
      }
      batch.orders = orderIds;
    }

    if (pickupPoint) batch.pickupPoint = pickupPoint;
    await batch.save();

    res.json(await populateBatch(Batch.findById(batch._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/batches/:id/assign  (admin) -> assign a carrier manually
export const assignBatchCarrier = async (req, res) => {
  try {
    const { carrierId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (carrierId) {
      const carrier = await User.findById(carrierId);
      if (!carrier || carrier.role !== "carrier") {
        return res.status(400).json({ message: "Invalid carrier" });
      }
      batch.carrierId = carrierId;
      if (batch.status === "batched") batch.status = "assigned";
      await Order.updateMany(
        { _id: { $in: batch.orders } },
        { $set: { carrierId, status: "assigned" } }
      );
    } else {
      // Unassign
      batch.carrierId = null;
      batch.status = "batched";
      await Order.updateMany(
        { _id: { $in: batch.orders } },
        { $set: { status: "ready" }, $unset: { carrierId: "" } }
      );
    }

    await batch.save();
    res.json(await populateBatch(Batch.findById(batch._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/batches/:id/cancel  (admin) -> cancel a batch, free its orders
export const cancelBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (batch.status === "delivered") {
      return res.status(400).json({ message: "Batch already delivered" });
    }

    // Release member orders back to available single deliveries
    await Order.updateMany(
      { _id: { $in: batch.orders } },
      {
        $set: { status: "ready", deliveryType: "single" },
        $unset: { batchId: "", carrierId: "" },
      }
    );

    batch.status = "cancelled";
    batch.carrierId = null;
    await batch.save();

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
