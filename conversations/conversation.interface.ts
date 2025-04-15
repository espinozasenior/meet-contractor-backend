import { Role } from "./Role";

export interface CreateConversationDto {
  projectId: string;
  title: string;
  visibility?: string
}

export interface CreateMessageDto {
  content: string;
  attachments?: any;
  role: Role;
}

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content?: string | null;
  attachments?: any;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastReadAt?: Date | null;
  lastMessageAt?: Date | null;
  visibility: string;
  messages?: Message[];
  members?: { id: string; name: string; surname: string }[];
}

export interface ConversationResponse {
  conversation: Conversation;
}

export interface MessageResponse {
  message: Message;
}

export interface PaginatedMessagesResponse {
  messages: Message[];
  nextCursor?: string;
  hasMore: boolean;
}