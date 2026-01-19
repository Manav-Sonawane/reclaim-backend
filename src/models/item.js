import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    color: {
      type: String,
    },
    location: {
      area: {
        type: String,
        required: true,
      },
      lat: Number,
      lng: Number,
    },
    images: [
      {
        type: String, // URL (R2 later)
      },
    ],
    status: {
      type: String,
      enum: ["open", "matched", "claimed", "returned"],
      default: "open",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
