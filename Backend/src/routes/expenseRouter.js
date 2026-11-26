import { Router } from "express";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  getCategorySummary,
} from "../controller/expenseController.js";
import { protect } from "../middleware/authMiddleware.js";

const expenseRouter = Router();

expenseRouter.use(protect); // every expense route requires login

expenseRouter.route("/").post(createExpense).get(getExpenses);

// IMPORTANT: the summary routes must be above "/:id", otherwise "summary" would be treated as an id
expenseRouter.get("/summary/monthly", getMonthlySummary);
expenseRouter.get("/summary/category", getCategorySummary);

expenseRouter.route("/:id").get(getExpenseById).put(updateExpense).delete(deleteExpense);

export default expenseRouter;
