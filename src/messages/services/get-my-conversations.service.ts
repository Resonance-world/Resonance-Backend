import { ConversationsProvider } from '@/messages/providers/conversations.provider';
import { SharedUserProvider } from '@/users/providers/shared-user.provider';

export class GetMyConversationsService {
  constructor(
    private readonly conversationsProvider: ConversationsProvider,
    private readonly userProvider: SharedUserProvider,
  ) {}

  async getMyConversations(id: string) {
    const user = await this.userProvider.getUser(id);
    const conversation =
      await this.conversationsProvider.getMyConversations(id);

    if (!user) {
      throw new Error('The user does not exists');
    }
    return conversation;
  }
}
