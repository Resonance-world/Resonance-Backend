import { Server } from 'socket.io';
export declare class SocketService {
    socket: Server;
    userSockets: Map<string, string>;
    insertUserSockets(userId: string, clientId: string): void;
    removeUserSocket(userId: string): void;
    sendMessageToUser(receiverId: string, messageData: any): boolean;
}
//# sourceMappingURL=socket.service.d.ts.map