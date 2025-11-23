import express from 'express';
import { generateSummary } from '../controllers/summaryController.js';

const router = express.Router();

// POST /api/v1/summary/generate
router.post('/generate', generateSummary);

export default router;

