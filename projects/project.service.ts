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
      location: project.location,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      customerId: project.ownerId.toString()
    };
  },

  findOne: async (id: string): Promise<ProjectResponse | null> => {
    const project = await prisma.project.findUnique({ where: { id: id } });
    if (!project) return null;
    return {
      id: project.id,
      name: project.name,
      location: project.location,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      customerId: project.ownerId.toString()
    };
  },

  findAll: async (): Promise<ProjectResponse[]> => {
    const projects = await prisma.project.findMany();
    return projects.map(project => ({
      id: project.id,
      name: project.name,
      location: project.location,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      customerId: project.ownerId.toString()
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
      location: updated.location,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      customerId: updated.ownerId.toString()
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