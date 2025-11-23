import express from "express";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { getOverview, getMilestoneStats, getCategoryStats,getMostReadCategories,
  getTopUsers } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

router.get("/overview", adminMiddleware, getOverview);
router.get("/milestones", adminMiddleware, getMilestoneStats);
router.get("/categories", adminMiddleware, getCategoryStats);
router.get("/most-read-categories", adminMiddleware, getMostReadCategories);
router.get("/top-users", adminMiddleware, getTopUsers);

export default router;
