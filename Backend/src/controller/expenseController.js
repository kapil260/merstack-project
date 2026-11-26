import mongoose from "mongoose";
import { Expense, CATEGORIES } from "../schema/expenseSchema.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Turn "2026-11-04" into a Date (UTC). Returns null when the text is not a real date.
const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

// Escape special characters so a search like "a.b(" cannot break the regular expression
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Check the fields of an expense. Returns an error message, or null when everything is fine.
const validateExpense = ({ title, amount, category, date }) => {
  if (!title?.toString().trim()) return "Title is required";

  const numericAmount = Number(amount);
  if (amount === undefined || amount === null || amount === "" || !Number.isFinite(numericAmount)) {
    return "Amount must be a valid number";
  }
  if (numericAmount < 0.01) return "Amount must be at least 0.01";

  if (!CATEGORIES.includes(category)) return "Please choose a valid category";
  if (!parseDate(date)) return "Please enter a valid date";
  return null;
};

// POST /api/expenses
export const createExpense = async (req, res) => {
  const { title, amount, category, date, description } = req.body;

  const error = validateExpense(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  const expense = await Expense.create({
    title,
    amount: Number(amount),
    category,
    date: parseDate(date),
    description,
    userId: req.user._id, // taken from the verified token, NOT from the request body
  });

  res.status(201).json({ success: true, message: "Expense added successfully", expense });
};

// GET /api/expenses?search=&category=&date=&page=&limit=
export const getExpenses = async (req, res) => {
  const { search, category, date, startDate, endDate } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

  const filter = { userId: req.user._id }; // users only ever see their own expenses

  if (search?.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: "i" };
  }

  if (category) {
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }
    filter.category = category;
  }

  if (date) {
    // one exact day: from 00:00 of that day until 00:00 of the next day
    const day = parseDate(date);
    if (!day) return res.status(400).json({ success: false, message: "Invalid date" });
    filter.date = { $gte: day, $lt: new Date(day.getTime() + 24 * 60 * 60 * 1000) };
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const s = parseDate(startDate);
      if (!s) return res.status(400).json({ success: false, message: "Invalid start date" });
      filter.date.$gte = s;
    }
    if (endDate) {
      const e = parseDate(endDate);
      if (!e) return res.status(400).json({ success: false, message: "Invalid end date" });
      filter.date.$lt = new Date(e.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  const total = await Expense.countDocuments(filter);
  const expenses = await Expense.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    expenses,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  });
};

// GET /api/expenses/:id
export const getExpenseById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid expense id" });
  }

  // Searching by BOTH _id and userId means other people's expenses look like "not found"
  const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
  if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

  res.status(200).json({ success: true, expense });
};

// PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid expense id" });
  }

  const error = validateExpense(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  const { title, amount, category, date, description } = req.body;

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { title, amount: Number(amount), category, date: parseDate(date), description },
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

  res.status(200).json({ success: true, message: "Expense updated successfully", expense });
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid expense id" });
  }

  const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

  res.status(200).json({ success: true, message: "Expense deleted successfully" });
};

// GET /api/expenses/summary/monthly?year=2026&month=11
// Gives the total spent in each of the 12 months, plus the numbers needed by the dashboard cards.
// "month" (1-12) says which month counts as the "current month"; the frontend sends the user's local month.
export const getMonthlySummary = async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getUTCFullYear();
  if (year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, message: "Invalid year" });
  }

  const userId = new mongoose.Types.ObjectId(req.user._id);
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  // Aggregation: group this year's expenses by month and add them up
  const grouped = await Expense.aggregate([
    { $match: { userId, date: { $gte: yearStart, $lt: yearEnd } } },
    { $group: { _id: { $month: "$date" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  const months = MONTH_NAMES.map((name, i) => {
    const found = grouped.find((g) => g._id === i + 1);
    return { month: i + 1, name, total: found ? found.total : 0, count: found ? found.count : 0 };
  });

  // Current month numbers (for dashboard cards)
  const monthNumber = parseInt(req.query.month) || now.getUTCMonth() + 1;
  if (monthNumber < 1 || monthNumber > 12) {
    return res.status(400).json({ success: false, message: "Invalid month" });
  }
  const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1));
  const monthEnd = new Date(Date.UTC(year, monthNumber, 1));
  const monthFilter = { userId, date: { $gte: monthStart, $lt: monthEnd } };

  const [monthStats] = await Expense.aggregate([
    { $match: monthFilter },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const highest = await Expense.findOne(monthFilter).sort({ amount: -1 });
  const totalTransactions = await Expense.countDocuments({ userId });

  res.status(200).json({
    success: true,
    year,
    months,
    yearTotal: months.reduce((sum, m) => sum + m.total, 0),
    currentMonth: {
      total: monthStats ? monthStats.total : 0,
      count: monthStats ? monthStats.count : 0,
      highest,
    },
    totalTransactions,
  });
};

// GET /api/expenses/summary/category?month=2026-11   (month is optional: leave it out for all time)
export const getCategorySummary = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const match = { userId };

  if (req.query.month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month)) {
      return res.status(400).json({ success: false, message: "Month must look like 2026-11" });
    }
    const [y, m] = req.query.month.split("-").map(Number);
    match.date = { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
  }

  const grouped = await Expense.aggregate([
    { $match: match },
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const total = grouped.reduce((sum, g) => sum + g.total, 0);
  const categories = grouped.map((g) => ({
    category: g._id,
    total: g.total,
    count: g.count,
    percentage: total > 0 ? Math.round((g.total / total) * 1000) / 10 : 0,
  }));

  res.status(200).json({ success: true, month: req.query.month || "all", total, categories });
};
