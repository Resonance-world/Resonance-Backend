import { SocketService } from './socket.service.js';

// Create a singleton instance that's available immediately
const socketService = new SocketService();

// Make it globally available
(global as any).socketService = socketService;

export { socketService };
