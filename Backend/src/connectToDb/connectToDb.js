import mongoose from "mongoose";

// Connects to MongoDB using the connection string stored in .env (never hardcode it!).
// If the connection fails, we print a clear message and stop the server.
const connectToDb = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectToDb;
