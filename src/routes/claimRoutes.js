import express from "express";
import {
  createClaim,
  getClaims,
  updateClaimStatus,
} from "../controllers/claimController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createClaim);
router.get("/", protect, getClaims);
router.put("/:id", protect, updateClaimStatus);

export default router;
