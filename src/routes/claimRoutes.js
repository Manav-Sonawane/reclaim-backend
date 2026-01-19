import express from "express";
import {
  createClaim,
  getClaims,
  getMyClaims,
  updateClaimStatus,
  updateClaimMessage,
  deleteClaim,
} from "../controllers/claimController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createClaim);
router.get("/user/me", protect, getMyClaims);
router.get("/", protect, getClaims);
router.put("/:id", protect, updateClaimStatus);
router.put("/:id/message", protect, updateClaimMessage);
router.delete("/:id", protect, deleteClaim);

export default router;
