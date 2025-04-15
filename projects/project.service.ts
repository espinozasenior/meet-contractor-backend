import { prisma } from "./database";
import log from 'encore.dev/log';
import {
  CreateProjectDTO,
  UpdateProjectParams,
  ProjectResponse,
  ProjectListResponse,
  DeleteProjectResponse
} from './project.interface';

const ProjectService = {
  create: async (data: CreateProjectDTO): Promise<ProjectResponse> => {
    // First check if the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: data.ownerId }
    });
    
    if (!userExists) {
      throw new Error(`User with ID ${data.ownerId} not found. Cannot create project with non-existent owner.`);
    }
    
    const project = await prisma.project.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
        status: data.status,
        owner: {
          connect: { id: data.ownerId }
        }
      }
    });
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      location: project.location,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      ownerId: project.ownerId.toString()
    };
  },

  findOne: async (id: string): Promise<ProjectResponse | null> => {
    const project = await prisma.project.findUnique({
      where: { id: id },
      include: {
        conversations: true
      }
    });
    if (!project) return null;
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      location: project.location,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      ownerId: project.ownerId.toString(),
      conversations: project.conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastReadAt: conversation.lastReadAt,
        lastMessageAt: conversation.lastMessageAt,
        visibility: conversation.visibility
      }))
    };
  },

  findAll: async (): Promise<ProjectResponse[]> => {
    const projects = await prisma.project.findMany({
      include: {
        conversations: true
      }
    });
    return projects.map(project => ({
      id: project.id,
      name: project.name,
      status: project.status,
      location: project.location,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      ownerId: project.ownerId.toString(),
      conversations: project.conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastReadAt: conversation.lastReadAt,
        lastMessageAt: conversation.lastMessageAt,
        visibility: conversation.visibility
      }))
    }));
  },

  update: async (id: string, data: Omit<UpdateProjectParams, 'id'>): Promise<ProjectResponse | null> => {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return null;
    }
    const updated = await prisma.project.update({
      where: { id },
      data
    });
    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      location: updated.location,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      ownerId: updated.ownerId.toString()
    };
  },

  delete: async (id: string): Promise<boolean> => {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return false;
    }
    await prisma.project.delete({ where: { id } });
    return true;
  }
};

export default ProjectService;