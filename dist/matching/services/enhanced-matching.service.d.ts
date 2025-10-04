import { MatchStatus } from '@prisma/client';
export interface MatchAcceptanceResult {
    success: boolean;
    matchStatus: MatchStatus;
    relationshipId?: string;
    message: string;
}
export interface UserMatch {
    id: string;
    question: string;
    category: string;
    user: string;
    userProfile: {
        id: string;
        name: string;
        username: string;
        profilePictureUrl?: string;
        personalitySummary?: string;
    };
    status: MatchStatus;
    userAccepted: boolean;
    otherUserAccepted: boolean;
    relationshipId?: string;
    compatibilityScore: number;
    deployedAt: Date;
}
export declare class EnhancedMatchingService {
    /**
     * Find matches based on prompt or theme
     */
    findMatches(userId: string, deployedPromptId: string): Promise<UserMatch[]>;
    /**
     * Create bidirectional match records
     */
    createBidirectionalMatch(user1Id: string, user2Id: string, matchData: any): Promise<void>;
    /**
     * Handle match acceptance with status tracking
     */
    acceptMatch(userId: string, matchId: string): Promise<MatchAcceptanceResult>;
    /**
     * Check if both users accepted (confirms match)
     */
    checkMatchConfirmation(matchId: string): Promise<boolean>;
    /**
     * Confirm match and create relationship
     */
    private confirmMatch;
    /**
     * Get user's matches with status
     */
    getUserMatches(userId: string): Promise<UserMatch[]>;
    /**
     * Decline match
     */
    declineMatch(userId: string, matchId: string): Promise<void>;
    /**
     * Calculate compatibility score
     */
    private calculateCompatibilityScore;
}
//# sourceMappingURL=enhanced-matching.service.d.ts.map