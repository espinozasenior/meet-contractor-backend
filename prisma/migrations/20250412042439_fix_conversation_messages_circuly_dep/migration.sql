-- CreateIndex
CREATE INDEX "conversations_projectId_idx" ON "conversations"("projectId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- RenameForeignKey
ALTER TABLE "conversations" RENAME CONSTRAINT "conversations_projectId_fkey" TO "conversations_project_id_fkey";

-- RenameForeignKey
ALTER TABLE "messages" RENAME CONSTRAINT "messages_conversationId_fkey" TO "messages_conversation_id_fkey";
