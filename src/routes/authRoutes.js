import express from "express";
import { registerUser, loginUser, getMe, googleAuth } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);

export default router;
