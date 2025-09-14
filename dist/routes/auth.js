import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const router = Router();
const prisma = new PrismaClient();
// World ID verification endpoint
router.post('/verify', async (req, res) => {
    try {
        const { nullifier_hash, verification_level, action, walletAddress } = req.body;
        console.log('🔐 Processing World ID verification:', {
            action,
            verification_level,
            walletAddress: walletAddress?.substring(0, 10) + '...',
            nullifier_hash: nullifier_hash?.substring(0, 10) + '...'
        });
        // Update or create user with verification status
        const user = await prisma.user.upsert({
            where: { walletAddress },
            update: {
                nullifierHash: nullifier_hash,
                verificationLevel: verification_level,
                isVerified: true,
                updatedAt: new Date()
            },
            create: {
                walletAddress,
                nullifierHash: nullifier_hash,
                verificationLevel: verification_level,
                isVerified: true
            }
        });
        console.log('✅ User verification updated:', {
            userId: user.id,
            isVerified: user.isVerified
        });
        res.json({
            success: true,
            message: 'User verified successfully',
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    }
    catch (error) {
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
        const token = jwt.sign(payload, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
    }
    catch (error) {
        console.error('❌ Token generation error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=auth.js.map