import express from "express";
import { getMatchesForItem } from "../controllers/matchController.js";

const router = express.Router();

router.get("/:id/matches", getMatchesForItem);

export default router;
