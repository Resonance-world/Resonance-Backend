import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export class SharedUserProvider {
  getUser(id: string) {
    return prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }
}
