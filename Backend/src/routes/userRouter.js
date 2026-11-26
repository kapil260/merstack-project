import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
} from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRouter = Router();

// Public routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);

// Protected routes (must be logged in)
userRouter.get("/profile", protect, getProfile);
userRouter.put("/profile", protect, updateProfile);
userRouter.put("/change-password", protect, changePassword);

export default userRouter;
