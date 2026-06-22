import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT and attach the user to req.user
export const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Restrict a route to one or more roles. Usage: authorize("admin", "vendor")
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};

// Allow only carriers whose account has been approved by an admin.
export const requireApprovedCarrier = (req, res, next) => {
  if (req.user.role !== "carrier") {
    return res
      .status(403)
      .json({ message: "Forbidden: carriers only" });
  }
  if (req.user.status !== "approved") {
    return res.status(403).json({
      message: `Your carrier account is ${req.user.status}. An admin must approve it before you can take deliveries.`,
    });
  }
  next();
};
