import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import https from 'https';
// Import WebSocket service singletons
import { socketService } from './messages/services/socket-service-singleton.js';
import { matchSocketService } from './matching/services/match-socket-service-singleton.js';
// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import messageRoutes from './routes/message.js';
import chatbotRoutes from './routes/chatbot.js';
import onboardingRoutes from './routes/onboarding.js';
import themesRoutes from './routes/themes.js';
import deployedPromptsRoutes from './routes/deployedPrompts.js';
import matchesRoutes from './routes/matches.js';
import relationshipsRoutes from './routes/relationships.js';
// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
// Load environment variables
dotenv.config();
const app = express();
const server = createServer(app);
const port = process.env.PORT || 5050;
// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true
});
// Set the socket.io instance on both socket services
socketService.socket = io;
matchSocketService.socket = io;
// Handle Socket.IO connections manually since we're not using NestJS framework
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    console.log('🔌 Handshake query:', socket.handshake.query);
    console.log('🔌 Current connected users:', Array.from(socketService.userSockets.keys()));
    // Extract userId from query params
    const userId = socket.handshake.query.userId;
    if (userId) {
        // Register user in both socket services
        socketService.insertUserSockets(userId, socket.id);
        matchSocketService.insertUserSockets(userId, socket.id);
        console.log(`🔌 User ${userId} mapped to socket ${socket.id}`);
        console.log('🔌 Updated connected users:', Array.from(socketService.userSockets.keys()));
    }
    else {
        console.log('🔌 No userId provided in connection query');
    }
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        // Clean up user socket mapping from both services
        for (const [userId, socketId] of socketService.userSockets.entries()) {
            if (socketId === socket.id) {
                socketService.removeUserSocket(userId);
                matchSocketService.removeUserSocket(userId);
                console.log(`🔌 Removed socket mapping for user ${userId}`);
                break;
            }
        }
    });
    // Handle wsMessage events
    socket.on('wsMessage', (payload) => {
        console.log('🔌 Received wsMessage:', payload);
        socket.emit('reply', 'réponse ok!');
    });
});
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
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];
// Add production frontend URL to allowed origins
if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin)
            return callback(null, true);
        // Production mode - strict origin checking
        if (process.env.NODE_ENV === 'production') {
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                console.log('❌ CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        }
        else {
            // Development mode - allow all origins for flexibility
            callback(null, true);
        }
    },
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
// Socket.IO connection handling - Using MessagesGateway instead
// The MessagesGateway handles all WebSocket connections and events
// Error handling middleware (must be last)
app.use(errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 Socket.IO enabled`);
    console.log(`🔗 CORS enabled for all origins (development mode)`);
    // Keep-alive mechanism to prevent Render free tier hibernation
    if (process.env.NODE_ENV === 'production') {
        const SELF_PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
        const SERVICE_URL = process.env.RENDER_EXTERNAL_URL || `https://resonance-backend-nwjg.onrender.com`;
        setInterval(() => {
            const url = new URL(`${SERVICE_URL}/health`);
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'GET',
                timeout: 5000
            };
            const req = https.request(options, (res) => {
                if (res.statusCode === 200) {
                    console.log('⏰ Keep-alive ping successful');
                }
                else {
                    console.log(`⏰ Keep-alive ping returned status: ${res.statusCode}`);
                }
            });
            req.on('error', (error) => {
                console.error('⏰ Keep-alive ping failed:', error.message);
            });
            req.on('timeout', () => {
                console.error('⏰ Keep-alive ping timed out');
                req.destroy();
            });
            req.end();
        }, SELF_PING_INTERVAL);
        console.log('⏰ Keep-alive mechanism enabled (pinging every 10 minutes)');
    }
});
export { io };
//# sourceMappingURL=index.js.map