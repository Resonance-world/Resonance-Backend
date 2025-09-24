import { GetRelationshipProvider } from '@/relationships/providers/get-relationship.provider';
import { SharedUserProvider } from '@/users/providers/shared-user.provider';

export class RelationshipsService {
  constructor(
    private readonly relationshipsProvider: GetRelationshipProvider,
    private sharedUserProvider: SharedUserProvider,
  ) {}

  async checkRelationship(firstUserId: string, secondUserId: string) {
    // TODO: Re-enable relationship check once relationships are properly set up
    // For now, allow all users to message each other
    return true;
    
    // const [firstUser, secondUser] = await Promise.all([
    //   this.sharedUserProvider.getUser(firstUserId),
    //   this.sharedUserProvider.getUser(secondUserId),
    // ]);

    // if (!firstUser || !secondUser) {
    //   throw new Error('One of the two users does not exist', {});
    // }

    // const relationship = await this.relationshipsProvider.getRelationship(
    //   firstUserId,
    //   secondUserId,
    // );

    // if (!relationship) {
    //   throw new Error("You don't have a relation with this user");
    // }

    // return relationship;
  }
}
