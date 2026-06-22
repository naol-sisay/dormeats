import dotenv from "dotenv";
import connectDB from "./config/db.js";

import User from "./models/User.js";
import Vendor from "./models/Vendor.js";
import MenuItem from "./models/MenuItem.js";
import Order from "./models/Order.js";
import Batch from "./models/Batch.js";
import PickupPoint from "./models/PickupPoint.js";

dotenv.config();

// Run with: npm run seed
const seed = async () => {
  try {
    await connectDB();

    // Clear existing data so the seed is repeatable
    await Promise.all([
      User.deleteMany(),
      Vendor.deleteMany(),
      MenuItem.deleteMany(),
      Order.deleteMany(),
      Batch.deleteMany(),
      PickupPoint.deleteMany(),
    ]);
    console.log("Cleared old data");

    // --- Pickup points (fixed set) ---
    const pickupPoints = await PickupPoint.insertMany([
      { name: "Main Library" },
      { name: "Sports Field" },
      { name: "Cafeteria Entrance" },
      { name: "Student Center" },
      { name: "Block 101 Gate" },
    ]);

    // --- Admin ---
    await User.create({
      name: "admin",
      email: "dormeats@gmail.com",
      password: "abc123xyz",
      role: "admin",
      approved: true,
    });

    // --- Student ---
    const student = await User.create({
      name: "Abebe Student",
      email: "student@dormeats.com",
      password: "password123",
      role: "student",
    });

    // --- Carriers ---
    // Approved carrier (can work immediately)
    const carrier = await User.create({
      name: "Sara Carrier",
      email: "carrier@dormeats.com",
      password: "password123",
      role: "carrier",
      status: "approved",
    });

    // Pending carrier (admin must approve before they can work)
    await User.create({
      name: "Dawit Rider",
      email: "carrier2@dormeats.com",
      password: "password123",
      role: "carrier",
      status: "pending",
    });

    // --- Vendors (with owner users) + menus ---
    // Vendor 1: approved
    const vendor1Owner = await User.create({
      name: "Tasty Corner",
      email: "vendor1@dormeats.com",
      password: "password123",
      role: "vendor",
      approved: true,
    });
    const vendor1 = await Vendor.create({
      name: "Tasty Corner",
      location: "Near Block 101",
      approved: true,
      ownerId: vendor1Owner._id,
    });
    vendor1Owner.vendorId = vendor1._id;
    await vendor1Owner.save();

    // Vendor 2: NOT approved (admin can approve from dashboard)
    const vendor2Owner = await User.create({
      name: "Habesha Foods",
      email: "vendor2@dormeats.com",
      password: "password123",
      role: "vendor",
      approved: false,
    });
    const vendor2 = await Vendor.create({
      name: "Habesha Foods",
      location: "Main Cafeteria",
      approved: false,
      ownerId: vendor2Owner._id,
    });
    vendor2Owner.vendorId = vendor2._id;
    await vendor2Owner.save();

    // Menu items
    const menu = await MenuItem.insertMany([
      { vendorId: vendor1._id, name: "Shiro with Injera", price: 60 },
      { vendorId: vendor1._id, name: "Firfir", price: 70 },
      { vendorId: vendor1._id, name: "Pasta", price: 50 },
      { vendorId: vendor2._id, name: "Doro Wat", price: 120 },
      { vendorId: vendor2._id, name: "Tibs", price: 110 },
    ]);

    // --- A sample order from the student to vendor1 ---
    await Order.create({
      userId: student._id,
      vendorId: vendor1._id,
      items: [
        {
          menuItemId: menu[0]._id,
          name: menu[0].name,
          price: menu[0].price,
          quantity: 2,
        },
      ],
      total: menu[0].price * 2,
      status: "pending",
      pickupPoint: pickupPoints[0].name,
    });

    console.log("Seed data inserted!");
    console.log("\nLogin accounts:");
    console.log("  Admin:   dormeats@gmail.com / abc123xyz");
    console.log("  (others below use password123)");
    console.log("  Student: student@dormeats.com");
    console.log("  Vendor:  vendor1@dormeats.com (approved)");
    console.log("  Vendor:  vendor2@dormeats.com (pending approval)");
    console.log("  Carrier: carrier@dormeats.com (approved)");
    console.log("  Carrier: carrier2@dormeats.com (pending approval)");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
