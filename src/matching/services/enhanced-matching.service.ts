import { MatchStatus, RELATION_LEVEL } from '@prisma/client';
import { matchSocketService } from './match-socket-service-singleton';
import { prisma } from '../../lib/prisma.js';

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

export class EnhancedMatchingService {
  /**
   * Find matches based on prompt or theme
   */
  async findMatches(userId: string, deployedPromptId: string): Promise<UserMatch[]> {
    try {
      // Clean up expired matches first
      await this.cleanupExpiredMatches();
      
      // Get user's deployed prompt
      const userPrompt = await prisma.deployedPrompt.findUnique({
        where: { id: deployedPromptId },
        include: {
          user: true,
          theme: true,
          prompt: true
        }
      });

      if (!userPrompt) {
        throw new Error('Deployed prompt not found');
      }

      console.log('🔍 Finding matches for user:', userId, 'with prompt:', userPrompt.question);

      // Check if a matching session already exists for this user and prompt
      let matchingSession = await prisma.matchingSession.findFirst({
        where: {
          userId: userId,
          promptId: deployedPromptId,
          status: 'ACTIVE'
        }
      });

      // Create a new matching session if one doesn't exist
      if (!matchingSession) {
        matchingSession = await prisma.matchingSession.create({
          data: {
            userId: userId,
            promptId: deployedPromptId,
            status: 'ACTIVE'
          }
        });
        console.log('✅ Created new matching session:', matchingSession.id);
      } else {
        console.log('✅ Using existing matching session:', matchingSession.id);
      }

      // Find potential matches based on same prompt or theme
      const potentialMatches = await prisma.deployedPrompt.findMany({
        where: {
          userId: { not: userId },
          status: 'ACTIVE',
          OR: [
            // Same prompt (exact question match)
            { question: userPrompt.question },
            // Same theme (if custom prompt)
            { themeId: userPrompt.themeId }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePictureUrl: true,
              personalitySummary: true
            }
          },
          theme: true
        },
        take: 5 // Limit to 5 matches
      });

      console.log('🔍 Found potential matches:', potentialMatches.length);

      // Get existing match results to avoid duplicates
      // Check both directions: this user's matches and matches where this user is the matched user
      const existingMatches = await prisma.matchResult.findMany({
        where: {
          OR: [
            // Matches created by this user
            {
              sessionId: matchingSession.id,
              matchedUserId: {
                in: potentialMatches.map(m => m.userId)
              }
            },
            // Matches where this user is the matched user (created by others)
            {
              matchedUserId: userId,
              session: {
                userId: {
                  in: potentialMatches.map(m => m.userId)
                }
              }
            }
          ]
        },
        include: {
          session: {
            select: {
              userId: true
            }
          }
        }
      });

      // Also check UserMatchHistory for previously declined matches
      const declinedMatches = await prisma.userMatchHistory.findMany({
        where: {
          OR: [
            // This user declined others
            {
              userId: userId,
              matchedUserId: {
                in: potentialMatches.map(m => m.userId)
              }
            },
            // Others declined this user
            {
              matchedUserId: userId,
              userId: {
                in: potentialMatches.map(m => m.userId)
              }
            }
          ]
        }
      });

      const existingMatchedUserIds = new Set(existingMatches.map(m => {
        if (!m.session) {
          console.warn('⚠️ Match result missing session data:', m.id);
          return null;
        }
        return m.session.userId === userId ? m.matchedUserId : m.session.userId;
      }).filter(Boolean));

      // Add declined matches to the exclusion set
      const declinedUserIds = new Set(declinedMatches.map(m => 
        m.userId === userId ? m.matchedUserId : m.userId
      ));

      // Combine both sets
      const allExcludedUserIds = new Set([...existingMatchedUserIds, ...declinedUserIds]);

      console.log('🔍 Duplicate prevention stats:', {
        potentialMatches: potentialMatches.length,
        existingMatches: existingMatchedUserIds.size,
        declinedMatches: declinedUserIds.size,
        totalExcluded: allExcludedUserIds.size
      });

      // Filter out already matched users and previously declined users
      const newMatches = potentialMatches.filter(m => !allExcludedUserIds.has(m.userId));

      console.log('🔍 New matches to create:', newMatches.length);

      // Create match results for new matches (bidirectional)
      const matchResults = [];
      for (const match of newMatches) {
        const compatibilityScore = this.calculateCompatibilityScore(userPrompt, match);
        
        // Set expiration to 3 days from now (matches expire after 3 days)
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        
        // Create bidirectional matches using a transaction to ensure consistency
        const [matchResultA, matchResultB] = await prisma.$transaction(async (tx) => {
          // Match from User A to User B
          const matchResultA = await tx.matchResult.create({
            data: {
              sessionId: matchingSession.id,
              matchedUserId: match.userId,
              compatibilityScore,
              themeMatch: userPrompt.themeId === match.themeId,
              questionMatch: userPrompt.question === match.question,
              personalityMatch: false, // TODO: Implement personality matching
              locationMatch: false, // TODO: Implement location matching
              status: MatchStatus.PENDING,
              expiresAt: expiresAt
            },
            include: {
              matchedUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profilePictureUrl: true,
                  personalitySummary: true
                }
              }
            }
          });

          // Find or create a matching session for User B
          let userBSession = await tx.matchingSession.findFirst({
            where: {
              userId: match.userId,
              promptId: match.promptId
            }
          });

          if (!userBSession) {
            userBSession = await tx.matchingSession.create({
              data: {
                userId: match.userId,
                promptId: match.promptId
              }
            });
          }

          // Match from User B to User A
          const matchResultB = await tx.matchResult.create({
            data: {
              sessionId: userBSession.id,
              matchedUserId: userId,
              compatibilityScore,
              themeMatch: userPrompt.themeId === match.themeId,
              questionMatch: userPrompt.question === match.question,
              personalityMatch: false, // TODO: Implement personality matching
              locationMatch: false, // TODO: Implement location matching
              status: MatchStatus.PENDING,
              expiresAt: expiresAt
            },
            include: {
              matchedUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profilePictureUrl: true,
                  personalitySummary: true
                }
              }
            }
          });

