import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import categoryManagementRoutes from './routes/categoryManagementRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import userRoutes from './routes/userRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import adminMilestoneRoutes from "./routes/adminMilestoneRoutes.js";
import userStatsRoutes from "./routes/userStatsRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";


const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration - allow frontend origin
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "https://madco-news-panel.onrender.com"
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("/", cors());
// app.options("/api/*", cors());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'https://madco-news-panel.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(compression());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/userManagement', userManagementRoutes);
app.use('/api/v1', categoryManagementRoutes);
app.use('/api/v1/user/bookmarks', bookmarkRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/user', userRoutes);
app.use("/api/v1/admin/milestones", adminMilestoneRoutes);
app.use("/api/v1/user/stats", userStatsRoutes);
app.use("/api/v1/admin", adminUserRoutes);
app.use("/api/v1/summary", summaryRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/admin/analytics", adminAnalyticsRoutes);



// Error Handler
// app.use(errorHandler);

export default app;
