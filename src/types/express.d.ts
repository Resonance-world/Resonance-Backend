import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        isActive: boolean;
        isVerified: boolean;
      };
      userId?: string;
    }
  }
}

export {};
