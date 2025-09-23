import { MessagesProvider } from '@/messages/providers/messages.provider';
import { RelationshipsService } from '@/relationships/services/check-relationships.service';

export class GetMessagesService {
  constructor(
    private readonly messagesProvider: MessagesProvider,
    private readonly relationshipsService: RelationshipsService,
  ) {}

  async getMessagesByConversation(senderId: string, receiverId: string) {
    await this.relationshipsService.checkRelationship(senderId, receiverId);
    const conversation =
      await this.messagesProvider.getMessagesBySenderIdAndReceiverId(
        senderId,
        receiverId,
      );

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }
    return conversation;
  }
}
