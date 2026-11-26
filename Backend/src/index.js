// Entry point of the backend: creates the Express app, connects to MongoDB, mounts the routes.

import "dotenv/config"; // loads variables from the .env file into process.env
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectToDb from "./connectToDb/connectToDb.js";
import userRouter from "./routes/userRouter.js";
import expenseRouter from "./routes/expenseRouter.js";
import adminRouter from "./routes/adminRouter.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8000;

// CORS: only our React app may call this API, and it may send cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // lets Express read JSON bodies (req.body) - keep it above the routes
app.use(cookieParser()); // lets Express read cookies (req.cookies)

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "SpendWise API is running" });
});

app.use("/api/users", userRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/admin", adminRouter);

// Unknown URL
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Central error handler: any error thrown in a controller ends up here
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ success: false, message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid id or value" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate value. This record already exists" });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong on the server" });
});

// Connect to the database first, then start listening
connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`SpendWise backend running at http://localhost:${PORT}`);
  });
});
