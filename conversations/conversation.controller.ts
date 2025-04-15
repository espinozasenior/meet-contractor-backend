import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import ConversationService from "./conversation.service";
import { CreateConversationDto, CreateMessageDto, ConversationResponse, MessageResponse, PaginatedMessagesResponse } from "./conversation.interface";
import { projectCreatedSubscription } from "./project-subscription";

const createConversation = api(
  { expose: true, method: "POST", path: "/conversations", auth: true },
  async (data: CreateConversationDto): Promise<ConversationResponse> => {
    try {
      const user = getAuthData()!;
      const result = await ConversationService.createConversation({ ...data, userId: user.userID });
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error creating conversation");
    }
  }
);

const sendMessage = api(
  { expose: true, method: "POST", path: "/conversations/:conversationId/messages", auth: true },
  async ({ conversationId, data }: { conversationId: string; data: CreateMessageDto }): Promise<MessageResponse> => {
    try {
      const user = getAuthData()!;
      const result = await ConversationService.sendMessage(conversationId, user.userID, {
        content: data.content,
        attachments: data.attachments,
        role: data.role
      });
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error sending message");
    }
  }
);

const getMessages = api(
  { expose: true, method: "GET", path: "/conversations/:conversationId/messages", auth: true },
  async ({ conversationId, limit, cursor }: { conversationId: string; limit?: number; cursor?: string }): Promise<PaginatedMessagesResponse> => {
    try {
      const user = getAuthData()!;
      const result = await ConversationService.getMessages(conversationId, user.userID, { limit, cursor });
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error fetching messages");
    }
  }
);

const editMessage = api(
  { expose: true, method: "PUT", path: "/conversations/:conversationId/messages/:messageId", auth: true },
  async ({ conversationId, messageId, data }: { conversationId: string; messageId: string; data: { content: string } }): Promise<MessageResponse> => {
    try {
      const user = getAuthData()!;
      const result = await ConversationService.editMessage(messageId, user.userID, data.content);
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error editing message");
    }
  }
);

const deleteMessage = api(
  { expose: true, method: "DELETE", path: "/conversations/:conversationId/messages/:messageId", auth: true },
  async ({ conversationId, messageId }: { conversationId: string; messageId: string }): Promise<MessageResponse> => {
    try {
      const user = getAuthData()!;
      const result = await ConversationService.deleteMessage(messageId, user.userID);
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error deleting message");
    }
  }
);

export { createConversation, sendMessage, getMessages, editMessage, deleteMessage, projectCreatedSubscription };