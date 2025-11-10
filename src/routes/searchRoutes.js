import express from "express";
import { searchNews } from "../controllers/searchNewsController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Admin-only routes
router.get("/", auth, searchNews);


export default router;
