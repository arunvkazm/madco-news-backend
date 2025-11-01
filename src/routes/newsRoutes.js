import express from "express";
import {
  addNews,
  updateNews,
  deleteNews,
  getAllNews,
  getNewsById,
  getNewsByCategory,
} from "../controllers/newsController.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// 🚨 Must come BEFORE any route with :id
router.get("/category/:categoryId", auth, getNewsByCategory);

// Admin routes
router.post("/", adminMiddleware, addNews);
router.get("/", adminMiddleware, getAllNews);
router.get("/:id", adminMiddleware, getNewsById);
router.put("/:id", adminMiddleware, updateNews);
router.delete("/:id", adminMiddleware, deleteNews);

export default router;
