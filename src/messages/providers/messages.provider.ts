import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MessagesProvider {
  getMessagesBySenderIdAndReceiverId(senderId: string, receiverId: string) {
    return prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: senderId,
          },
          { receiverId: receiverId },
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

  writeMessage(senderId: string, content: string, receiverId: string) {
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
}
