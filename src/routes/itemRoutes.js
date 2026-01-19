import express from "express";
import {
  createItem,
  getItems,
  getItemById,
} from "../controllers/itemController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createItem);
router.get("/", getItems);
router.get("/:id", getItemById);

export default router;
