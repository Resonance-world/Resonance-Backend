import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const themesAndPrompts = [
  {
    name: 'Personal Growth & Transformation',
    description: 'Explore your journey of self-discovery and personal development',
    prompts: [
      'What edge of yourself are you growing into this year?',
      'What habit or belief have you recently outgrown?',
      'When was the last time you surprised yourself?',
      'What challenge is shaping you right now?',
      'If your growth had a metaphor, what would it be?'
    ]
  },
  {
    name: 'Philosophy & Meaning',
    description: 'Dive deep into life\'s big questions and existential wonderings',
    prompts: [
      'What question won\'t leave you alone lately?',
      'Do you believe meaning is discovered or created?',
      'What\'s a paradox you actually enjoy sitting with?',
      'Where do you turn when searching for truth?',
      'What does "a good life" mean to you right now?'
    ]
  },
  {
    name: 'Frontier Tech & Future',
    description: 'Explore the cutting edge of technology and what lies ahead',
    prompts: [
      'What future possibility excites you most?',
      'What do you think humans will still do better than machines in 20 years?',
      'Which frontier technology feels most misunderstood today?',
      'How do you imagine trust working in the future?',
      'If you could time-travel to 2045, what would you ask first?'
    ]
  },
  {
    name: 'Creativity & Artistry',
    description: 'Celebrate the creative spirit and artistic expression',
    prompts: [
      'What\'s been inspiring your creative work lately?',
      'How do you know when something you made feels "alive"?',
      'Which medium best captures your imagination right now?',
      'What role does beauty play in your life?',
      'What\'s a creative risk you\'d love to take soon?'
    ]
  },
  {
    name: 'Science & Experimentation',
    description: 'Embrace curiosity, experimentation, and scientific thinking',
    prompts: [
      'What experiment are you running in your life (or work) right now?',
      'What question would you research if time and money didn\'t matter?',
      'What fascinates you but you don\'t fully understand (yet)?',
      'How do you balance curiosity with skepticism?',
      'What\'s a scientific idea that changed how you see the world?'
    ]
  },
  {
    name: 'Wellness & Embodiment',
    description: 'Connect with your body, health, and holistic well-being',
    prompts: [
      'What practice helps you feel most alive right now?',
      'When do you feel most at home in your body?',
      'How has your relationship with health shifted over time?',
      'What\'s one ritual that grounds you when things get chaotic?',
      'How do you listen to your body\'s wisdom?'
    ]
  },
  {
    name: 'Relationships & Connection',
    description: 'Explore the art of human connection and meaningful relationships',
    prompts: [
      'What kind of connection are you craving more of these days?',
      'What does trust mean to you in friendship or love?',
      'How do you show someone you really see them?',
      'What\'s the most memorable conversation you\'ve had recently?',
      'How do you decide who to let close to you?'
    ]
  },
  {
    name: 'Play & Imagination',
    description: 'Reconnect with your inner child and playful spirit',
    prompts: [
      'When was the last time you felt childlike wonder?',
      'If this week were a myth, what role would you play?',
      'What game or playful activity brings out your best self?',
      'How do you keep imagination alive in your daily life?',
      'What\'s the wildest "what if" idea you\'ve entertained lately?'
    ]
  },
  {
    name: 'Work & Purpose',
    description: 'Reflect on your professional journey and sense of purpose',
    prompts: [
      'What are you building that feels most aligned with your purpose?',
      'How do you know if your work is meaningful?',
      'What kind of impact do you want your work to leave behind?',
      'What energizes you more: starting something new or finishing it?',
      'Who or what keeps you accountable to your vision?'
    ]
  },
  {
    name: 'Society & Culture',
    description: 'Examine the world around us and our place in it',
    prompts: [
      'What part of culture feels ripe for reinvention?',
      'How do you decide which traditions to keep and which to let go?',
      'What\'s one cultural shift you\'ve noticed in your lifetime?',
      'Where do you feel most "at home" in culture today?',
      'What role should art play in shaping society?'
    ]
  },
  {
    name: 'Surprise Me',
    description: 'Wild card questions designed to spark unexpected connections',
    prompts: [
      'What\'s a question you wish people asked you more often?',
      'If you had to teach something tomorrow, what would it be?',
      'What\'s an idea or practice you\'re obsessed with lately?',
      'Which experience shaped you in ways you\'re still unpacking?',
      'If life gave you a plot twist tomorrow, how would you handle it?'
    ]
  }
];

async function seedThemesAndPrompts() {
  try {
    console.log('🌱 Starting to seed themes and prompts...');

    for (const themeData of themesAndPrompts) {
      console.log(`📝 Creating theme: ${themeData.name}`);
      
      const theme = await prisma.theme.upsert({
        where: { name: themeData.name },
        update: {
          description: themeData.description,
          isActive: true
        },
        create: {
          name: themeData.name,
          description: themeData.description,
          isActive: true
        }
      });

      console.log(`✅ Theme created/updated: ${theme.id}`);

      for (const promptText of themeData.prompts) {
        console.log(`  📄 Creating prompt: ${promptText.substring(0, 50)}...`);
        
        await prisma.prompt.upsert({
          where: {
            id: `${theme.id}-${promptText.substring(0, 20)}`
          },
          update: {
            isActive: true
          },
          create: {
            id: `${theme.id}-${promptText.substring(0, 20)}`,
            themeId: theme.id,
            question: promptText,
            isActive: true
          }
        });
      }
    }

    console.log('🎉 Successfully seeded all themes and prompts!');
    
    // Print summary
    const themeCount = await prisma.theme.count();
    const promptCount = await prisma.prompt.count();
    console.log(`📊 Summary: ${themeCount} themes, ${promptCount} prompts`);
    
  } catch (error) {
    console.error('❌ Error seeding themes and prompts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedThemesAndPrompts()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
