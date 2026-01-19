import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.js";

dotenv.config();

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address: node make_admin.js <email>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email });

    if (user) {
      user.role = "super_admin";
      await user.save();
      console.log(`Successfully promoted ${user.name} (${user.email}) to SUPER ADMIN.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (error) {
    console.error("Error updating user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

makeAdmin();
