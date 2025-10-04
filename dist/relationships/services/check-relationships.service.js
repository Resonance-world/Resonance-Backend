export class RelationshipsService {
    relationshipsProvider;
    sharedUserProvider;
    constructor(relationshipsProvider, sharedUserProvider) {
        this.relationshipsProvider = relationshipsProvider;
        this.sharedUserProvider = sharedUserProvider;
    }
    async checkRelationship(firstUserId, secondUserId) {
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
//# sourceMappingURL=check-relationships.service.js.map