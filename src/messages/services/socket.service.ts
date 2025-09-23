import { Server } from 'socket.io';

export class SocketService {
  public socket: Server = new Server();
  private userSockets = new Map<string, string>();

  insertUserSockets(userId: string, clientId: string) {
    this.userSockets.set(userId, clientId);
  }

  // Method to send message to specific user
  sendMessageToUser(receiverId: string, message: string) {
    const receiverSocketId = this.userSockets.get(receiverId);

    if (receiverSocketId) {
      // Send to specific user
      this.socket.to(receiverSocketId).emit('newMessage', message);
      console.log(
        `Message sent to user ${receiverId} via socket ${receiverSocketId}`,
      );
      return true;
    } else {
      console.log(`User ${receiverId} is not connected`);
      return false;
    }
  }
}
