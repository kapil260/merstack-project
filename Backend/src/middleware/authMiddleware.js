import jwt from "jsonwebtoken";
import { User } from "../schema/userSchema.js";

// Runs BEFORE protected routes.
// It reads the JWT from the HTTP-only cookie, verifies it, and attaches the real user to req.user.
// Because of this, the user's identity always comes from the token - never from the frontend.
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not logged in. Please log in first." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
  }
};
