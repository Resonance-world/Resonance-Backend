import { Router } from 'express';
import { ManageRelationshipsService } from '../relationships/services/manage-relationships.service';
import { RelationshipsProvider } from '../relationships/providers/relationships.provider';
import { SharedUserProvider } from '../users/providers/shared-user.provider';
import { sessionAuthMiddleware } from '../middleware/sessionAuth';
const router = Router();
// Initialize services
const relationshipsProvider = new RelationshipsProvider();
const usersProvider = new SharedUserProvider();
const manageRelationshipsService = new ManageRelationshipsService(relationshipsProvider, usersProvider);
/**
 * POST /api/relationships/add-to-private
 * Add user to private circle (one-way relationship)
 */
router.post('/add-to-private', sessionAuthMiddleware, async (req, res) => {
    try {
        const { relatedUserId } = req.body;
        const relatingUserId = req.userId; // Current user (the one adding)
        if (!relatedUserId) {
            return res.status(400).json({ error: 'relatedUserId is required' });
        }
        if (relatingUserId === relatedUserId) {
            return res.status(400).json({ error: 'Cannot add yourself to private circle' });
        }
        console.log(`🔍 Adding ${relatedUserId} to ${relatingUserId}'s private circle`);
        const relationship = await manageRelationshipsService.addToPrivateCircle(relatingUserId, relatedUserId);
        res.json({
            success: true,
            message: 'User added to private circle successfully',
            relationship
        });
    }
    catch (error) {
        console.error('❌ Error in add-to-private route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/relationships/remove-from-private
 * Remove user from private circle by updating relationship to PUBLIC level
 */
router.post('/remove-from-private', sessionAuthMiddleware, async (req, res) => {
    try {
        const { relatedUserId } = req.body;
        const relatingUserId = req.userId; // Current user (the one removing)
        if (!relatedUserId) {
            return res.status(400).json({ error: 'relatedUserId is required' });
        }
        console.log(`🔍 Removing ${relatedUserId} from ${relatingUserId}'s private circle`);
        const relationship = await manageRelationshipsService.removeFromPrivateCircle(relatingUserId, relatedUserId);
        res.json({
            success: true,
            message: 'User removed from private circle successfully',
            relationship
        });
    }
    catch (error) {
        console.error('❌ Error in remove-from-private route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/relationships/private-relationships
 * Get user's private relationships (one-way)
 */
router.get('/private-relationships', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        console.log(`🔍 Getting private relationships for user: ${userId}`);
        const relationships = await manageRelationshipsService.getPrivateRelationships(userId);
        res.json({
            success: true,
            relationships
        });
    }
    catch (error) {
        console.error('❌ Error in private-relationships route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/relationships/can-access-private-garden/:gardenOwnerId
 * Check if current user can access someone's private garden
 */
router.get('/can-access-private-garden/:gardenOwnerId', sessionAuthMiddleware, async (req, res) => {
    try {
        const currentUserId = req.userId;
        const gardenOwnerId = req.params.gardenOwnerId;
        if (!gardenOwnerId) {
            return res.status(400).json({ error: 'gardenOwnerId is required' });
        }
        console.log(`🔍 Checking if ${currentUserId} can access ${gardenOwnerId}'s private garden`);
        const canAccess = await manageRelationshipsService.canAccessPrivateGarden(currentUserId, gardenOwnerId);
        res.json({
            success: true,
            canAccess,
            currentUserId,
            gardenOwnerId
        });
    }
    catch (error) {
        console.error('❌ Error in can-access-private-garden route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=relationships.js.map