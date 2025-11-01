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

router.use(adminMiddleware);

router.post("/", adminMiddleware, addNews);
router.get("/", adminMiddleware, getAllNews);
router.get("/:id", adminMiddleware, getNewsById);
router.put("/:id", adminMiddleware, updateNews);
router.delete("/:id", adminMiddleware, deleteNews);

// 🆕 Get all news by category
router.get("/category/:categoryId", auth, getNewsByCategory);

export default router;
