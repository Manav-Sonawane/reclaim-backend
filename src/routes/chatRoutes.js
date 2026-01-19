import express from "express";
import {
  getMyChats,
  createOrGetChat,
  getChatById,
  getUnreadCount,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyChats);
router.get("/unread", protect, getUnreadCount);
router.post("/", protect, createOrGetChat);
router.get("/:id", protect, getChatById);

export default router;
