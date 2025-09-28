import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sessionAuthMiddleware } from '../middleware/sessionAuth';
import { EnhancedMatchingService } from '../matching/services/enhanced-matching.service';

const router: Router = Router();
const prisma = new PrismaClient();
const enhancedMatchingService = new EnhancedMatchingService();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Get user's matches with status
router.get('/', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's matches using enhanced matching service
    const matches = await enhancedMatchingService.getUserMatches(userId);
    
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

// Accept a match (bidirectional)
router.post('/:matchId/accept', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use enhanced matching service to accept match
    const result = await enhancedMatchingService.acceptMatch(userId, matchId);
    
    res.json(result);
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

    // Use enhanced matching service to decline match
    await enhancedMatchingService.declineMatch(userId, matchId);
    
    res.json({ 
      success: true,
      message: 'Match declined successfully'
    });
  } catch (error) {
    console.error('Error declining match:', error);
    res.status(500).json({ error: 'Failed to decline match' });
  }
});

// GET /api/matches/status/:matchId - Check match status
router.get('/status/:matchId', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check match confirmation status
    const isConfirmed = await enhancedMatchingService.checkMatchConfirmation(matchId);
    
    res.json({ 
      matchId,
      isConfirmed,
      status: isConfirmed ? 'CONFIRMED' : 'PENDING'
    });
  } catch (error) {
    console.error('Error checking match status:', error);
    res.status(500).json({ error: 'Failed to check match status' });
  }
});

// Trigger match finding for user's active prompt
router.post('/trigger-finding', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has an active deployed prompt
    const activePrompt = await prisma.deployedPrompt.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (!activePrompt) {
      return res.status(404).json({ error: 'No active deployed prompt found' });
    }

    // Trigger match finding in background
    enhancedMatchingService.findMatches(userId, activePrompt.id).catch(error => {
      console.error('❌ Background match finding failed:', error);
    });

    res.json({ 
      success: true, 
      message: 'Match finding triggered successfully' 
    });
  } catch (error) {
    console.error('Error triggering match finding:', error);
    res.status(500).json({ error: 'Failed to trigger match finding' });
  }
});

export default router;
