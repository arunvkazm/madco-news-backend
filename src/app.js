import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import adminMilestoneRoutes from "./routes/adminMilestoneRoutes.js";
import userStatsRoutes from "./routes/userStatsRoutes.js";

const app = express();
connectDB();

// ---------------------------------------------------
//  FIXED CORS CONFIG
// ---------------------------------------------------

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
];

// Allow any frontend deployed on Render (*.onrender.com)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".onrender.com")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
// Allow preflight requests
app.options("*", cors(corsOptions));

// ---------------------------------------------------

app.use(express.json());
app.use(cookieParser());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(compression());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminUserRoutes);
app.use('/api/v1', adminCategoryRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/user', userRoutes);
app.use("/api/v1/admin/milestones", adminMilestoneRoutes);
app.use("/api/v1/user/stats", userStatsRoutes);

export default app;
