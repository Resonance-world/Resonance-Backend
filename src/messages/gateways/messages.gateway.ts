import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../services/socket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private socketService: SocketService) {}

  @WebSocketServer() server: Server = new Server();

  private userSockets = new Map<string, string>();

  afterInit(server: Server) {
    this.socketService.socket = server;
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Extract userId from query params
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.socketService.insertUserSockets(userId, client.id);
      console.log(`User ${userId} mapped to socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Clean up user socket mapping
    for (const [userId, socketId] of this.socketService.userSockets.entries()) {
      if (socketId === client.id) {
        this.socketService.removeUserSocket(userId);
        console.log(`Removed socket mapping for user ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage('wsMessage')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string; receiverId: number },
  ) {
    console.log(typeof payload);
    console.log(payload);
    client.emit('reply', 'réponse ok!');
  }
}
