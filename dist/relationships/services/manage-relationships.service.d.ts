import { RelationshipsProvider } from '../providers/relationships.provider';
import { SharedUserProvider } from '../../users/providers/shared-user.provider';
export declare class ManageRelationshipsService {
    private relationshipsProvider;
    private usersProvider;
    constructor(relationshipsProvider: RelationshipsProvider, usersProvider: SharedUserProvider);
    /**
     * Add user to private circle - creates/updates relationship to PRIVATE level
     * Relationships are one-way: if I add you to my private circle, you can see my private garden
     */
    addToPrivateCircle(relatingUserId: string, relatedUserId: string): Promise<{
        relatedUser: {
            walletAddress: string;
            username: string | null;
            profilePictureUrl: string | null;
            id: string;
            nullifierHash: string | null;
            annoyIndexPosition: number | null;
            createdAt: Date;
            updatedAt: Date;
            verificationLevel: string | null;
            isVerified: boolean;
            communicationTone: string | null;
            currentAvailability: string;
            currentCuriosity: string | null;
            essenceEmbeddingUpdatedAt: Date | null;
            essenceKeywords: string | null;
            essenceStory: string | null;
            isActive: boolean;
            lastActiveAt: Date;
            locationCity: string | null;
            locationCountry: string | null;
            locationLat: import("@prisma/client/runtime/library").Decimal | null;
            locationLng: import("@prisma/client/runtime/library").Decimal | null;
            motivationForConnection: string | null;
            name: string | null;
            onboardingCompleted: boolean;
            onboardingCompletedAt: Date | null;
            personalitySummary: string | null;
            sex: string | null;
            successfulConnections: number;
            surroundingDetail: string | null;
            totalMatchesMade: number;
            dateOfBirth: Date | null;
            zodiacSign: string | null;
            baseFarcasterHandle: string | null;
            instagramHandle: string | null;
            linkedinHandle: string | null;
            telegramHandle: string | null;
            websiteUrl: string | null;
            xHandle: string | null;
            zoraHandle: string | null;
            age: number | null;
            privateProfilePictureUrl: string | null;
            userWhy: string | null;
        };
        relatingUser: {
            walletAddress: string;
            username: string | null;
            profilePictureUrl: string | null;
            id: string;
            nullifierHash: string | null;
            annoyIndexPosition: number | null;
            createdAt: Date;
            updatedAt: Date;
            verificationLevel: string | null;
            isVerified: boolean;
            communicationTone: string | null;
            currentAvailability: string;
            currentCuriosity: string | null;
            essenceEmbeddingUpdatedAt: Date | null;
            essenceKeywords: string | null;
            essenceStory: string | null;
            isActive: boolean;
            lastActiveAt: Date;
            locationCity: string | null;
            locationCountry: string | null;
            locationLat: import("@prisma/client/runtime/library").Decimal | null;
            locationLng: import("@prisma/client/runtime/library").Decimal | null;
            motivationForConnection: string | null;
            name: string | null;
            onboardingCompleted: boolean;
            onboardingCompletedAt: Date | null;
            personalitySummary: string | null;
            sex: string | null;
            successfulConnections: number;
            surroundingDetail: string | null;
            totalMatchesMade: number;
            dateOfBirth: Date | null;
            zodiacSign: string | null;
            baseFarcasterHandle: string | null;
            instagramHandle: string | null;
            linkedinHandle: string | null;
            telegramHandle: string | null;
            websiteUrl: string | null;
            xHandle: string | null;
            zoraHandle: string | null;
            age: number | null;
            privateProfilePictureUrl: string | null;
            userWhy: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        relationLevel: import("@prisma/client").$Enums.RELATION_LEVEL;
        relatingUserId: string;
        relatedUserId: string;
    }>;
    /**
     * Remove user from private circle - updates relationship to PUBLIC level
     * This maintains the relationship but changes the access level
     */
    removeFromPrivateCircle(relatingUserId: string, relatedUserId: string): Promise<{
        relatedUser: {
            walletAddress: string;
            username: string | null;
            profilePictureUrl: string | null;
            id: string;
            nullifierHash: string | null;
            annoyIndexPosition: number | null;
            createdAt: Date;
            updatedAt: Date;
            verificationLevel: string | null;
            isVerified: boolean;
            communicationTone: string | null;
            currentAvailability: string;
            currentCuriosity: string | null;
            essenceEmbeddingUpdatedAt: Date | null;
            essenceKeywords: string | null;
            essenceStory: string | null;
            isActive: boolean;
            lastActiveAt: Date;
            locationCity: string | null;
            locationCountry: string | null;
            locationLat: import("@prisma/client/runtime/library").Decimal | null;
            locationLng: import("@prisma/client/runtime/library").Decimal | null;
            motivationForConnection: string | null;
            name: string | null;
            onboardingCompleted: boolean;
            onboardingCompletedAt: Date | null;
            personalitySummary: string | null;
            sex: string | null;
            successfulConnections: number;
            surroundingDetail: string | null;
            totalMatchesMade: number;
            dateOfBirth: Date | null;
            zodiacSign: string | null;
            baseFarcasterHandle: string | null;
            instagramHandle: string | null;
            linkedinHandle: string | null;
            telegramHandle: string | null;
            websiteUrl: string | null;
            xHandle: string | null;
            zoraHandle: string | null;
            age: number | null;
            privateProfilePictureUrl: string | null;
            userWhy: string | null;
        };
        relatingUser: {
            walletAddress: string;
            username: string | null;
            profilePictureUrl: string | null;
            id: string;
            nullifierHash: string | null;
            annoyIndexPosition: number | null;
            createdAt: Date;
            updatedAt: Date;
            verificationLevel: string | null;
            isVerified: boolean;
            communicationTone: string | null;
            currentAvailability: string;
            currentCuriosity: string | null;
            essenceEmbeddingUpdatedAt: Date | null;
            essenceKeywords: string | null;
            essenceStory: string | null;
            isActive: boolean;
            lastActiveAt: Date;
            locationCity: string | null;
            locationCountry: string | null;
            locationLat: import("@prisma/client/runtime/library").Decimal | null;
            locationLng: import("@prisma/client/runtime/library").Decimal | null;
            motivationForConnection: string | null;
            name: string | null;
            onboardingCompleted: boolean;
            onboardingCompletedAt: Date | null;
            personalitySummary: string | null;
            sex: string | null;
            successfulConnections: number;
            surroundingDetail: string | null;
            totalMatchesMade: number;
            dateOfBirth: Date | null;
            zodiacSign: string | null;
            baseFarcasterHandle: string | null;
            instagramHandle: string | null;
            linkedinHandle: string | null;
            telegramHandle: string | null;
            websiteUrl: string | null;
            xHandle: string | null;
            zoraHandle: string | null;
            age: number | null;
            privateProfilePictureUrl: string | null;
            userWhy: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        relationLevel: import("@prisma/client").$Enums.RELATION_LEVEL;
        relatingUserId: string;
        relatedUserId: string;
    }>;
    /**
     * Remove user from public circle - deletes relationship entirely
     * This completely removes the relationship
     */
    removeFromPublicCircle(relatingUserId: string, relatedUserId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get user's private relationships (one-way)
     * Returns relationships where the user is the relating user (the one who added others)
     */
    getPrivateRelationships(userId: string): Promise<({
        relatedUser: {
            walletAddress: string;
            username: string | null;
            profilePictureUrl: string | null;
            id: string;
            nullifierHash: string | null;
            annoyIndexPosition: number | null;
            createdAt: Date;
            updatedAt: Date;
            verificationLevel: string | null;
            isVerified: boolean;
            communicationTone: string | null;
            currentAvailability: string;
            currentCuriosity: string | null;
            essenceEmbeddingUpdatedAt: Date | null;
            essenceKeywords: string | null;
            essenceStory: string | null;
            isActive: boolean;
            lastActiveAt: Date;
            locationCity: string | null;
            locationCountry: string | null;
            locationLat: import("@prisma/client/runtime/library").Decimal | null;
            locationLng: import("@prisma/client/runtime/library").Decimal | null;
            motivationForConnection: string | null;
            name: string | null;
            onboardingCompleted: boolean;
            onboardingCompletedAt: Date | null;
            personalitySummary: string | null;
            sex: string | null;
            successfulConnections: number;
            surroundingDetail: string | null;
            totalMatchesMade: number;
            dateOfBirth: Date | null;
            zodiacSign: string | null;
            baseFarcasterHandle: string | null;
            instagramHandle: string | null;
            linkedinHandle: string | null;
            telegramHandle: string | null;
            websiteUrl: string | null;
            xHandle: string | null;
            zoraHandle: string | null;
            age: number | null;
            privateProfilePictureUrl: string | null;
            userWhy: string | null;
        };
        relatingUser: {
            walletAddress: string;
            username: string | null;
            profilePictureUrl: string | null;
            id: string;
            nullifierHash: string | null;
            annoyIndexPosition: number | null;
            createdAt: Date;
            updatedAt: Date;
            verificationLevel: string | null;
            isVerified: boolean;
            communicationTone: string | null;
            currentAvailability: string;
            currentCuriosity: string | null;
            essenceEmbeddingUpdatedAt: Date | null;
            essenceKeywords: string | null;
            essenceStory: string | null;
            isActive: boolean;
            lastActiveAt: Date;
            locationCity: string | null;
            locationCountry: string | null;
            locationLat: import("@prisma/client/runtime/library").Decimal | null;
            locationLng: import("@prisma/client/runtime/library").Decimal | null;
            motivationForConnection: string | null;
            name: string | null;
            onboardingCompleted: boolean;
            onboardingCompletedAt: Date | null;
            personalitySummary: string | null;
            sex: string | null;
            successfulConnections: number;
            surroundingDetail: string | null;
            totalMatchesMade: number;
            dateOfBirth: Date | null;
            zodiacSign: string | null;
            baseFarcasterHandle: string | null;
            instagramHandle: string | null;
            linkedinHandle: string | null;
            telegramHandle: string | null;
            websiteUrl: string | null;
            xHandle: string | null;
            zoraHandle: string | null;
            age: number | null;
            privateProfilePictureUrl: string | null;
            userWhy: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        relationLevel: import("@prisma/client").$Enums.RELATION_LEVEL;
        relatingUserId: string;
        relatedUserId: string;
    })[]>;
    /**
     * Check if user can access someone's private garden
     * Returns true if there's a PRIVATE relationship where the garden owner is the relating user
     * and the current user is the related user
     */
    canAccessPrivateGarden(currentUserId: string, gardenOwnerId: string): Promise<boolean>;
}
//# sourceMappingURL=manage-relationships.service.d.ts.map