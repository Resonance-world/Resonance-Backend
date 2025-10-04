var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../services/socket.service.js';
let MessagesGateway = class MessagesGateway {
    socketService;
    constructor(socketService) {
        this.socketService = socketService;
    }
    server = new Server();
    userSockets = new Map();
    afterInit(server) {
        this.socketService.socket = server;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
        // Extract userId from query params
        const userId = client.handshake.query.userId;
        if (userId) {
            this.socketService.insertUserSockets(userId, client.id);
            console.log(`User ${userId} mapped to socket ${client.id}`);
        }
    }
    handleDisconnect(client) {
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
    handleMessage(client, payload) {
        console.log(typeof payload);
        console.log(payload);
        client.emit('reply', 'réponse ok!');
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('wsMessage'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleMessage", null);
MessagesGateway = __decorate([
    WebSocketGateway({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [SocketService])
], MessagesGateway);
export { MessagesGateway };
//# sourceMappingURL=messages.gateway.js.map