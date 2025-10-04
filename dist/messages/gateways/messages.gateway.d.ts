import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../services/socket.service';
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private socketService;
    constructor(socketService: SocketService);
    server: Server;
    private userSockets;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleMessage(client: Socket, payload: {
        content: string;
        receiverId: number;
    }): void;
}
//# sourceMappingURL=messages.gateway.d.ts.map