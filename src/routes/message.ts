import { Router } from 'express';
import {GetMyConversationsService} from "@/messages/services/get-my-conversations.service";
import {ConversationsProvider} from "@/messages/providers/conversations.provider";
import {SharedUserProvider} from "@/users/providers/shared-user.provider";
import {GetMessagesService} from "@/messages/services/get-messages.service";
import {MessagesProvider} from "@/messages/providers/messages.provider";
import {RelationshipsService} from "@/relationships/services/check-relationships.service";
import {GetRelationshipProvider} from "@/relationships/providers/get-relationship.provider";
import {WriteMessageService} from "@/messages/services/write-message.service";
import {SocketService} from "@/messages/services/socket.service";
import {sessionAuthMiddleware} from "@/middleware/sessionAuth";

const router: Router = Router();

const conversationsProvider = new ConversationsProvider();
const userProvider = new SharedUserProvider();
const getRelationshipProvider = new GetRelationshipProvider();
const sharedUserProvider = new SharedUserProvider();
const messagesProvider = new MessagesProvider();
const relationshipsService = new RelationshipsService(getRelationshipProvider, sharedUserProvider);
const getMessagesService = new GetMessagesService(messagesProvider, relationshipsService);
const socketService = new SocketService();
const writeMessageService = new WriteMessageService(messagesProvider, relationshipsService, socketService);

const getMyConversationsService = new GetMyConversationsService(
    conversationsProvider,
    userProvider,
);


// Get conversations
router.get('/conversations/:id', sessionAuthMiddleware, async (req, res) => {
  try {
    const conversations = await getMyConversationsService.getMyConversations((req as any).userId);// TODO req.userId for the logged user but put the ID from the server side if the middleware give it to us
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation messages
router.get('/get-conv-messages/:id', sessionAuthMiddleware, async (req, res) => {
  try {
    console.log('🔍 Backend: GET /api/messages/get-conv-messages/:id - Request received');
    const receiverId = req.params.id;
    const currentUserId = req.query.userId as string;
    console.log('🔍 Backend: Getting messages for userId:', currentUserId, 'receiverId:', receiverId);
    const messages = await getMessagesService.getMessagesByConversation(currentUserId, receiverId);
    console.log('🔍 Backend: Messages result:', messages);
    console.log('🔍 Backend: Number of messages found:', messages?.length || 0);
    res.json(messages);
  } catch (error) {
    console.error('🔍 Backend: Error getting messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
router.post('/send', sessionAuthMiddleware, async (req, res) => {
  try {
    const { receiverId, content, userId } = req.body;
    console.log('Received message:', { receiverId, content, userId, authenticatedUserId: (req as any).userId });
    
    const message = await writeMessageService.writeMessage(userId || (req as any).userId, receiverId, content);
    res.json({ success: true, message: "Message sent successfully", data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
