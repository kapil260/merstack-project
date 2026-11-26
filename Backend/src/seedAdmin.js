// Creates the first admin account. Run it once with:  npm run seed:admin
// The admin details come from the .env file, so no password is written in the code.

import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectToDb from "./connectToDb/connectToDb.js";
import { User } from "./schema/userSchema.js";

const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.");
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await connectToDb();

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    existing.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await existing.save();
    console.log(`Existing account ${email} is now an admin (password updated).`);
  } else {
    await User.create({
      name: ADMIN_NAME || "Admin",
      email,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    });
    console.log(`Admin account created: ${email}`);
  }

  await mongoose.disconnect();
};

seedAdmin().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
