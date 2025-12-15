import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  recordNewsRead,
  getUserStats,
  addReadingTime,
  getNextMilestoneTarget,
  getClaimedRewards,
  getUnclaimedRewards,
  claimReward,
} from "../controllers/userStatsController.js";

const router = express.Router();

router.post("/read", auth, recordNewsRead);
router.post("/add-time", auth, addReadingTime);
router.post("/next-target", auth, getNextMilestoneTarget);
router.get("/rewards/claimed", auth, getClaimedRewards);
router.get("/rewards/unclaimed", auth, getUnclaimedRewards);
router.post("/rewards/claim", auth, claimReward);

router.get("/", auth, getUserStats);

export default router;
