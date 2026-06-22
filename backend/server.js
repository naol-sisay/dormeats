import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pickupRoutes from "./routes/pickupRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check (does not need the database)
app.get("/", (req, res) => {
  res.json({ message: "DormEats API is running" });
});

// Ensure the database is connected before handling any API request.
// In a serverless environment the connection must be established (and awaited)
// on each cold start, otherwise queries buffer and time out with a 500.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Database connection failed", error: error.message });
  }
});

// All API routes live on one router so we can mount it at both "/api" and "/".
// Locally the frontend hits "/api/auth/login". On Vercel the "/api" routePrefix
// is stripped before the request reaches Express, so it arrives as "/auth/login".
// Mounting at both paths makes the backend work in either environment.
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/vendors", vendorRoutes);
apiRouter.use("/menu", menuRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/batches", batchRoutes);
apiRouter.use("/deliveries", deliveryRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/pickup-points", pickupRoutes);

app.use("/api", apiRouter);
app.use("/", apiRouter);

// Simple 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Local Development Daemon
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Vercel Serverless Export
export default app;