import { Server } from 'socket.io';
export class SocketService {
    socket = new Server();
    userSockets = new Map();
    insertUserSockets(userId, clientId) {
        this.userSockets.set(userId, clientId);
    }
    removeUserSocket(userId) {
        this.userSockets.delete(userId);
    }
    // Method to send message to specific user
    sendMessageToUser(receiverId, messageData) {
        const receiverSocketId = this.userSockets.get(receiverId);
        console.log(`🔌 Attempting to send message to user ${receiverId}`);
        console.log(`🔌 Current connected users:`, Array.from(this.userSockets.keys()));
        console.log(`🔌 Receiver socket ID:`, receiverSocketId);
        if (receiverSocketId) {
            // Send full message object to specific user
            this.socket.to(receiverSocketId).emit('newMessage', messageData);
            console.log(`✅ Message sent to user ${receiverId} via socket ${receiverSocketId}`);
            return true;
        }
        else {
            console.log(`⚠️ User ${receiverId} is not connected - message saved to database but not delivered in real-time`);
            console.log(`💡 This is normal if the user is not online or not on the conversation page`);
            return false;
        }
    }
}
//# sourceMappingURL=socket.service.js.map