import { Router, type Router as ExpressRouter } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router: ExpressRouter = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
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

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { username, profilePictureUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        profilePictureUrl,
        updatedAt: new Date()
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        verificationLevel: true
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

// Search users
router.get('/search', authMiddleware, async (req, res) => {
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