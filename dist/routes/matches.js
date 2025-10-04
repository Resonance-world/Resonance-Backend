import { Router } from 'express';
import { sessionAuthMiddleware } from '../middleware/sessionAuth.js';
import { EnhancedMatchingService } from '../matching/services/enhanced-matching.service.js';
import { prisma } from '../lib/prisma.js';
const router = Router();
const enhancedMatchingService = new EnhancedMatchingService();
// Get user's matches with status
router.get('/', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get user's matches using enhanced matching service
        const matches = await enhancedMatchingService.getUserMatches(userId);
        res.json(matches);
    }
    catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});
// Get matched users (users who both have accepted the match)
router.get('/matched-users', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log('🔍 Getting matched users for user:', userId);
        // Get confirmed matches (both users have accepted)
        const confirmedMatches = await prisma.matchResult.findMany({
            where: {
                OR: [
                    { session: { userId: userId } },
                    { matchedUserId: userId }
                ],
                status: 'CONFIRMED'
            },
            include: {
                session: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                profilePictureUrl: true,
                                privateProfilePictureUrl: true,
                                isVerified: true,
                                lastActiveAt: true,
                                essenceKeywords: true,
                                communicationTone: true,
                                motivationForConnection: true,
                                createdAt: true
                            }
                        }
                    }
                },
                matchedUser: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        profilePictureUrl: true,
                        privateProfilePictureUrl: true,
                        isVerified: true,
                        lastActiveAt: true,
                        essenceKeywords: true,
                        communicationTone: true,
                        motivationForConnection: true,
                        createdAt: true
                    }
                }
            }
        });
        // Extract unique users from confirmed matches
        const matchedUsers = new Map();
        confirmedMatches.forEach(match => {
            // Add the other user (not the current user) to the matched users
            const otherUser = match.session.userId === userId ? match.matchedUser : match.session.user;
            if (otherUser && !matchedUsers.has(otherUser.id)) {
                matchedUsers.set(otherUser.id, {
                    id: otherUser.id,
                    username: otherUser.username,
                    name: otherUser.name,
                    profilePictureUrl: otherUser.profilePictureUrl,
                    privateProfilePictureUrl: otherUser.privateProfilePictureUrl,
                    isVerified: otherUser.isVerified,
                    lastActiveAt: otherUser.lastActiveAt,
                    essenceKeywords: otherUser.essenceKeywords,
                    communicationTone: otherUser.communicationTone,
                    motivationForConnection: otherUser.motivationForConnection,
                    createdAt: otherUser.createdAt
                });
            }
        });
        const users = Array.from(matchedUsers.values());
        console.log('✅ Found matched users:', users.length);
        res.json({
            success: true,
            users: users
        });
    }
    catch (error) {
        console.error('❌ Error fetching matched users:', error);
        res.status(500).json({ error: 'Failed to fetch matched users' });
    }
});
// Helper function to calculate compatibility score
function calculateCompatibilityScore(userPrompt, matchPrompt) {
    let score = 0;
    // Theme match (40% weight)
    if (userPrompt.themeId === matchPrompt.themeId) {
        score += 0.4;
    }
    // Question similarity (30% weight)
    if (userPrompt.question === matchPrompt.question) {
        score += 0.3;
    }
    // Random factor for variety (30% weight)
    score += Math.random() * 0.3;
    return Math.min(score, 1.0);
}
// Accept a match (bidirectional)
router.post('/:matchId/accept', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { matchId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Use enhanced matching service to accept match
        const result = await enhancedMatchingService.acceptMatch(userId, matchId);
        res.json(result);
    }
    catch (error) {
        console.error('Error accepting match:', error);
        res.status(500).json({ error: 'Failed to accept match' });
    }
});
// Decline a match
router.post('/:matchId/decline', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { matchId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Use enhanced matching service to decline match
        await enhancedMatchingService.declineMatch(userId, matchId);
        res.json({
            success: true,
            message: 'Match declined successfully'
        });
    }
    catch (error) {
        console.error('Error declining match:', error);
        res.status(500).json({ error: 'Failed to decline match' });
    }
});
// GET /api/matches/status/:matchId - Check match status
router.get('/status/:matchId', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { matchId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check match confirmation status
        const isConfirmed = await enhancedMatchingService.checkMatchConfirmation(matchId);
        res.json({
            matchId,
            isConfirmed,
            status: isConfirmed ? 'CONFIRMED' : 'PENDING'
        });
    }
    catch (error) {
        console.error('Error checking match status:', error);
        res.status(500).json({ error: 'Failed to check match status' });
    }
});
// Trigger match finding for user's active prompt
router.post('/trigger-finding', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check if user has an active deployed prompt
        const activePrompt = await prisma.deployedPrompt.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            }
        });
        if (!activePrompt) {
            return res.status(404).json({ error: 'No active deployed prompt found' });
        }
        // Trigger match finding in background
        enhancedMatchingService.findMatches(userId, activePrompt.id).catch(error => {
            console.error('❌ Background match finding failed:', error);
        });
        res.json({
            success: true,
            message: 'Match finding triggered successfully'
        });
    }
    catch (error) {
        console.error('Error triggering match finding:', error);
        res.status(500).json({ error: 'Failed to trigger match finding' });
    }
});
export default router;
//# sourceMappingURL=matches.js.map