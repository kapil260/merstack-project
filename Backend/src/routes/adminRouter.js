import { Router } from "express";
import {
  getDashboard,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllExpenses,
} from "../controller/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const adminRouter = Router();

adminRouter.use(protect, adminOnly); // logged in AND admin, for every admin route

adminRouter.get("/dashboard", getDashboard);
adminRouter.get("/users", getAllUsers);
adminRouter.route("/users/:id").get(getUserById).delete(deleteUser);
adminRouter.get("/expenses", getAllExpenses);

export default adminRouter;
