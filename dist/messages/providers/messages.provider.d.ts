export declare class MessagesProvider {
    getMessagesBySenderIdAndReceiverId(senderId: string, receiverId: string): import("@prisma/client").Prisma.PrismaPromise<({
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
    writeMessage(senderId: string, content: string, receiverId: string): import("@prisma/client").Prisma.Prisma__MessageClient<{
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
    }, never, import("@prisma/client/runtime/library.js").DefaultArgs>;
    getUnreadMessagesBySender(currentUserId: string): Promise<{
        senderId: string;
        count: number;
    }[]>;
    hasUnreadMessagesFromUser(currentUserId: string, otherUserId: string): Promise<boolean>;
    markMessagesAsRead(currentUserId: string, senderId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=messages.provider.d.ts.map