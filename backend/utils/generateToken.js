import jwt from "jsonwebtoken";

// Create a signed JWT for a user id that lasts 7 days
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export default generateToken;
