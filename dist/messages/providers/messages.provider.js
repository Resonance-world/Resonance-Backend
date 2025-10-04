import { prisma } from '../../lib/prisma.js';
export class MessagesProvider {
    getMessagesBySenderIdAndReceiverId(senderId, receiverId) {
        return prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: senderId,
                        receiverId: receiverId,
                    },
                    {
                        senderId: receiverId,
                        receiverId: senderId,
                    },
                ],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
            take: 50,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    writeMessage(senderId, content, receiverId) {
        return prisma.message.create({
            data: {
                senderId: senderId,
                content: content,
                receiverId: receiverId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
        });
    }
    getUnreadMessagesBySender(currentUserId) {
        return prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: currentUserId,
                isRead: false,
            },
            _count: {
                id: true,
            },
        }).then(results => results.map(result => ({
            senderId: result.senderId,
            count: result._count.id,
        })));
    }
    // Check if the last message from other user to current user is unread
    async hasUnreadMessagesFromUser(currentUserId, otherUserId) {
        const lastMessage = await prisma.message.findFirst({
            where: {
                OR: [
                    {
                        senderId: otherUserId,
                        receiverId: currentUserId,
                    },
                    {
                        senderId: currentUserId,
                        receiverId: otherUserId,
                    },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // If there's no message, no unread
        if (!lastMessage) {
            return false;
        }
        // If the last message is from the other user to current user and is unread
        return lastMessage.senderId === otherUserId &&
            lastMessage.receiverId === currentUserId &&
            !lastMessage.isRead;
    }
    markMessagesAsRead(currentUserId, senderId) {
        return prisma.message.updateMany({
            where: {
                senderId: senderId,
                receiverId: currentUserId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }
}
//# sourceMappingURL=messages.provider.js.map