import mongoose from "mongoose";
import { User } from "../schema/userSchema.js";
import { Expense, CATEGORIES } from "../schema/expenseSchema.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPaging = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  return { page, limit };
};

// GET /api/admin/dashboard  -> overall statistics for the whole application
export const getDashboard = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const totalAdmins = await User.countDocuments({ role: "admin" });
  const totalExpenses = await Expense.countDocuments();

  const [stats] = await Expense.aggregate([
    { $group: { _id: null, totalAmount: { $sum: "$amount" }, averageAmount: { $avg: "$amount" }, highestAmount: { $max: "$amount" } } },
  ]);

  const categoryBreakdown = await Expense.aggregate([
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const recentUsers = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 }).limit(5);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalAdmins,
      totalExpenses,
      totalAmount: stats ? stats.totalAmount : 0,
      averageAmount: stats ? stats.averageAmount : 0,
      highestAmount: stats ? stats.highestAmount : 0,
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    recentUsers,
  });
};

// GET /api/admin/users?search=&page=&limit=
export const getAllUsers = async (req, res) => {
  const { page, limit } = getPaging(req.query);
  const filter = {};

  if (req.query.search?.trim()) {
    const regex = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Add "how many expenses" and "how much spent" for the users shown on this page
  const totals = await Expense.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    { $group: { _id: "$userId", expenseCount: { $sum: 1 }, totalSpent: { $sum: "$amount" } } },
  ]);

  const usersWithStats = users.map((u) => {
    const t = totals.find((x) => x._id.equals(u._id));
    return { ...u, expenseCount: t ? t.expenseCount : 0, totalSpent: t ? t.totalSpent : 0 };
  });

  res.status(200).json({
    success: true,
    users: usersWithStats,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  });
};

// GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const [stats] = await Expense.aggregate([
    { $match: { userId: user._id } },
    { $group: { _id: null, expenseCount: { $sum: 1 }, totalSpent: { $sum: "$amount" } } },
  ]);
  const recentExpenses = await Expense.find({ userId: user._id }).sort({ date: -1 }).limit(10);

  res.status(200).json({
    success: true,
    user,
    stats: { expenseCount: stats ? stats.expenseCount : 0, totalSpent: stats ? stats.totalSpent : 0 },
    recentExpenses,
  });
};

// DELETE /api/admin/users/:id  (also deletes that user's expenses)
export const deleteUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid user id" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (user.role === "admin") {
    return res.status(403).json({ success: false, message: "Admin accounts cannot be deleted" });
  }

  await Expense.deleteMany({ userId: user._id });
  await user.deleteOne();

  res.status(200).json({ success: true, message: "User and their expenses deleted successfully" });
};

// GET /api/admin/expenses?search=&category=&userId=&page=&limit=
export const getAllExpenses = async (req, res) => {
  const { page, limit } = getPaging(req.query);
  const filter = {};

  if (req.query.search?.trim()) {
    filter.title = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
  }
  if (req.query.category) {
    if (!CATEGORIES.includes(req.query.category)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }
    filter.category = req.query.category;
  }
  if (req.query.userId) {
    if (!mongoose.isValidObjectId(req.query.userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    filter.userId = req.query.userId;
  }

  const total = await Expense.countDocuments(filter);
  const expenses = await Expense.find(filter)
    .populate("userId", "name email") // replaces the userId with the user's name and email
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    expenses,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  });
};
