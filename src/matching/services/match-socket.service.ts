import { Server } from 'socket.io';

export class MatchSocketService {
  public socket: Server = new Server();
  public userSockets = new Map<string, string>();

  insertUserSockets(userId: string, clientId: string) {
    this.userSockets.set(userId, clientId);
    console.log(`🔌 Match Socket: User ${userId} mapped to socket ${clientId}`);
    console.log(`🔌 Match Socket: Current connected users:`, Array.from(this.userSockets.keys()));
  }

  removeUserSocket(userId: string) {
    this.userSockets.delete(userId);
    console.log(`🔌 Match Socket: Removed socket mapping for user ${userId}`);
  }

  // Method to send match events to specific user
  sendMatchEvent(receiverId: string, eventType: string, eventData: any) {
    const receiverSocketId = this.userSockets.get(receiverId);
    
    console.log(`🔌 Match Socket: Attempting to send ${eventType} to user ${receiverId}`);
    console.log(`🔌 Match Socket: Current connected users:`, Array.from(this.userSockets.keys()));
    console.log(`🔌 Match Socket: Receiver socket ID:`, receiverSocketId);

    if (receiverSocketId) {
      // Send match event to specific user using the event type
      this.socket.to(receiverSocketId).emit(eventType, eventData);
      console.log(
        `✅ Match Socket: ${eventType} sent to user ${receiverId} via socket ${receiverSocketId}`,
      );
      return true;
    } else {
      console.log(`⚠️ Match Socket: User ${receiverId} is not connected - ${eventType} event not delivered in real-time`);
      console.log(`💡 Match Socket: This is normal if the user is not online or not on the home page`);
      return false;
    }
  }

  // Convenience methods for specific match events
  sendNewMatchAvailable(receiverId: string, matchData: any) {
    return this.sendMatchEvent(receiverId, 'new_match_available', matchData);
  }

  sendMatchStatusChanged(receiverId: string, statusData: any) {
    return this.sendMatchEvent(receiverId, 'match_status_changed', statusData);
  }

  sendMatchConfirmed(receiverId: string, confirmationData: any) {
    return this.sendMatchEvent(receiverId, 'match_confirmed', confirmationData);
  }
}
