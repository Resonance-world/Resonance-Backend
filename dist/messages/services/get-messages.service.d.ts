import { MessagesProvider } from '../../messages/providers/messages.provider';
import { RelationshipsService } from '../../relationships/services/check-relationships.service';
export declare class GetMessagesService {
    private readonly messagesProvider;
    private readonly relationshipsService;
    constructor(messagesProvider: MessagesProvider, relationshipsService: RelationshipsService);
    getMessagesByConversation(senderId: string, receiverId: string): Promise<({
        receiver: {
            username: string;
            id: string;
            name: string;
        };
        sender: {
            username: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        messageType: import("@prisma/client").$Enums.MessageType;
        senderId: string;
        receiverId: string | null;
        isRead: boolean;
        isEdited: boolean;
    })[]>;
}
//# sourceMappingURL=get-messages.service.d.ts.map