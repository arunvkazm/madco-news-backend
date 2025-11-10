import express from "express";
import { auth } from "../middlewares/auth.js";
import { recordNewsRead, getUserStats } from "../controllers/userStatsController.js";

const router = express.Router();

router.post("/read", auth, recordNewsRead);
router.get("/", auth, getUserStats);

export default router;
