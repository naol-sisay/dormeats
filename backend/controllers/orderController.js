import mongoose from "mongoose";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import { autoCreateBatches } from "./batchController.js";

// Build priced order-item lines from the DB so prices can't be faked client-side
const buildOrderItems = async (items) => {
  const orderItems = [];
  let total = 0;
  for (const line of items || []) {
    const menuItem = await MenuItem.findById(line.menuItemId);
    if (!menuItem) continue;
    const quantity = line.quantity || 1;
    orderItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
    total += menuItem.price * quantity;
  }
  return { orderItems, total };
};

// POST /api/orders  (student) -> place a new order.
// Supports a multi-vendor checkout via `carts: [{ vendorId, items }]`
// and stays backward-compatible with the single `{ vendorId, items }` shape.
// Each vendor becomes its own Order, all sharing one `groupId` (one checkout).
export const createOrder = async (req, res) => {
  try {
    const { carts, vendorId, items, pickupPoint } = req.body;

    if (!pickupPoint) {
      return res.status(400).json({ message: "pickupPoint is required" });
    }

    // Normalise both payload shapes into a list of per-vendor carts
    const vendorCarts =
      Array.isArray(carts) && carts.length > 0
        ? carts
        : vendorId
        ? [{ vendorId, items }]
        : [];

    if (vendorCarts.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one vendor cart is required" });
    }

    const groupId = new mongoose.Types.ObjectId();
    const created = [];

    for (const cart of vendorCarts) {
      if (!cart.vendorId || !cart.items || cart.items.length === 0) continue;
      const { orderItems, total } = await buildOrderItems(cart.items);
      if (orderItems.length === 0) continue;

      const order = await Order.create({
        userId: req.user._id,
        vendorId: cart.vendorId,
        groupId,
        items: orderItems,
        total,
        pickupPoint,
        status: "pending",
      });
      created.push(order);
    }

    if (created.length === 0) {
      return res.status(400).json({ message: "No valid items in order" });
    }

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/mine  (student) -> my orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("vendorId", "name location")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/vendor  (vendor) -> orders for my shop
export const getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.user.vendorId })
      .populate("userId", "name email")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id/status  (vendor) -> update status of one of my orders
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["accepted", "preparing", "ready"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: "Vendors can only set accepted, preparing or ready" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.vendorId.toString() !== req.user.vendorId.toString()) {
      return res.status(403).json({ message: "Not your order" });
    }

    order.status = status;
    await order.save();

    // When an order becomes ready it is automatically available to carriers.
    // Try to auto-group ready orders heading to the same pickup point.
    if (status === "ready") {
      autoCreateBatches().catch((err) =>
        console.error("autoCreateBatches failed:", err.message)
      );
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Statuses at/after which a customer can no longer cancel (preparation done /
// the order has moved into the delivery pipeline).
const CANCELLABLE_STATUSES = ["pending", "accepted", "preparing"];

// PUT /api/orders/:id/cancel  (student) -> cancel an order before it's ready.
// For multi-vendor checkouts every order in the group is cancelled together,
// and the whole order is blocked if ANY vendor has already marked it ready.
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your order" });
    }

    // All per-vendor orders from the same checkout cancel together
    const filter = order.groupId
      ? { groupId: order.groupId, userId: req.user._id }
      : { _id: order._id };

    const groupOrders = await Order.find(filter);

    const blocked = groupOrders.some(
      (o) => !CANCELLABLE_STATUSES.includes(o.status)
    );
    if (blocked) {
      return res.status(400).json({
        message:
          "This order can no longer be cancelled because preparation has been completed.",
      });
    }

    // Cancelling removes the order from vendors' active queues
    await Order.updateMany(filter, { $set: { status: "cancelled" } });

    res.json({ message: "Your order has been cancelled successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id/feedback  (student) -> rate/comment on a delivered order
export const submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (!["delivered", "finished"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "You can only rate a delivered order" });
    }

    if (rating != null) order.rating = rating;
    if (feedback != null) order.feedback = feedback;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
