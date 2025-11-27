import express from "express";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { getOverview, getMilestoneStats, getCategoryStats,getMostReadCategories,
  getTopUsers, getRecentActivity, getTrafficTrends } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

router.get("/overview", adminMiddleware, getOverview);
router.get("/milestones", adminMiddleware, getMilestoneStats);
router.get("/categories", adminMiddleware, getCategoryStats);
router.get("/most-read-categories", adminMiddleware, getMostReadCategories);
router.get("/top-users", adminMiddleware, getTopUsers);
router.get("/recent-activity", adminMiddleware, getRecentActivity);
router.get("/traffic-trends", adminMiddleware, getTrafficTrends);

export default router;
