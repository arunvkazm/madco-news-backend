import express from "express";
import { fetchLatestNews } from "../controllers/cronController.js";

const router = express.Router();

router.post("/fetch-latest", fetchLatestNews);

export default router;