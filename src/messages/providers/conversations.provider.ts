import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ConversationsProvider {
  async getMyConversations(currentUserId: string) {
    const lastMessages = await prisma.$queryRaw`
    WITH conversation_partner AS (
      SELECT 
        m.id,
        m.content,
        m."createdAt",
        m."senderId",
        m."receiverId",
        CASE 
          WHEN m."senderId" = ${currentUserId} THEN m."receiverId"
          ELSE m."senderId"
        END as "otherUserId",
        
        CASE 
        WHEN m."senderId" = ${currentUserId} THEN receiver.name
        ELSE sender.name
        END as "conversationUserName",
        
        -- Récupérer la relation (bidirectionnelle)
        COALESCE(r1."relationLevel", r2."relationLevel") as "relationLevel"
      FROM "Message" m
      INNER JOIN "User" sender ON m."senderId" = sender.id
      INNER JOIN "User" receiver ON m."receiverId" = receiver.id
      -- LEFT JOIN pour relation dans un sens (currentUser -> otherUser)
      LEFT JOIN "Relationship" r1 ON (
        r1."relatingUserId" = ${currentUserId} 
        AND r1."relatedUserId" = CASE 
          WHEN m."senderId" = ${currentUserId} THEN m."receiverId"
          ELSE m."senderId"
        END
      )
      -- LEFT JOIN pour relation dans l'autre sens (otherUser -> currentUser)
      LEFT JOIN "Relationship" r2 ON (
        r2."relatingUserId" = CASE 
          WHEN m."senderId" = ${currentUserId} THEN m."receiverId"
          ELSE m."senderId"
        END
        AND r2."relatedUserId" = ${currentUserId}
      )
      WHERE m."senderId" = ${currentUserId} OR m."receiverId" = ${currentUserId}
    )
    SELECT DISTINCT ON ("otherUserId") 
      id, content, "createdAt", "senderId", "receiverId", 
   "otherUserId", "relationLevel", "conversationUserName"
    FROM conversation_partner
    ORDER BY "otherUserId", "createdAt" DESC
  `;

    return lastMessages;
  }
}
