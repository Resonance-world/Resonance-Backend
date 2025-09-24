import { MessagesProvider } from '@/messages/providers/messages.provider';
import { RelationshipsService } from '@/relationships/services/check-relationships.service';

export class GetMessagesService {
  constructor(
    private readonly messagesProvider: MessagesProvider,
    private readonly relationshipsService: RelationshipsService,
  ) {}

  async getMessagesByConversation(senderId: string, receiverId: string) {
    console.log('🔍 Service: getMessagesByConversation called with:', { senderId, receiverId });
    await this.relationshipsService.checkRelationship(senderId, receiverId);
    console.log('🔍 Service: Relationship check passed');
    const conversation =
      await this.messagesProvider.getMessagesBySenderIdAndReceiverId(
        senderId,
        receiverId,
      );

    console.log('🔍 Service: Messages retrieved:', conversation?.length || 0, 'messages');
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }
    return conversation;
  }
}
