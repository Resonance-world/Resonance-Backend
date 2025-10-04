export declare class GetRelationshipProvider {
    getRelationship(firstUserId: string, secondUserId: string): import("@prisma/client").Prisma.Prisma__RelationshipClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        relationLevel: import("@prisma/client").$Enums.RELATION_LEVEL;
        relatingUserId: string;
        relatedUserId: string;
    }, null, import("@prisma/client/runtime/library.js").DefaultArgs>;
}
//# sourceMappingURL=get-relationship.provider.d.ts.map