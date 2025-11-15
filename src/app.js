import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import adminMilestoneRoutes from "./routes/adminMilestoneRoutes.js";
import userStatsRoutes from "./routes/userStatsRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import cronRoutes from "./routes/cronRoutes.js";

const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Routes
app.use('/api/v1/admin/cron', cronRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminUserRoutes);
app.use('/api/v1', adminCategoryRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/user', userRoutes);
app.use("/api/v1/admin/milestones", adminMilestoneRoutes);
app.use("/api/v1/user/stats", userStatsRoutes);
app.use("/api/v1/admin/analytics", adminAnalyticsRoutes);
app.use("/api/v1/user/bookmarks", bookmarkRoutes);
app.use('/api/v1/search', searchRoutes);

// app.use(errorHandler);

export default app;
