import express from "express";
import { addMilestone, getMilestones, updateMilestone, deleteMilestone } from "../controllers/milestoneController.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Admin-only routes
router.post("/", adminMiddleware, addMilestone);
router.get("/", adminMiddleware, getMilestones);
router.put("/:id", adminMiddleware, updateMilestone);
router.delete("/:id", adminMiddleware, deleteMilestone);

export default router;
