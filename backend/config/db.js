import mongoose from "mongoose";
import dns from "dns";

// Some local/router DNS servers refuse Node's SRV lookups (querySrv ECONNREFUSED),
// which breaks mongodb+srv:// connections even when `nslookup` works.
// Force a reliable public resolver so the Atlas SRV records resolve.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Connect to MongoDB using the URI from .env
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
