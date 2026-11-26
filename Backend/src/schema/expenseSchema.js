import mongoose from "mongoose";

export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Education",
  "Entertainment",
  "Health",
  "Bills",
  "Other",
];

// An Expense document = one spending record that belongs to exactly one user.
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be at least 0.01"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: { values: CATEGORIES, message: "Invalid category" },
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Relationship: each expense points to the User who owns it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);
