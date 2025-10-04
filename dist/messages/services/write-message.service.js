export class WriteMessageService {
    messagesProvider;
    relationshipsService;
    socketService;
    constructor(messagesProvider, relationshipsService, socketService) {
        this.messagesProvider = messagesProvider;
        this.relationshipsService = relationshipsService;
        this.socketService = socketService;
    }
    async writeMessage(senderId, receiverId, content) {
        console.log(`Writing message from ${senderId} to ${receiverId}: ${content}`);
        //TODO: Re-enable relationship check once relationships are properly set up
        const isRelationshipExists = await this.relationshipsService.checkRelationship(senderId, receiverId);
        if (!isRelationshipExists) {
            throw new Error('There is no relationship with this user');
        }
        const savedMessage = await this.messagesProvider.writeMessage(senderId, content, receiverId);
        // Send full message object to specific receiver via WebSocket
        const sent = this.socketService.sendMessageToUser(receiverId, savedMessage);
        if (sent) {
            console.log(`✅ Message delivered to user ${receiverId} via WebSocket`);
        }
        else {
            console.log(`📝 Message saved to database for user ${receiverId} (will be visible when they open the conversation)`);
        }
        return savedMessage;
    }
}
//# sourceMappingURL=write-message.service.js.map