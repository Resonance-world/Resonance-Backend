// Vercel serverless function entry point
// This file exports the Express app for Vercel without starting a server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
// Import routes
import authRoutes from '../routes/auth.js';
import userRoutes from '../routes/user.js';
import messageRoutes from '../routes/message.js';
import chatbotRoutes from '../routes/chatbot.js';
import onboardingRoutes from '../routes/onboarding.js';
import themesRoutes from '../routes/themes.js';
import deployedPromptsRoutes from '../routes/deployedPrompts.js';
import matchesRoutes from '../routes/matches.js';
import relationshipsRoutes from '../routes/relationships.js';
// Import middleware
import { errorHandler } from '../middleware/errorHandler.js';
import { logger } from '../middleware/logger.js';
// Load environment variables
dotenv.config();
const app = express();
// Trust proxy for proper IP detection (required for rate limiting)
app.set('trust proxy', 1);
// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.'
});
// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/themes', themesRoutes);
app.use('/api/deployed-prompts', deployedPromptsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/relationships', relationshipsRoutes);
// Error handling middleware (must be last)
app.use(errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Export the app for Vercel
export default app;
//# sourceMappingURL=index.js.map