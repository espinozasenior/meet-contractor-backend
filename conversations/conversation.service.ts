import { prisma } from "./database";
import { type Visibility } from "@prisma/client";
import { MessageCreatedTopic, MessageUpdatedTopic, MessageDeletedTopic } from "./pubsub";
import { type MessageResponse, type ConversationResponse, type CreateMessageDto, type PaginatedMessagesResponse } from "./conversation.interface";

const ConversationService = {
  createConversation: async ({ projectId, title, userId }: { projectId: string; title: string; userId: string; }): Promise<ConversationResponse> => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          owner: true,
          assistants: true
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const hasAccess = project.ownerId === userId || project.assistants.some(assistant => assistant.id === userId);
      if (!hasAccess) {
        throw new Error('User does not have access to this project');
      }

      const conversation = await prisma.conversation.create({
        data: {
          title,
          projectId,
          visibility: 'PUBLIC' as Visibility,
          members: {
            connect: [
              { id: project.owner.id },
              ...project.assistants.map(assistant => ({ id: assistant.id })),
            ]
          }
        },
        include: {
          members: true,
          messages: true,
          project: true
        }
      });

      return { conversation };
    } catch (error) {
      console.error('[Error] Failed to create conversation:', { projectId, userId, error });
      throw error;
    }
  },

  sendMessage: async (conversationId: string, userId: string, data: CreateMessageDto | CreateMessageDto[]): Promise<MessageResponse> => {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: { 
          id: conversationId,
          members: { some: { id: userId } }
        },
        include: {
          members: true,
          project: true
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found or user does not have access');
      }

      const messages = Array.isArray(data) ? data : [data];
      const messageData = messages.map(msg => ({
        conversationId,
        content: msg.content || null,
        attachments: msg.attachments || null,
        role: msg.role
      }));

      const createdMessages = await prisma.$transaction(async (prisma) => {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() }
        });

        return Promise.all(
          messageData.map(data =>
            prisma.message.create({
              data,
              include: {
                conversation: {
                  include: {
                    project: { select: { id: true, name: true } },
                    members: { select: { id: true, name: true, surname: true } }
                  }
                }
              }
            })
          )
        );
      });

      await Promise.all(
        createdMessages.map(message =>
          MessageCreatedTopic.publish({
            message: {
              ...message,
            },
            conversationId
          })
        )
      );

      return { message: createdMessages[0] };
    } catch (error) {
      console.error('[Error] Failed to create messages:', { conversationId, error });
      throw error;
    }
  },

  getMessages: async (conversationId: string, userId: string, options?: { limit?: number; cursor?: string }): Promise<PaginatedMessagesResponse> => {
    try {
      // Set default limit to 30 messages per request if not specified
      const limit = options?.limit || 30;
      
      // Check if user has access to the conversation
      const conversationAccess = await prisma.conversation.findFirst({
        where: { 
          id: conversationId,
          members: { some: { id: userId } }
        },
        select: { id: true }
      });

      if (!conversationAccess) {
        throw new Error('Conversation not found or user does not have access');
      }

      // Build the query conditions
      const cursorCondition = options?.cursor 
        ? { id: { lt: options.cursor } }
        : {};

      // Fetch messages with pagination
      const messages = await prisma.message.findMany({
        where: { 
          conversationId,
          ...cursorCondition
        },
        take: limit + 1, // Take one extra to determine if there are more messages
        orderBy: { createdAt: 'desc' },
        include: {}
      });

      if (!messages.length) {
        return { messages: [], hasMore: false };
      }

      // Check if there are more messages
      const hasMore = messages.length > limit;
      const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;
      
      // Set the next cursor if there are more messages
      const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1].id : undefined;

      return { 
        messages: paginatedMessages,
        nextCursor,
        hasMore
      };
    } catch (error) {
      console.error('[Error] Failed to fetch messages:', { conversationId, error });
      throw error;
    }
  },

  editMessage: async (messageId: string, userId: string, content: string): Promise<MessageResponse> => {
    try {
      const message = await prisma.message.findFirst({
        where: { id: messageId },
        include: {
          conversation: {
            include: { members: true }
          }
        }
      });

      if (!message || !message.conversation.members.some(member => member.id === userId)) {
        throw new Error('Message not found or user does not have access');
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { content: content || null },
        include: {
          conversation: {
            include: {
              project: { select: { id: true, name: true } },
              members: { select: { id: true, name: true, surname: true } }
            }
          }
        }
      });

      await MessageUpdatedTopic.publish({
        message: updatedMessage,
        conversationId: message.conversationId,
        previousContent: message.content
      });

      return { message: updatedMessage };
    } catch (error) {
      console.error('[Error] Failed to edit message:', { messageId, error });
      throw error;
    }
  },

  deleteMessage: async (messageId: string, userId: string): Promise<MessageResponse> => {
    try {
      const message = await prisma.message.findFirst({
        where: { id: messageId },
        include: {
          conversation: {
            include: { members: true }
          }
        }
      });

      if (!message || !message.conversation.members.some(member => member.id === userId)) {
        throw new Error('Message not found or user does not have access');
      }

      const conversationId = message.conversationId;
      const deletedMessage = await prisma.message.delete({
        where: { id: messageId }
      });

      await MessageDeletedTopic.publish({
        messageId,
        conversationId
      });

      return { message: deletedMessage };
    } catch (error) {
      console.error('[Error] Failed to delete message:', { messageId, error });
      throw error;
    }
  }
};

export default ConversationService;