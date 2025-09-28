import { prisma } from '../../lib/prisma.js';

export class SharedUserProvider {
  getUser(id: string) {
    return prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }
}
