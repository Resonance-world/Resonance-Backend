import { GetRelationshipProvider } from '../../relationships/providers/get-relationship.provider';
import { SharedUserProvider } from '../../users/providers/shared-user.provider';
export declare class RelationshipsService {
    private readonly relationshipsProvider;
    private sharedUserProvider;
    constructor(relationshipsProvider: GetRelationshipProvider, sharedUserProvider: SharedUserProvider);
    checkRelationship(firstUserId: string, secondUserId: string): Promise<boolean>;
}
//# sourceMappingURL=check-relationships.service.d.ts.map