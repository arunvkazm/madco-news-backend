import express from "express";
import { auth } from "../middlewares/auth.js";
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import { getMyRewards , getRewardedUsers} from "../controllers/rewardController.js";
import {requireRole} from '../middlewares/requireRole.js';

const router = express.Router();

router.get("/reward/my", auth, getMyRewards);
router.get(
  "/admin/reward/completed",
  adminMiddleware,
  requireRole("super_admin", "sub_admin"),
  getRewardedUsers
);

export default router;