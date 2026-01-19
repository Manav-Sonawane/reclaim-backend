import express from "express";
import {
  getMyChats,
  createOrGetChat,
  getChatById,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyChats);
router.post("/", protect, createOrGetChat);
router.get("/:id", protect, getChatById);

export default router;
