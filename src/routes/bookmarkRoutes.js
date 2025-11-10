import express from "express";
import { auth } from "../middlewares/auth.js";
import { addBookmark, removeBookmark, getBookmarks } from "../controllers/bookmarkController.js";

const router = express.Router();

router.post("/", auth, addBookmark);
router.get("/", auth, getBookmarks);
router.delete("/", auth, removeBookmark);

export default router;
