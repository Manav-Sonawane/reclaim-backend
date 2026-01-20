import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.js";

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, "name email role");
    console.log("Users found:", users);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

listUsers();
