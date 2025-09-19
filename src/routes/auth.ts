import { Router, type Router as ExpressRouter } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router: ExpressRouter = Router();
const prisma = new PrismaClient();

// World ID verification endpoint
router.post('/verify', async (req, res) => {
  try {
    const { nullifier_hash, verification_level, action, walletAddress, username, profilePictureUrl } = req.body;

    console.log('🔐 Processing World ID verification:', {
      action,
      verification_level,
      walletAddress: walletAddress?.substring(0, 10) + '...',
      nullifier_hash: nullifier_hash?.substring(0, 10) + '...',
      username: username || 'Not provided'
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    let user;
    if (existingUser) {
      // Update existing user
      user = await prisma.user.update({
        where: { walletAddress },
        data: {
          nullifierHash: nullifier_hash,
          verificationLevel: verification_level,
          isVerified: true,
          username: username || existingUser.username,
          profilePictureUrl: profilePictureUrl || existingUser.profilePictureUrl,
          updatedAt: new Date()
        }
      });
      console.log('✅ Existing user updated:', { userId: user.id });
    } else {
      // Create new user with unique ID
      user = await prisma.user.create({
        data: {
          walletAddress,
          nullifierHash: nullifier_hash,
          verificationLevel: verification_level,
          isVerified: true,
          username: username || null,
          profilePictureUrl: profilePictureUrl || null,
          // All other fields will use their default values
        }
      });
      console.log('✅ New user created:', { userId: user.id });
    }

    console.log('✅ User verification completed:', {
      userId: user.id,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified,
      isNewUser: !existingUser
    });

    res.json({ 
      success: true, 
      message: existingUser ? 'User verified successfully' : 'User registered and verified successfully',
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
        isVerified: user.isVerified,
        isNewUser: !existingUser
      }
    });
  } catch (error) {
    console.error('❌ World ID verification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// JWT token validation
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePictureUrl: true,
        isVerified: true,
        verificationLevel: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    res.json({ 
      success: true, 
      user 
    });
  } catch (error) {
    console.error('❌ JWT validation error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Generate JWT token for authenticated user
router.post('/token', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { updatedAt: new Date() },
      create: { walletAddress }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = { 
      userId: user.id, 
      walletAddress: user.walletAddress 
    };
    
    const token = jwt.sign(
      payload, 
      jwtSecret, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    res.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('❌ Token generation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user info by ID
router.get('/user/:userId', async (req, res) => {
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Error fetching user info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 