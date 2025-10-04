import { prisma } from '../../lib/prisma.js';
export class SharedUserProvider {
    getUser(id) {
        return prisma.user.findUnique({
            where: {
                id: id,
            },
        });
    }
}
//# sourceMappingURL=shared-user.provider.js.map