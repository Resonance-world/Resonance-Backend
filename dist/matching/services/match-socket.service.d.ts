import { Server } from 'socket.io';
export declare class MatchSocketService {
    socket: Server;
    userSockets: Map<string, string>;
    insertUserSockets(userId: string, clientId: string): void;
    removeUserSocket(userId: string): void;
    sendMatchEvent(receiverId: string, eventType: string, eventData: any): boolean;
    sendNewMatchAvailable(receiverId: string, matchData: any): boolean;
    sendMatchStatusChanged(receiverId: string, statusData: any): boolean;
    sendMatchConfirmed(receiverId: string, confirmationData: any): boolean;
}
//# sourceMappingURL=match-socket.service.d.ts.map