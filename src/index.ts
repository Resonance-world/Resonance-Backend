import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import WebSocket service singleton
import { socketService } from './messages/services/socket-service-singleton.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import messageRoutes from './routes/message.js';
import chatbotRoutes from './routes/chatbot.js';
import onboardingRoutes from './routes/onboarding.js';

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

// Set the socket.io instance on the existing socketService
socketService.socket = io;

// Handle Socket.IO connections manually since we're not using NestJS framework
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  console.log('🔌 Handshake query:', socket.handshake.query);
  console.log('🔌 Current connected users:', Array.from(socketService.userSockets.keys()));
  
  // Extract userId from query params
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    socketService.insertUserSockets(userId, socket.id);
    console.log(`🔌 User ${userId} mapped to socket ${socket.id}`);
    console.log('🔌 Updated connected users:', Array.from(socketService.userSockets.keys()));
  } else {
    console.log('🔌 No userId provided in connection query');
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    // Clean up user socket mapping
    for (const [userId, socketId] of socketService.userSockets.entries()) {
      if (socketId === socket.id) {
        socketService.removeUserSocket(userId);
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
});

export { io }; 