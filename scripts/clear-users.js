import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearUsers() {
  try {
    console.log('🗑️  Clearing users table...');
    
    // Delete related data first (due to foreign key constraints)
    await prisma.chatbotMessage.deleteMany({});
    await prisma.chatbotSession.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversationParticipant.deleteMany({});
    await prisma.conversation.deleteMany({});
    
    // Finally delete users
    const deletedUsers = await prisma.user.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deletedUsers.count} users and all related data`);
    console.log('🎉 Database is ready for fresh onboarding testing!');
    
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers(); 
 