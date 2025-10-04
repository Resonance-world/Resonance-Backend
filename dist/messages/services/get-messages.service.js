export class GetMessagesService {
    messagesProvider;
    relationshipsService;
    constructor(messagesProvider, relationshipsService) {
        this.messagesProvider = messagesProvider;
        this.relationshipsService = relationshipsService;
    }
    async getMessagesByConversation(senderId, receiverId) {
        console.log('🔍 Service: getMessagesByConversation called with:', { senderId, receiverId });
        await this.relationshipsService.checkRelationship(senderId, receiverId);
        console.log('🔍 Service: Relationship check passed');
        const conversation = await this.messagesProvider.getMessagesBySenderIdAndReceiverId(senderId, receiverId);
        console.log('🔍 Service: Messages retrieved:', conversation?.length || 0, 'messages');
        if (!conversation) {
            throw new Error('Conversation not found or access denied');
        }
        return conversation;
    }
}
//# sourceMappingURL=get-messages.service.js.map