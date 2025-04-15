import { Topic } from "encore.dev/pubsub";

import { Message } from './conversation.interface';

interface MessageCreatedEvent {
  message: Message;
  conversationId: string;
}

export const MessageCreatedTopic = new Topic<MessageCreatedEvent>("message-created", {

  deliveryGuarantee: "at-least-once",
});

interface MessageUpdatedEvent {
  message: Message;
  conversationId: string;
  previousContent?: string | null;
}

export const MessageUpdatedTopic = new Topic<MessageUpdatedEvent>("message-updated", {
  deliveryGuarantee: "exactly-once",
});

interface MessageDeletedEvent {
  messageId: string;
  conversationId: string;
}

export const MessageDeletedTopic = new Topic<MessageDeletedEvent>("message-deleted", {
  deliveryGuarantee: "exactly-once",
});