import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

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
