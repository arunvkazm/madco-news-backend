import express from "express";
import { auth } from "../middlewares/auth.js";
import { recordNewsRead, getUserStats,addReadingTime,getNextMilestoneTarget } from "../controllers/userStatsController.js";

const router = express.Router();

router.post("/read", auth, recordNewsRead);
router.post("/add-time", auth, addReadingTime);
router.post("/next-target", auth, getNextMilestoneTarget);
router.get("/", auth, getUserStats);

export default router;
