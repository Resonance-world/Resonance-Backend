import { Router } from 'express';
import { GetMyConversationsService } from "../messages/services/get-my-conversations.service";
import { ConversationsProvider } from "../messages/providers/conversations.provider";
import { SharedUserProvider } from "../users/providers/shared-user.provider";
import { GetMessagesService } from "../messages/services/get-messages.service";
import { MessagesProvider } from "../messages/providers/messages.provider";
import { RelationshipsService } from "../relationships/services/check-relationships.service";
import { GetRelationshipProvider } from "../relationships/providers/get-relationship.provider";
import { WriteMessageService } from "../messages/services/write-message.service";
import { socketService } from "../messages/services/socket-service-singleton";
import { sessionAuthMiddleware } from "../middleware/sessionAuth";
const router = Router();
const conversationsProvider = new ConversationsProvider();
const userProvider = new SharedUserProvider();
const getRelationshipProvider = new GetRelationshipProvider();
const sharedUserProvider = new SharedUserProvider();
const messagesProvider = new MessagesProvider();
const relationshipsService = new RelationshipsService(getRelationshipProvider, sharedUserProvider);
const getMessagesService = new GetMessagesService(messagesProvider, relationshipsService);
// Use the singleton socketService instance
console.log('✅ socketService singleton loaded successfully:', !!socketService);
const writeMessageService = new WriteMessageService(messagesProvider, relationshipsService, socketService);
const getMyConversationsService = new GetMyConversationsService(conversationsProvider, userProvider);
// Get conversations
router.get('/conversations/:id', sessionAuthMiddleware, async (req, res) => {
    try {
        const conversations = await getMyConversationsService.getMyConversations(req.userId); // TODO req.userId for the logged user but put the ID from the server side if the middleware give it to us
        res.json(conversations);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get conversation messages
router.get('/get-conv-messages/:id', sessionAuthMiddleware, async (req, res) => {
    try {
        console.log('🔍 Backend: GET /api/messages/get-conv-messages/:id - Request received');
        const receiverId = req.params.id;
        const currentUserId = req.query.userId;
        console.log('🔍 Backend: Getting messages for userId:', currentUserId, 'receiverId:', receiverId);
        const messages = await getMessagesService.getMessagesByConversation(currentUserId, receiverId);
        console.log('🔍 Backend: Messages result:', messages);
        console.log('🔍 Backend: Number of messages found:', messages?.length || 0);
        res.json(messages);
    }
    catch (error) {
        console.error('🔍 Backend: Error getting messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Send message
router.post('/send', sessionAuthMiddleware, async (req, res) => {
    try {
        const { receiverId, content, userId } = req.body;
        console.log('Received message:', { receiverId, content, userId, authenticatedUserId: req.userId });
        const message = await writeMessageService.writeMessage(userId || req.userId, receiverId, content);
        res.json({ success: true, message: "Message sent successfully", data: message });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get unread messages count by sender
router.get('/unread/:userId', sessionAuthMiddleware, async (req, res) => {
    try {
        const currentUserId = req.params.userId;
        const { userIds } = req.query; // Array of user IDs to check unread messages for
        console.log('🔍 Getting unread messages for user:', currentUserId);
        console.log('🔍 Checking unread messages for users:', userIds);
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ error: 'userIds query parameter is required and must be an array' });
        }
        // Check if each user has unread messages (based on last message)
        const unreadMessages = await Promise.all(userIds.map(async (userId) => {
            const hasUnread = await messagesProvider.hasUnreadMessagesFromUser(currentUserId, userId);
            return {
                senderId: userId,
                hasUnread: hasUnread,
            };
        }));
        // Filter out users with no unread messages
        const usersWithUnreadMessages = unreadMessages.filter(msg => msg.hasUnread);
        console.log('🔍 Unread messages result:', usersWithUnreadMessages);
        res.json({ unreadMessages: usersWithUnreadMessages });
    }
    catch (error) {
        console.error('🔍 Error getting unread messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Mark messages as read
router.post('/mark-read', async (req, res) => {
    try {
        const { currentUserId, senderId } = req.body;
        console.log('📖 Marking messages as read from:', senderId, 'to:', currentUserId);
        console.log('📖 Request body:', req.body);
        const result = await messagesProvider.markMessagesAsRead(currentUserId, senderId);
        console.log('✅ Messages marked as read successfully. Updated count:', result.count);
        res.json({ success: true, message: 'Messages marked as read', updatedCount: result.count });
    }
    catch (error) {
        console.error('❌ Error marking messages as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=message.js.map