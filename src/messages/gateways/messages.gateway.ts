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

    console.debug(client.handshake.query, 'hndshake');
    console.debug(typeof client.handshake.query);
    // Extract userId from query params or auth token
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.socketService.insertUserSockets(userId, client.id);
      console.log(`User ${userId} mapped to socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // User Id is the id of the client supposed to receive the sh on the frontend
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
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
