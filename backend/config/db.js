import mongoose from "mongoose";
import dns from "dns";

// Some local/router DNS servers refuse Node's SRV lookups (querySrv ECONNREFUSED),
// which breaks mongodb+srv:// connections even when `nslookup` works.
// Force a reliable public resolver so the Atlas SRV records resolve.
// Only do this locally — on Vercel the platform DNS already resolves SRV records,
// and overriding it can actually break resolution.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

// In a serverless environment (Vercel) the module is reused across invocations,
// so we cache the connection on the global object. This prevents opening a new
// connection on every request and avoids "buffering timed out" errors caused by
// running queries before the connection is ready.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

// Connect to MongoDB using the URI from .env (returns a cached connection if any)
const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not set. Add it to your environment variables (Vercel project settings)."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        // Fail fast instead of buffering forever when the DB is unreachable.
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset so the next request can retry instead of being stuck on a failed promise.
    cached.promise = null;
    console.error("MongoDB connection error:", error.message);
    throw error;
  }

  return cached.conn;
};

export default connectDB;
