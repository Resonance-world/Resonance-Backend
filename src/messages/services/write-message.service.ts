import { MessagesProvider } from '../providers/messages.provider';
import { RelationshipsService } from '@/relationships/services/check-relationships.service';
import { SocketService } from './socket.service';

export class WriteMessageService {
  constructor(
    private readonly messagesProvider: MessagesProvider,
    private readonly relationshipsService: RelationshipsService,
    private readonly socketService: SocketService,
  ) {}

  async writeMessage(senderId: string, receiverId: string, content: string) {
    console.log(`Writing message from ${senderId} to ${receiverId}: ${content}`);
    
    // TODO: Re-enable relationship check once relationships are properly set up
    // const isRelationshipExists =
    //   await this.relationshipsService.checkRelationship(senderId, receiverId);

    // if (!isRelationshipExists) {
    //   throw new Error('There is no relationship with this user');
    // }

    //const savedMessage = await this.messagesProvider.writeMessage(senderId, content, receiverId);
    await this.messagesProvider.writeMessage(senderId, content, receiverId);

    // Send message to specific receiver via WebSocket
    const sent = this.socketService.sendMessageToUser(receiverId, content);

    if (sent) {
      console.log(`Message sent to user ${receiverId} via WebSocket`);
    } else {
      console.log(
        `User ${receiverId} not connected, message saved but not sent via WebSocket`,
      );
    }
//    return savedMessage;
  }
}
