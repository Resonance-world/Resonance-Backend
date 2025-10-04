import { Router } from 'express';
import { sessionAuthMiddleware } from '../middleware/sessionAuth';
import { prisma } from '../lib/prisma.js';
const router = Router();
// Get user's deployed prompts
router.get('/', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get only active deployed prompts for faster loading
        const deployedPrompts = await prisma.deployedPrompt.findMany({
            where: {
                userId,
                status: 'ACTIVE',
                expiresAt: { gte: new Date() }
            },
            include: {
                theme: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                prompt: {
                    select: {
                        id: true,
                        question: true
                    }
                }
            },
            orderBy: { deployedAt: 'desc' },
            take: 1 // Only get the most recent active prompt
        });
        res.json(deployedPrompts);
    }
    catch (error) {
        console.error('Error fetching deployed prompts:', error);
        res.status(500).json({ error: 'Failed to fetch deployed prompts' });
    }
});
// Deploy a new prompt
router.post('/', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { promptId, customPrompt, themeId, themeName, question } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!themeId || !themeName || !question) {
            return res.status(400).json({ error: 'Theme ID, theme name, and question are required' });
        }
        // First, expire any prompts that have passed their expiration date
        await prisma.deployedPrompt.updateMany({
            where: {
                userId,
                status: 'ACTIVE',
                expiresAt: {
                    lt: new Date()
                }
            },
            data: {
                status: 'EXPIRED'
            }
        });
        // Check if user has an active deployed prompt (after expiring old ones)
        const activePrompt = await prisma.deployedPrompt.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            }
        });
        if (activePrompt) {
            return res.status(400).json({ error: 'You already have an active deployed prompt' });
        }
        // Calculate expiration date (3 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);
        const deployedPrompt = await prisma.deployedPrompt.create({
            data: {
                userId,
                promptId: promptId || null,
                customPrompt: customPrompt || null,
                themeId,
                themeName,
                question,
                expiresAt
            },
            include: {
                theme: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                prompt: {
                    select: {
                        id: true,
                        question: true
                    }
                }
            }
        });
        // Trigger match finding for the newly deployed prompt
        const { EnhancedMatchingService } = await import('../matching/services/enhanced-matching.service.js');
        const matchingService = new EnhancedMatchingService();
        // Run match finding in background
        matchingService.findMatches(userId, deployedPrompt.id).catch(error => {
            console.error('❌ Background match finding failed for new prompt:', error);
        });
        res.status(201).json(deployedPrompt);
    }
    catch (error) {
        console.error('Error deploying prompt:', error);
        res.status(500).json({ error: 'Failed to deploy prompt' });
    }
});
// Update deployed prompt status (mark matches as shown)
router.patch('/:id/matches-shown', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const deployedPrompt = await prisma.deployedPrompt.updateMany({
            where: {
                id,
                userId
            },
            data: {
                matchesShown: true
            }
        });
        if (deployedPrompt.count === 0) {
            return res.status(404).json({ error: 'Deployed prompt not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating deployed prompt:', error);
        res.status(500).json({ error: 'Failed to update deployed prompt' });
    }
});
// Cancel a deployed prompt
router.patch('/:id/cancel', sessionAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const deployedPrompt = await prisma.deployedPrompt.updateMany({
            where: {
                id,
                userId,
                status: 'ACTIVE'
            },
            data: {
                status: 'CANCELLED'
            }
        });
        if (deployedPrompt.count === 0) {
            return res.status(404).json({ error: 'Active deployed prompt not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error cancelling deployed prompt:', error);
        res.status(500).json({ error: 'Failed to cancel deployed prompt' });
    }
});
export default router;
//# sourceMappingURL=deployedPrompts.js.map