import { prisma } from '../../lib/prisma.js';
export class RelationshipsProvider {
    /**
     * Find a specific relationship between two users
     */
    async findRelationship(relatingUserId, relatedUserId) {
        return prisma.relationship.findFirst({
            where: {
                relatingUserId,
                relatedUserId,
            },
            include: {
                relatingUser: true,
                relatedUser: true,
            },
        });
    }
    /**
     * Create a new relationship
     */
    async createRelationship(data) {
        return prisma.relationship.create({
            data,
            include: {
                relatingUser: true,
                relatedUser: true,
            },
        });
    }
    /**
     * Update an existing relationship
     */
    async updateRelationship(relationshipId, data) {
        return prisma.relationship.update({
            where: { id: relationshipId },
            data,
            include: {
                relatingUser: true,
                relatedUser: true,
            },
        });
    }
    /**
     * Delete a relationship
     */
    async deleteRelationship(relationshipId) {
        return prisma.relationship.delete({
            where: { id: relationshipId },
        });
    }
    /**
     * Get relationships where user is the relating user (the one who added others)
     */
    async getRelationshipsByRelatingUser(userId, // @ts-ignore
    relationLevel) {
        const whereClause = {
            relatingUserId: userId,
        };
        if (relationLevel) {
            whereClause.relationLevel = relationLevel;
        }
        return prisma.relationship.findMany({
            where: whereClause,
            include: {
                relatingUser: true,
                relatedUser: true,
            },
        });
    }
    /**
     * Get relationships where user is the related user (the one who was added by others)
     */
    async getRelationshipsByRelatedUser(userId, // @ts-ignore
    relationLevel) {
        const whereClause = {
            relatedUserId: userId,
        };
        if (relationLevel) {
            whereClause.relationLevel = relationLevel;
        }
        return prisma.relationship.findMany({
            where: whereClause,
            include: {
                relatingUser: true,
                relatedUser: true,
            },
        });
    }
    /**
     * Get all relationships for a user (both as relating and related user)
     */
    async getAllRelationshipsForUser(userId, // @ts-ignore
    relationLevel) {
        const whereClause = {
            OR: [
                { relatingUserId: userId },
                { relatedUserId: userId },
            ],
        };
        if (relationLevel) {
            whereClause.relationLevel = relationLevel;
        }
        return prisma.relationship.findMany({
            where: whereClause,
            include: {
                relatingUser: true,
                relatedUser: true,
            },
        });
    }
}
//# sourceMappingURL=relationships.provider.js.map