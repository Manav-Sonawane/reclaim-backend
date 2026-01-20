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
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    color: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      }, // [lng, lat]
      address: { type: String },
      city: { type: String },
    },
    images: [String],
    status: {
      type: String, // 'open', 'matched', 'in_progress', 'claimed', 'resolved', 'retrieved'
      enum: ["open", "matched", "in_progress", "claimed", "resolved", "retrieved"],
      default: "open",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contact_info: { type: String }, // Optional: phone or email
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

itemSchema.index({ location: "2dsphere" }); // Geospatial index

export default mongoose.model("Item", itemSchema);
