import { RELATION_LEVEL } from '@prisma/client';
export class ManageRelationshipsService {
    relationshipsProvider;
    usersProvider;
    constructor(relationshipsProvider, usersProvider) {
        this.relationshipsProvider = relationshipsProvider;
        this.usersProvider = usersProvider;
    }
    /**
     * Add user to private circle - creates/updates relationship to PRIVATE level
     * Relationships are one-way: if I add you to my private circle, you can see my private garden
     */
    async addToPrivateCircle(relatingUserId, relatedUserId) {
        try {
            // Check if relationship already exists
            const existingRelationship = await this.relationshipsProvider.findRelationship(relatingUserId, relatedUserId);
            if (existingRelationship) {
                // Update existing relationship to PRIVATE
                const updatedRelationship = await this.relationshipsProvider.updateRelationship(existingRelationship.id, { relationLevel: RELATION_LEVEL.PRIVATE });
                console.log('✅ Updated relationship to PRIVATE:', updatedRelationship);
                return updatedRelationship;
            }
            else {
                // Create new PRIVATE relationship
                const newRelationship = await this.relationshipsProvider.createRelationship({
                    relatingUserId,
                    relatedUserId,
                    relationLevel: RELATION_LEVEL.PRIVATE
                });
                console.log('✅ Created new PRIVATE relationship:', newRelationship);
                return newRelationship;
            }
        }
        catch (error) {
            console.error('❌ Error adding to private circle:', error);
            throw error;
        }
    }
    /**
     * Remove user from private circle - updates relationship to PUBLIC level
     * This maintains the relationship but changes the access level
     */
    async removeFromPrivateCircle(relatingUserId, relatedUserId) {
        try {
            const relationship = await this.relationshipsProvider.findRelationship(relatingUserId, relatedUserId);
            if (relationship) {
                // Update relationship to PUBLIC level
                const updatedRelationship = await this.relationshipsProvider.updateRelationship(relationship.id, { relationLevel: RELATION_LEVEL.PUBLIC });
                console.log('✅ Updated relationship to PUBLIC:', updatedRelationship);
                return updatedRelationship;
            }
            else {
                throw new Error('Relationship not found');
            }
        }
        catch (error) {
            console.error('❌ Error removing from private circle:', error);
            throw error;
        }
    }
    /**
     * Remove user from public circle - deletes relationship entirely
     * This completely removes the relationship
     */
    async removeFromPublicCircle(relatingUserId, relatedUserId) {
        try {
            const relationship = await this.relationshipsProvider.findRelationship(relatingUserId, relatedUserId);
            if (relationship) {
                await this.relationshipsProvider.deleteRelationship(relationship.id);
                console.log('✅ Deleted relationship completely');
                return { success: true };
            }
            else {
                throw new Error('Relationship not found');
            }
        }
        catch (error) {
            console.error('❌ Error removing from public circle:', error);
            throw error;
        }
    }
    /**
     * Get user's private relationships (one-way)
     * Returns relationships where the user is the relating user (the one who added others)
     */
    async getPrivateRelationships(userId) {
        try {
            const relationships = await this.relationshipsProvider.getRelationshipsByRelatingUser(userId, RELATION_LEVEL.PRIVATE);
            console.log('✅ Retrieved private relationships:', relationships.length);
            return relationships;
        }
        catch (error) {
            console.error('❌ Error getting private relationships:', error);
            throw error;
        }
    }
    /**
     * Check if user can access someone's private garden
     * Returns true if there's a PRIVATE relationship where the garden owner is the relating user
     * and the current user is the related user
     */
    async canAccessPrivateGarden(currentUserId, gardenOwnerId) {
        try {
            const relationship = await this.relationshipsProvider.findRelationship(gardenOwnerId, // garden owner is the relating user (the one who added the current user)
            currentUserId // current user is the related user (the one who was added)
            );
            const canAccess = relationship && relationship.relationLevel === RELATION_LEVEL.PRIVATE;
            console.log(`🔍 Can ${currentUserId} access ${gardenOwnerId}'s private garden:`, canAccess);
            return canAccess;
        }
        catch (error) {
            console.error('❌ Error checking garden access:', error);
            return false;
        }
    }
}
//# sourceMappingURL=manage-relationships.service.js.map