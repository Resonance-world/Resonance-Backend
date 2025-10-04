export class GetMyConversationsService {
    conversationsProvider;
    userProvider;
    constructor(conversationsProvider, userProvider) {
        this.conversationsProvider = conversationsProvider;
        this.userProvider = userProvider;
    }
    async getMyConversations(id) {
        const user = await this.userProvider.getUser(id);
        const conversation = await this.conversationsProvider.getMyConversations(id);
        if (!user) {
            throw new Error('The user does not exists');
        }
        return conversation;
    }
}
//# sourceMappingURL=get-my-conversations.service.js.map