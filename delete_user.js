
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.js"; 

dotenv.config();

const deleteUser = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address: node delete_user.js <email>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await User.deleteOne({ email });

    if (result.deletedCount === 1) {
      console.log(`Successfully deleted user with email: ${email}`);
      console.log("You can now test the Sign Up flow again.");
    } else {
      console.log(`User with email ${email} not found.`);
    }
  } catch (error) {
    console.error("Error deleting user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

deleteUser();
