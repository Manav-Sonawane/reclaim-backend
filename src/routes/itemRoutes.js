import express from "express";
import {
  createItem,
  getItems,
  getItemById,
  getItemMatches,
  getMyItems,
  getItemsByUser,
  deleteItem,
  voteItem,
} from "../controllers/itemController.js";
import {
  addComment,
  getComments,
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createItem);
router.get("/", getItems);
router.get("/user/me", protect, getMyItems);
router.get("/user/:userId", getItemsByUser);
router.get("/:id", getItemById);
router.get("/:id/matches", getItemMatches);
router.delete("/:id", protect, deleteItem);
router.post("/:id/vote", protect, voteItem);

// Comment routes
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", getComments);

export default router;
