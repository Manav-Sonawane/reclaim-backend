import express from "express";
import {
  createClaim,
  getClaims,
  getMyClaims,
  updateClaimStatus,
  updateClaimMessage,
  deleteClaim,
  resolveClaim,
  getClaimsByItem,
} from "../controllers/claimController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createClaim);
router.get("/user/me", protect, getMyClaims);
router.get("/item/:itemId", protect, getClaimsByItem);
router.get("/", protect, getClaims);
router.put("/:id", protect, updateClaimStatus);
router.put("/:id/resolve", protect, resolveClaim);
router.put("/:id/message", protect, updateClaimMessage);
router.delete("/:id", protect, deleteClaim);

export default router;
