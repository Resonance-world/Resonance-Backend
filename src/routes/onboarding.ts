import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateZodiacSign } from '../utils/zodiac';

const router = Router();
const prisma = new PrismaClient();

// Get onboarding status for a user
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        name: true,
        dateOfBirth: true,
        zodiacSign: true,
        sex: true,
        locationCity: true,
        locationCountry: true,
        surroundingDetail: true,
        essenceKeywords: true,
        essenceStory: true,
        communicationTone: true,
        motivationForConnection: true,
        currentCuriosity: true
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
    console.error('❌ Error fetching onboarding status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding status'
    });
  }
});

// Save onboarding data
router.post('/save', async (req, res) => {
  try {
    const { userId, onboardingData, personalitySummary } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const {
      date_of_birth,
      sex,
      location,
      item_detail,
      essence,
      essence_story,
      communication_tone,
      motivation,
      curiosity
    } = onboardingData;

    // Parse location if it's a string like "City, Country"
    let locationCity = null;
    let locationCountry = null;
    if (location) {
      const locationParts = location.split(',').map((part: string) => part.trim());
      if (locationParts.length >= 2) {
        locationCity = locationParts[0];
        locationCountry = locationParts[1];
      } else {
        locationCountry = locationParts[0];
      }
    }

    // Parse date of birth and calculate zodiac sign
    let dateOfBirth = null;
    let zodiacSign = null;
    if (date_of_birth) {
      dateOfBirth = new Date(date_of_birth);
      zodiacSign = calculateZodiacSign(dateOfBirth);
    }

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        dateOfBirth,
        zodiacSign,
        sex,
        locationCity,
        locationCountry,
        surroundingDetail: item_detail,
        essenceKeywords: essence,
        essenceStory: essence_story,
        communicationTone: communication_tone,
        motivationForConnection: motivation,
        currentCuriosity: curiosity,
        personalitySummary: personalitySummary || 'A thoughtful individual seeking meaningful connections.',
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        lastActiveAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Onboarding data saved for user:', userId);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        onboardingCompleted: updatedUser.onboardingCompleted
      }
    });

  } catch (error) {
    console.error('❌ Error saving onboarding data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save onboarding data'
    });
  }
});

export default router;
