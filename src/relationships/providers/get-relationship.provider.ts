import { prisma } from '../../lib/prisma.js';

export class GetRelationshipProvider {
  getRelationship(firstUserId: string, secondUserId: string) {
    return prisma.relationship.findFirst({
      where: {
        OR: [
          { relatingUserId: firstUserId, relatedUserId: secondUserId },
          { relatingUserId: secondUserId, relatedUserId: firstUserId },
        ],
      },
    });
  }
}
