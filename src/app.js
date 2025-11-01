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
import newsRoutes from './routes/newsRoutes.js';


// import articleRoutes from './routes/articleRoutes.js';
// import adminRoutes from './routes/adminRoutes.js';
// import { errorHandler } from './middlewares/errorHandler.js';

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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', adminUserRoutes);
app.use('/api/v1/admin/categories', adminCategoryRoutes);
app.use('/api/v1/news', newsRoutes);
// app.use('/api/v1/admin', adminRoutes);

// Error Handler
// app.use(errorHandler);

export default app;
