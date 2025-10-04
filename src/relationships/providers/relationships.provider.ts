import { RELATION_LEVEL } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export class RelationshipsProvider {
  /**
   * Find a specific relationship between two users
   */
  async findRelationship(relatingUserId: string, relatedUserId: string) {
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
  async createRelationship(data: {
    relatingUserId: string;
    relatedUserId: string;
    // @ts-ignore
    relationLevel: RELATION_LEVEL;
  }) {
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
  async updateRelationship(relationshipId: string, data: { // @ts-ignore
    relationLevel: RELATION_LEVEL }) {
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
  async deleteRelationship(relationshipId: string) {
    return prisma.relationship.delete({
      where: { id: relationshipId },
    });
  }

  /**
   * Get relationships where user is the relating user (the one who added others)
   */
  async getRelationshipsByRelatingUser(userId: string, // @ts-ignore
    relationLevel?: RELATION_LEVEL) {
    const whereClause: any = {
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
  async getRelationshipsByRelatedUser(userId: string, // @ts-ignore
    relationLevel?: RELATION_LEVEL) {
    const whereClause: any = {
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
  async getAllRelationshipsForUser(userId: string, // @ts-ignore
    relationLevel?: RELATION_LEVEL) {
    const whereClause: any = {
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
