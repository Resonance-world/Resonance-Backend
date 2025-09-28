import { Router } from 'express';
import { sessionAuthMiddleware } from '../middleware/sessionAuth';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Get all active themes
router.get('/', async (req, res) => {
  try {
    const themes = await prisma.theme.findMany({
      where: { isActive: true },
      include: {
        prompts: {
          where: { isActive: true },
          select: {
            id: true,
            question: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// Get prompts for a specific theme
router.get('/:themeId/prompts', async (req, res) => {
  try {
    const { themeId } = req.params;
    
    const prompts = await prisma.prompt.findMany({
      where: { 
        themeId,
        isActive: true 
      },
      orderBy: { question: 'asc' }
    });

    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Create a new theme (admin only - for future use)
router.post('/', sessionAuthMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Theme name is required' });
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json(theme);
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// Create a new prompt (admin only - for future use)
router.post('/:themeId/prompts', sessionAuthMiddleware, async (req, res) => {
  try {
    const { themeId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Prompt question is required' });
    }

    const prompt = await prisma.prompt.create({
      data: {
        themeId,
        question
      }
    });

    res.status(201).json(prompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

export default router;
