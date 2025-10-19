import { Router, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { sessionAuthMiddleware } from '../middleware/sessionAuth.js';
import { calculateAgeFromString } from '../utils/age.js';
import { prisma } from '../lib/prisma.js';
import { tokenService } from '../services/blockchain/token.service.js';

const router: ExpressRouter = Router();

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
        age: true,
        zodiacSign: true,
        sex: true,
        privateProfilePictureUrl: true,
        userWhy: true,
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
    // Log the request body for debugging (without failing requests)
    console.log('🔍 Profile update request body:', JSON.stringify(req.body, null, 2));

    const userId = (req as any).userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    const { 
      username, 
      profilePictureUrl,
      privateProfilePictureUrl,
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
      websiteUrl,
      dateOfBirth,
      userWhy,
      name,
      sex,
      essenceKeywords,
      communicationTone,
      motivationForConnection
    } = req.body;

    // Debug logging for private profile picture
    if (privateProfilePictureUrl) {
      console.log('🖼️ Received private profile picture update');
      console.log('🖼️ Image type:', privateProfilePictureUrl.startsWith('data:') ? 'base64' : 'url');
      console.log('🖼️ Image length:', privateProfilePictureUrl.length);
      console.log('🖼️ Image preview:', privateProfilePictureUrl.substring(0, 100) + '...');
    }

    // Validate and calculate age if dateOfBirth is provided
    let age: number | undefined;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date of birth format' });
      }
      age = calculateAgeFromString(dateOfBirth);
    }

    // Build update data object with only provided fields (performance optimization)
    const updateData: any = {
      lastActiveAt: new Date(),
      updatedAt: new Date()
    };

    // Only include fields that are actually provided
    if (username !== undefined) updateData.username = username;
    if (profilePictureUrl !== undefined) updateData.profilePictureUrl = profilePictureUrl;
    if (privateProfilePictureUrl !== undefined) updateData.privateProfilePictureUrl = privateProfilePictureUrl;
    if (currentAvailability !== undefined) updateData.currentAvailability = currentAvailability;
    if (locationCountry !== undefined) updateData.locationCountry = locationCountry;
    if (locationCity !== undefined) updateData.locationCity = locationCity;
    if (locationLat !== undefined) updateData.locationLat = locationLat ? parseFloat(locationLat) : undefined;
    if (locationLng !== undefined) updateData.locationLng = locationLng ? parseFloat(locationLng) : undefined;
    if (telegramHandle !== undefined) updateData.telegramHandle = telegramHandle;
    if (instagramHandle !== undefined) updateData.instagramHandle = instagramHandle;
    if (baseFarcasterHandle !== undefined) updateData.baseFarcasterHandle = baseFarcasterHandle;
    if (zoraHandle !== undefined) updateData.zoraHandle = zoraHandle;
    if (linkedinHandle !== undefined) updateData.linkedinHandle = linkedinHandle;
    if (xHandle !== undefined) updateData.xHandle = xHandle;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (userWhy !== undefined) updateData.userWhy = userWhy;
    if (name !== undefined) updateData.name = name;
    if (sex !== undefined) updateData.sex = sex;
    if (essenceKeywords !== undefined) updateData.essenceKeywords = essenceKeywords;
    if (communicationTone !== undefined) updateData.communicationTone = communicationTone;
    if (motivationForConnection !== undefined) updateData.motivationForConnection = motivationForConnection;
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(dateOfBirth);
      if (age !== undefined) updateData.age = age;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        privateProfilePictureUrl: true,
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
      username: updatedUser.username,
      fieldsUpdated: Object.keys(updateData).filter(key => key !== 'lastActiveAt' && key !== 'updatedAt'),
      privateProfilePictureUpdated: !!updateData.privateProfilePictureUrl
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }
    
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
        privateProfilePictureUrl: true,
        isVerified: true,
        verificationLevel: true,
        onboardingCompleted: true,
        currentAvailability: true,
        lastActiveAt: true,
        name: true,
        age: true,
        zodiacSign: true,
        essenceKeywords: true,
        communicationTone: true,
        motivationForConnection: true,
        personalitySummary: true,
        telegramHandle: true,
        instagramHandle: true,
        baseFarcasterHandle: true,
        zoraHandle: true,
        linkedinHandle: true,
        xHandle: true,
        websiteUrl: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        resTokenBalance: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Fetch real-time token balance from blockchain if user has wallet address
    let realTimeBalance = user.resTokenBalance;
    if (user.walletAddress && tokenService.isAvailable()) {
      try {
        const blockchainBalance = await tokenService.getBalance(user.walletAddress);
        realTimeBalance = blockchainBalance.toString();
        console.log(`💰 Real-time balance for ${user.walletAddress}: ${blockchainBalance} RES`);
      } catch (error) {
        console.error('❌ Error fetching real-time balance:', error);
        // Fall back to database balance
      }
    }

    // Create response object with real-time balance
    const userResponse = {
      ...user,
      resTokenBalance: realTimeBalance
    };

    res.json({ 
      success: true, 
      user: userResponse
    });
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

// Get user's token transactions
router.get('/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 transactions
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router; 