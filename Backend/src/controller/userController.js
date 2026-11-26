import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../schema/userSchema.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cookie settings: httpOnly means JavaScript in the browser cannot read the token (safer than localStorage)
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Only send safe fields to the frontend (never the password)
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// POST /api/users/register
export const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email is already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // role is NOT taken from req.body, so nobody can sign up as admin
  const user = await User.create({ name, email, password: hashedPassword, role: "user" });

  res.cookie("token", createToken(user._id), cookieOptions);
  res.status(201).json({ success: true, message: "Registered successfully", user: safeUser(user) });
};

// POST /api/users/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;

  // Same message for "no such email" and "wrong password" so attackers learn nothing
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  res.cookie("token", createToken(user._id), cookieOptions);
  res.status(200).json({ success: true, message: "Login successful", user: safeUser(user) });
};

// POST /api/users/logout
export const logoutUser = (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// GET /api/users/profile
export const getProfile = (req, res) => {
  res.status(200).json({ success: true, user: safeUser(req.user) });
};

// PUT /api/users/profile  (update name and email)
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ success: false, message: "Name and email are required" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email" });
  }

  const newEmail = email.toLowerCase().trim();
  const taken = await User.findOne({ email: newEmail, _id: { $ne: req.user._id } });
  if (taken) {
    return res.status(409).json({ success: false, message: "Email is already used by another account" });
  }

  // Only name and email can be changed here (role can never be changed)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim(), email: newEmail },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: "Profile updated", user: safeUser(user) });
};

// PUT /api/users/change-password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: "All password fields are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "New passwords do not match" });
  }

  // req.user has no password (we removed it in the middleware), so load it again
  const user = await User.findById(req.user._id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ success: true, message: "Password changed successfully" });
};
