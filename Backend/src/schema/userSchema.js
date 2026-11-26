import mongoose from "mongoose";

// A User document = one registered person (or admin).
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // MongoDB will not allow two users with the same email
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"], // stored HASHED, never plain text
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export const User = mongoose.model("User", userSchema);
