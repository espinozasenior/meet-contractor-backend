import { Topic } from "encore.dev/pubsub";
import { ProjectResponse } from './project.interface';

export interface ProjectCreatedEvent {
  project: ProjectResponse;
}

export const ProjectCreatedTopic = new Topic<ProjectCreatedEvent>("project-created", {
  deliveryGuarantee: "exactly-once",
});