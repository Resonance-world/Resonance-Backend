import { MessagesProvider } from '../providers/messages.provider';
import { RelationshipsService } from '@/relationships/services/check-relationships.service';
import { SocketService } from './socket.service';
export declare class WriteMessageService {
    private readonly messagesProvider;
    private readonly relationshipsService;
    private readonly socketService;
    constructor(messagesProvider: MessagesProvider, relationshipsService: RelationshipsService, socketService: SocketService);
    writeMessage(senderId: string, receiverId: string, content: string): Promise<{
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
    }>;
}
//# sourceMappingURL=write-message.service.d.ts.map