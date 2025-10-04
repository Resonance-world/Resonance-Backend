import { prisma } from '../../lib/prisma.js';
export class GetRelationshipProvider {
    getRelationship(firstUserId, secondUserId) {
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
//# sourceMappingURL=get-relationship.provider.js.map