import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const sessionAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get user ID from query parameter or body
    const userId = req.query.userId as string || req.body.userId || req.params.userId;
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    // If JWT token is provided, validate it first (enhanced security)
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        if (decoded.userId !== userId) {
          return res.status(401).json({ success: false, error: 'Token mismatch' });
        }
      } catch (jwtError) {
        // If JWT validation fails, continue with existing flow for backward compatibility
        console.log('⚠️ JWT validation failed, continuing with session auth:', jwtError);
      }
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'User account is inactive' });
    }

    req.userId = user.id;
    req.user = user;

    next();
  } catch (error) {
    console.error('❌ Session auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};
