import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sessionAuthMiddleware } from '../middleware/sessionAuth';

const router: Router = Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Get user's matches
router.get('/', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's active deployed prompt
    const activePrompt = await prisma.deployedPrompt.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      },
      include: {
        theme: true
      }
    });

    if (!activePrompt) {
      return res.json([]);
    }

    // Check if we already have a matching session for this prompt
    let matchingSession = await prisma.matchingSession.findFirst({
      where: {
        userId,
        promptId: activePrompt.id,
        status: 'ACTIVE'
      }
    });

    // If no active session, create one and find matches
    if (!matchingSession) {
      matchingSession = await prisma.matchingSession.create({
        data: {
          userId,
          promptId: activePrompt.id,
          status: 'ACTIVE'
        }
      });

      // Find potential matches and calculate compatibility scores
      const potentialMatches = await prisma.deployedPrompt.findMany({
        where: {
          userId: { not: userId },
          status: 'ACTIVE',
          themeId: activePrompt.themeId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePictureUrl: true,
              personalitySummary: true,
              locationCity: true,
              locationCountry: true
            }
          },
          theme: true
        }
      });

      // Calculate compatibility scores and store match results
      for (const match of potentialMatches) {
        // Check if we've already matched with this user
        const existingHistory = await prisma.userMatchHistory.findFirst({
          where: {
            userId,
            matchedUserId: match.userId
          }
        });

        if (existingHistory) {
          continue; // Skip users we've already matched with
        }

        // Calculate compatibility score
        const compatibilityScore = calculateCompatibilityScore(activePrompt, match);
        
        // Store match result
        await prisma.matchResult.create({
          data: {
            sessionId: matchingSession.id,
            matchedUserId: match.userId,
            compatibilityScore,
            themeMatch: activePrompt.themeId === match.themeId,
            questionMatch: activePrompt.question === match.question,
            personalityMatch: false, // TODO: Implement personality matching
            locationMatch: false // TODO: Implement location matching
          }
        });
      }
    }

    // Get match results for this session
    const matchResults = await prisma.matchResult.findMany({
      where: {
        sessionId: matchingSession.id
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
      },
      orderBy: {
        compatibilityScore: 'desc'
      }
    });

    // Convert to match format
    const matches = matchResults.map((result: any) => ({
      id: result.id,
      question: activePrompt.question,
      category: activePrompt.themeName,
      user: result.matchedUser.name || result.matchedUser.username || 'Anonymous',
      userProfile: {
        id: result.matchedUser.id,
        name: result.matchedUser.name,
        username: result.matchedUser.username,
        profilePictureUrl: result.matchedUser.profilePictureUrl,
        personalitySummary: result.matchedUser.personalitySummary
      },
      compatibilityScore: result.compatibilityScore,
      deployedAt: activePrompt.deployedAt
    }));

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Helper function to calculate compatibility score
function calculateCompatibilityScore(userPrompt: any, matchPrompt: any): number {
  let score = 0;
  
  // Theme match (40% weight)
  if (userPrompt.themeId === matchPrompt.themeId) {
    score += 0.4;
  }
  
  // Question similarity (30% weight)
  if (userPrompt.question === matchPrompt.question) {
    score += 0.3;
  }
  
  // Random factor for variety (30% weight)
  score += Math.random() * 0.3;
  
  return Math.min(score, 1.0);
}

// Accept a match (create PUBLIC relationship)
router.post('/:matchId/accept', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get the match details
    const match = await prisma.deployedPrompt.findUnique({
      where: { id: matchId },
      include: {
        user: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        OR: [
          { relatingUserId: userId, relatedUserId: match.userId },
          { relatingUserId: match.userId, relatedUserId: userId }
        ]
      }
    });

    if (existingRelationship) {
      return res.json({ 
        relationshipId: existingRelationship.id,
        message: 'Relationship already exists'
      });
    }

    // Create new PUBLIC relationship
    const relationship = await prisma.relationship.create({
      data: {
        relatingUserId: userId,
        relatedUserId: match.userId,
        relationLevel: 'PUBLIC'
      }
    });

    // Record match history
    await prisma.userMatchHistory.create({
      data: {
        userId,
        matchedUserId: match.userId,
        matchType: 'ACCEPTED',
        sessionId: null // TODO: Get from match result if available
      }
    });

    res.json({ 
      relationshipId: relationship.id,
      message: 'Relationship created successfully'
    });
  } catch (error) {
    console.error('Error accepting match:', error);
    res.status(500).json({ error: 'Failed to accept match' });
  }
});

// Decline a match
router.post('/:matchId/decline', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get the match result to find the matched user
    const matchResult = await prisma.matchResult.findUnique({
      where: { id: matchId },
      include: {
        matchedUser: true
      }
    });

    if (!matchResult) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Record match decline in history
    await prisma.userMatchHistory.create({
      data: {
        userId,
        matchedUserId: matchResult.matchedUserId,
        matchType: 'DECLINED',
        sessionId: matchResult.sessionId
      }
    });

    res.json({ message: 'Match declined successfully' });
  } catch (error) {
    console.error('Error declining match:', error);
    res.status(500).json({ error: 'Failed to decline match' });
  }
});

export default router;
