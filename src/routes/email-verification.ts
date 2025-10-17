import { Router, Request, Response } from 'express';
import { sessionAuthMiddleware } from '../middleware/sessionAuth.js';
import { prisma } from '../lib/prisma.js';
import { Resend } from 'resend';
import { tokenService } from '../services/blockchain/token.service.js';

const router: Router = Router();

// Initialize Resend with proper error handling
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('⚠️ RESEND_API_KEY not found in environment variables. Email verification will be disabled.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code to email
router.post('/send-code', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { email } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Check if email is already verified by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerified: true,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'This email is already verified by another account' 
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unverified codes for this user
    await prisma.emailVerificationCode.deleteMany({
      where: {
        userId,
        verified: false
      }
    });

    // Create new verification code
    await prisma.emailVerificationCode.create({
      data: {
        userId,
        email: email.toLowerCase(),
        code,
        expiresAt
      }
    });

    // Send email with Resend
    if (!resend) {
      console.warn('⚠️ Resend not available - email verification disabled');
      
      // In development, return success with a mock response
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development mode: Mock email sent to ${email} with code ${code}`);
        return res.json({
          success: true,
          message: `Verification code sent to ${email}`,
          expiresAt: expiresAt.toISOString()
        });
      }
      
      return res.status(503).json({ 
        success: false, 
        error: 'Email service temporarily unavailable' 
      });
    }

    try {
      console.log(`📧 Attempting to send verification email to: ${email}`);
      const emailResult = await resend.emails.send({
        from: 'Resonance <noreply@resonances.world>',
        to: email,
        subject: 'Your Resonance Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                  border-radius: 12px;
                  padding: 40px;
                  text-align: center;
                }
                .logo {
                  font-size: 28px;
                  font-weight: bold;
                  color: #4ade80;
                  margin-bottom: 30px;
                  letter-spacing: 2px;
                }
                .code-box {
                  background: #0a0a0a;
                  border: 2px solid #4ade80;
                  border-radius: 8px;
                  padding: 24px;
                  margin: 30px 0;
                }
                .code {
                  font-size: 36px;
                  font-weight: bold;
                  color: #4ade80;
                  letter-spacing: 8px;
                  font-family: 'Courier New', monospace;
                }
                .text {
                  color: #e5e5e5;
                  font-size: 16px;
                  margin: 20px 0;
                }
                .reward {
                  background: #4ade80;
                  color: #0a0a0a;
                  padding: 16px;
                  border-radius: 8px;
                  font-weight: bold;
                  margin-top: 30px;
                }
                .footer {
                  color: #888;
                  font-size: 12px;
                  margin-top: 30px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">RESONANCE</div>
                <p class="text">Your verification code is:</p>
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                <p class="text">This code will expire in 10 minutes.</p>
                <div class="reward">
                  🎁 Earn 10 RES Tokens
                  <br/>
                  <small>Complete verification to receive your reward</small>
                </div>
                <p class="footer">
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `
      });

      console.log(`✅ Email sent successfully:`, emailResult);

      return res.json({
        success: true,
        message: 'Verification code sent to your email',
        expiresAt: expiresAt.toISOString()
      });
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      });
    }
  } catch (error) {
    console.error('❌ Error in send-code:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify code
router.post('/verify-code', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Verification code is required' });
    }

    // Find the verification code
    const verificationCode = await prisma.emailVerificationCode.findFirst({
      where: {
        userId,
        code: code.trim(),
        verified: false
      }
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Mark code as verified
    await prisma.emailVerificationCode.update({
      where: { id: verificationCode.id },
      data: { verified: true }
    });

    // Get user's wallet address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true }
    });

    if (!user || !user.walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'User wallet address not found'
      });
    }

    // Update user email and verification status
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: verificationCode.email,
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Award 10 RES tokens for email verification
    const rewardAmount = 10;
    
    // Mint tokens on-chain
    const mintResult = await tokenService.mintTokens(
      user.walletAddress,
      rewardAmount,
      'Email verification reward'
    );

    // Update database records
    await prisma.$transaction([
      // Add to user balance
      prisma.user.update({
        where: { id: userId },
        data: {
          resTokenBalance: {
            increment: rewardAmount
          }
        }
      }),
      // Create transaction record
      prisma.tokenTransaction.create({
        data: {
          userId,
          amount: rewardAmount,
          type: 'EMAIL_VERIFICATION',
          description: 'Email verification reward',
          status: mintResult.success ? 'completed' : 'pending',
          transactionHash: mintResult.txHash
        }
      })
    ]);

    return res.json({
      success: true,
      message: 'Email verified successfully',
      reward: {
        amount: rewardAmount,
        token: 'RES'
      },
      onChain: mintResult.success,
      txHash: mintResult.txHash
    });
  } catch (error) {
    console.error('❌ Error in verify-code:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Check verification status
router.get('/status', sessionAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailVerified: true,
        emailVerifiedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      email: user.email,
      verified: user.emailVerified,
      verifiedAt: user.emailVerifiedAt
    });
  } catch (error) {
    console.error('❌ Error in verification status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;

