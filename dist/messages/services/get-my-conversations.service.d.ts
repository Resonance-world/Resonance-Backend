import { ConversationsProvider } from '@/messages/providers/conversations.provider';
import { SharedUserProvider } from '@/users/providers/shared-user.provider';
export declare class GetMyConversationsService {
    private readonly conversationsProvider;
    private readonly userProvider;
    constructor(conversationsProvider: ConversationsProvider, userProvider: SharedUserProvider);
    getMyConversations(id: string): Promise<unknown>;
}
//# sourceMappingURL=get-my-conversations.service.d.ts.map