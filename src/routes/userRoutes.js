import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

// Update profile
import { updateProfile } from "../controllers/authController.js";
router.put("/profile", protect, updateProfile);

export default router;
