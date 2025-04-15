import { Subscription } from "encore.dev/pubsub";
import { ProjectCreatedTopic, ProjectCreatedEvent } from "../projects/pubsub";
import ConversationService from "./conversation.service";
import log from "encore.dev/log";

// Subscribe to project:created events
export const projectCreatedSubscription = new Subscription(
  ProjectCreatedTopic,
  "project-created-conversation",
  {
    handler: async (event: ProjectCreatedEvent) => {
      try {
        log.info("Received project:created event", { projectId: event.project.id });
        
        // Create a default conversation for the new project
        const title = `${event.project.name} - Discussion`;
        const result = await ConversationService.createConversation({
          projectId: event.project.id,
          title,
          userId: event.project.ownerId
        });
        
        log.info("Created conversation for new project", {
          projectId: event.project.id,
          conversationId: result.conversation.id
        });
        
        return { success: true };
      } catch (error) {
        log.error("Failed to create conversation for new project", {
          projectId: event.project.id,
          error: error?.toString()
        });
        throw error;
      }
    }
  }
);