          return [matchResultA, matchResultB];
        });
        
        matchResults.push(matchResultA);
        console.log('✅ Created bidirectional match results:', matchResultA.id, 'and', matchResultB.id, 'between users:', userId, 'and', match.userId);
            
            // Emit WebSocket event for new match with complete data
            const matchData = {
              id: matchResultA.id,
              question: userPrompt.question,
              category: userPrompt.theme.name,
              user: userPrompt.user.name || userPrompt.user.username || 'Anonymous',
              userProfile: {
                id: userPrompt.user.id,
                name: userPrompt.user.name,
                username: userPrompt.user.username,
                profilePictureUrl: userPrompt.user.profilePictureUrl,
                personalitySummary: userPrompt.user.personalitySummary
              },
              status: matchResultA.status,
              userAccepted: matchResultA.user1_accepted,
              otherUserAccepted: matchResultA.user2_accepted,
              relationshipId: undefined,
              compatibilityScore: matchResultA.compatibilityScore,
              deployedAt: userPrompt.createdAt
            };
            
            // Send WebSocket event to both users involved in the match
            matchSocketService.sendNewMatchAvailable(match.userId, { 
              userId: match.userId, 
              matchId: matchResultA.id,
              matchData: matchData
            });
            
            // Also send to the original user who deployed the prompt
            matchSocketService.sendNewMatchAvailable(userId, { 
              userId: userId, 
              matchId: matchResultA.id,
              matchData: {
                ...matchData,
                user: userPrompt.user.name || userPrompt.user.username || 'Anonymous',
                userProfile: {
                  id: userPrompt.user.id,
                  name: userPrompt.user.name,
                  username: userPrompt.user.username,
                  profilePictureUrl: userPrompt.user.profilePictureUrl,
                  personalitySummary: userPrompt.user.personalitySummary
                }
              }
            });
      }

      // Convert to UserMatch format
      return matchResults.map(result => ({
        id: result.id,
        question: userPrompt.question,
        category: userPrompt.themeName,
        user: result.matchedUser.name || result.matchedUser.username || 'Anonymous',
        userProfile: {
          id: result.matchedUser.id,
          name: result.matchedUser.name,
          username: result.matchedUser.username,
          profilePictureUrl: result.matchedUser.profilePictureUrl,
          personalitySummary: result.matchedUser.personalitySummary
        },
        status: result.status,
        userAccepted: result.user1_accepted,
        otherUserAccepted: result.user2_accepted,
        relationshipId: undefined, // Will be set when confirmed
        compatibilityScore: result.compatibilityScore,
        deployedAt: userPrompt.deployedAt
      }));
    } catch (error) {
      console.error('❌ Error finding matches:', error);
      throw error;
    }
  }

  /**
   * Create bidirectional match records
   */
  async createBidirectionalMatch(user1Id: string, user2Id: string, matchData: any): Promise<void> {
    try {
      // This is handled in findMatches by creating MatchResult records
      // The bidirectional nature is handled in acceptMatch
      console.log('✅ Bidirectional match creation handled in findMatches');
    } catch (error) {
      console.error('❌ Error creating bidirectional match:', error);
      throw error;
    }
  }

  /**
   * Handle match acceptance with status tracking
   */
  async acceptMatch(userId: string, matchId: string): Promise<MatchAcceptanceResult> {
    try {
      // Get the match result
      const matchResult = await prisma.matchResult.findUnique({
        where: { id: matchId },
        include: {
          session: {
            include: {
              user: true
            }
          },
          matchedUser: true
        }
      });

      if (!matchResult) {
        throw new Error('Match not found');
      }

      // Determine which user is accepting (user1 or user2)
      const isUser1 = matchResult.session.userId === userId;
      const isUser2 = matchResult.matchedUserId === userId;

      if (!isUser1 && !isUser2) {
        throw new Error('User not authorized to accept this match');
      }

      // Update acceptance status
      if (isUser1) {
        await prisma.matchResult.update({
          where: { id: matchId },
          data: { user1_accepted: true }
        });
      } else {
        await prisma.matchResult.update({
          where: { id: matchId },
          data: { user2_accepted: true }
        });
      }

      // Check if both users have accepted
      const updatedMatch = await prisma.matchResult.findUnique({
        where: { id: matchId }
      });

      if (updatedMatch?.user1_accepted && updatedMatch?.user2_accepted) {
        // Both users accepted - confirm the match
        const result = await this.confirmMatch(matchId);
        
        // Emit WebSocket events for match confirmation
        matchSocketService.sendMatchConfirmed(matchResult.session.userId, { 
          matchId, 
          relationshipId: result.relationshipId, 
          userId: matchResult.session.userId 
        });
        matchSocketService.sendMatchConfirmed(matchResult.matchedUserId, { 
          matchId, 
          relationshipId: result.relationshipId, 
          userId: matchResult.matchedUserId 
        });
        
        return result;
      } else {
        // Only one user accepted - still pending
        const otherUserId = isUser1 ? matchResult.matchedUserId : matchResult.session.userId;
        
        // Emit WebSocket event for match status change
        matchSocketService.sendMatchStatusChanged(otherUserId, { 
          matchId, 
          status: 'PENDING', 
          userId: otherUserId 
        });
        
        return {
          success: true,
          matchStatus: MatchStatus.PENDING,
          message: 'Match accepted. Waiting for the other user to accept.'
        };
      }
    } catch (error) {
      console.error('❌ Error accepting match:', error);
      throw error;
    }
  }

  /**
   * Check if both users accepted (confirms match)
   */
  async checkMatchConfirmation(matchId: string): Promise<boolean> {
    try {
      const match = await prisma.matchResult.findUnique({
        where: { id: matchId }
      });

      return match ? match.user1_accepted && match.user2_accepted : false;
    } catch (error) {
      console.error('❌ Error checking match confirmation:', error);
      return false;
    }
  }

  /**
   * Confirm match and create relationship
   */
  private async confirmMatch(matchId: string): Promise<MatchAcceptanceResult> {
    try {
      const match = await prisma.matchResult.findUnique({
        where: { id: matchId },
        include: {
          session: {
            include: {
              user: true
            }
          },
          matchedUser: true
        }
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Check if relationship already exists
      const existingRelationship = await prisma.relationship.findFirst({
        where: {
          OR: [
            { relatingUserId: match.session.userId, relatedUserId: match.matchedUserId },
            { relatingUserId: match.matchedUserId, relatedUserId: match.session.userId }
          ]
        }
      });

      let relationshipId = existingRelationship?.id;

      if (!existingRelationship) {
        // Create PUBLIC relationship
        const relationship = await prisma.relationship.create({
          data: {
            relatingUserId: match.session.userId,
            relatedUserId: match.matchedUserId,
            relationLevel: RELATION_LEVEL.PUBLIC
          }
        });
        relationshipId = relationship.id;
      }

      // Update match status to confirmed
      await prisma.matchResult.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.CONFIRMED,
          confirmed_at: new Date()
        }
      });

      // Record match history (use upsert to handle duplicates)
      try {
        await Promise.all([
          prisma.userMatchHistory.upsert({
            where: {
              userId_matchedUserId: {
                userId: match.session.userId,
                matchedUserId: match.matchedUserId
              }
            },
            update: {
              matchType: 'ACCEPTED'
            },
            create: {
              userId: match.session.userId,
              matchedUserId: match.matchedUserId,
              matchType: 'ACCEPTED'
            }
          }),
          prisma.userMatchHistory.upsert({
            where: {
              userId_matchedUserId: {
                userId: match.matchedUserId,
                matchedUserId: match.session.userId
              }
            },
            update: {
              matchType: 'ACCEPTED'
            },
            create: {
              userId: match.matchedUserId,
              matchedUserId: match.session.userId,
              matchType: 'ACCEPTED'
            }
          })
        ]);
      } catch (historyError) {
        console.warn('⚠️ Failed to record match history (non-critical):', historyError);
        // Continue with the confirm process even if history recording fails
      }

      return {
        success: true,
        matchStatus: MatchStatus.CONFIRMED,
        relationshipId,
        message: 'Match confirmed! You can now start chatting.'
      };
    } catch (error) {
      console.error('❌ Error confirming match:', error);
      throw error;
    }
  }

  /**
   * Clean up expired matches
   */
  async cleanupExpiredMatches(): Promise<number> {
    try {
      const result = await prisma.matchResult.updateMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          status: MatchStatus.PENDING
        },
        data: {
          status: MatchStatus.EXPIRED
        }
      });
      
      console.log('🧹 Cleaned up expired matches:', result.count);
      return result.count;
    } catch (error) {
      console.error('❌ Error cleaning up expired matches:', error);
      throw error;
    }
  }

  /**
   * Get user's matches with status
   */
  async getUserMatches(userId: string): Promise<UserMatch[]> {
    try {
      console.log('🔍 Getting existing matches for user:', userId);

      // Get existing match results (excluding expired ones)
      const matchResults = await prisma.matchResult.findMany({
        where: {
          OR: [
            { session: { userId: userId } },
            { matchedUserId: userId }
          ],
          // Exclude expired matches
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          session: {
            include: {
              user: true,
              prompt: {
                include: {
                  theme: true
                }
              }
            }
          },
          matchedUser: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePictureUrl: true,
              personalitySummary: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return matchResults.map(result => {
        // Fix: Correctly determine the other user
        const isSessionOwner = result.session.userId === userId;
        const otherUser = isSessionOwner ? result.matchedUser : result.session.user;
        
        // Additional safety check: ensure we're not showing the user themselves
        if (otherUser.id === userId) {
          console.error('🚨 CRITICAL: Self-match detected! User:', userId, 'Other user:', otherUser.id);
          // Skip this match to prevent self-matching
          return null;
        }
        
        return {
          id: result.id,
          question: result.session.prompt?.question || 'Unknown question',
          category: result.session.prompt?.theme?.name || 'Unknown theme',
          user: otherUser.name || otherUser.username || 'Anonymous',
          userProfile: {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            profilePictureUrl: otherUser.profilePictureUrl,
            personalitySummary: otherUser.personalitySummary
          },
          status: result.status,
          userAccepted: isSessionOwner ? result.user1_accepted : result.user2_accepted,
          otherUserAccepted: isSessionOwner ? result.user2_accepted : result.user1_accepted,
          relationshipId: result.status === MatchStatus.CONFIRMED ? 'relationship-id' : undefined,
          compatibilityScore: result.compatibilityScore,
          deployedAt: result.session.createdAt
        };
      }).filter(match => match !== null); // Remove any null matches (self-matches)
    } catch (error) {
      console.error('❌ Error getting user matches:', error);
      throw error;
    }
  }

  /**
   * Decline match
   */
  async declineMatch(userId: string, matchId: string): Promise<void> {
    try {
      const match = await prisma.matchResult.findUnique({
        where: { id: matchId },
        include: {
          session: {
            include: {
              user: true
            }
          },
          matchedUser: true
        }
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Update match status to declined
      await prisma.matchResult.update({
        where: { id: matchId },
        data: { status: MatchStatus.DECLINED }
      });

      // Record match history (use upsert to handle duplicates)
      try {
        await prisma.userMatchHistory.upsert({
          where: {
            userId_matchedUserId: {
              userId: userId,
              matchedUserId: match.matchedUserId
            }
          },
          update: {
            matchType: 'DECLINED'
          },
          create: {
            userId: userId,
            matchedUserId: match.matchedUserId,
            matchType: 'DECLINED'
          }
        });
      } catch (historyError) {
        console.warn('⚠️ Failed to record match history (non-critical):', historyError);
        // Continue with the decline process even if history recording fails
      }

      // Emit WebSocket event for match decline to both users
      const statusData = {
        matchId, 
        status: 'DECLINED', 
        userId: userId 
      };
      
      console.log('🔔 Sending decline WebSocket events for match:', matchId);
      console.log('🔔 User who declined:', userId);
      console.log('🔔 Session user:', match.session?.userId);
      console.log('🔔 Matched user:', match.matchedUserId);
      
      // Notify the user who declined
      matchSocketService.sendMatchStatusChanged(userId, statusData);
      
      // Notify the other user involved in the match
      // We need to determine who the other user is based on the match structure
      const otherUserId = match.session?.userId === userId ? match.matchedUserId : match.session?.userId;
      console.log('🔔 Other user to notify:', otherUserId);
      
      if (otherUserId) {
        matchSocketService.sendMatchStatusChanged(otherUserId, statusData);
      }
    } catch (error) {
      console.error('❌ Error declining match:', error);
      throw error;
    }
  }

  /**
   * Calculate compatibility score
   */
  private calculateCompatibilityScore(userPrompt: any, matchPrompt: any): number {
    let score = 0.5; // Base score

    // Same question match (highest priority)
    if (userPrompt.question === matchPrompt.question) {
      score += 0.4;
    }

    // Same theme match
    if (userPrompt.themeId === matchPrompt.themeId) {
      score += 0.2;
    }

    // TODO: Add personality matching
    // TODO: Add location matching

    return Math.min(score, 1.0);
  }
}
