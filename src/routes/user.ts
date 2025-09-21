import { Router, type Router as ExpressRouter } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sessionAuthMiddleware } from '../middleware/sessionAuth.js';

const router: ExpressRouter = Router();
const prisma = new PrismaClient();

// Get user profile (for authenticated users)
router.get('/profile', sessionAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        verificationLevel: true,
        nullifierHash: true,
        isActive: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        currentAvailability: true,
        lastActiveAt: true,
        totalMatchesMade: true,
        successfulConnections: true,
        name: true,
        dateOfBirth: true,
        zodiacSign: true,
        sex: true,
        locationCountry: true,
        locationCity: true,
        locationLat: true,
        locationLng: true,
        surroundingDetail: true,
        essenceKeywords: true,
        essenceStory: true,
        communicationTone: true,
        motivationForConnection: true,
        currentCuriosity: true,
        personalitySummary: true,
        telegramHandle: true,
        instagramHandle: true,
        baseFarcasterHandle: true,
        zoraHandle: true,
        linkedinHandle: true,
        xHandle: true,
        websiteUrl: true,
        annoyIndexPosition: true,
        essenceEmbeddingUpdatedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update user profile (for authenticated users)
router.put('/profile', sessionAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { 
      username, 
      profilePictureUrl, 
      currentAvailability,
      locationCountry,
      locationCity,
      locationLat,
      locationLng,
      telegramHandle,
      instagramHandle,
      baseFarcasterHandle,
      zoraHandle,
      linkedinHandle,
      xHandle,
      websiteUrl
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        profilePictureUrl,
        currentAvailability,
        locationCountry,
        locationCity,
        locationLat: locationLat ? parseFloat(locationLat) : undefined,
        locationLng: locationLng ? parseFloat(locationLng) : undefined,
        telegramHandle,
        instagramHandle,
        baseFarcasterHandle,
        zoraHandle,
        linkedinHandle,
        xHandle,
        websiteUrl,
        lastActiveAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        verificationLevel: true,
        currentAvailability: true,
        locationCountry: true,
        locationCity: true,
        locationLat: true,
        locationLng: true,
        telegramHandle: true,
        instagramHandle: true,
        baseFarcasterHandle: true,
        zoraHandle: true,
        linkedinHandle: true,
        xHandle: true,
        websiteUrl: true,
        lastActiveAt: true
      }
    });

    console.log('✅ User profile updated:', {
      userId: updatedUser.id,
      username: updatedUser.username
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get all users (for circles/contacts)
router.get('/all', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        onboardingCompleted: true
      },
      select: {
        id: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        lastActiveAt: true,
        name: true,
        zodiacSign: true,
        essenceKeywords: true,
        communicationTone: true,
        motivationForConnection: true,
        createdAt: true
      },
      orderBy: {
        lastActiveAt: 'desc'
      }
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        verificationLevel: true,
        onboardingCompleted: true,
        currentAvailability: true,
        lastActiveAt: true,
        name: true,
        zodiacSign: true,
        essenceKeywords: true,
        communicationTone: true,
        motivationForConnection: true,
        personalitySummary: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user by wallet address
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const user = await prisma.user.findUnique({
      where: { walletAddress: address },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get user by wallet error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Search users (for authenticated users)
router.get('/search', sessionAuthMiddleware, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { walletAddress: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true
      },
      take: 20
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Search users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router; 