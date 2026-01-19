import express from "express";
import {
  createItem,
  getItems,
  getItemById,
  getItemMatches,
  getMyItems,
  deleteItem,
} from "../controllers/itemController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createItem);
router.get("/", getItems);
router.get("/user/me", protect, getMyItems);
router.get("/:id", getItemById);
router.get("/:id/matches", getItemMatches);
router.delete("/:id", protect, deleteItem);

export default router;
