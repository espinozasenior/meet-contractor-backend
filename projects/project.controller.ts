import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import {
  CreateProjectParams,
  UpdateProjectParams,
  ProjectResponse,
  ProjectListResponse,
  DeleteProjectResponse
} from './project.interface';
import ProjectService from './project.service';

const isCustomer = () => {
  const authData = getAuthData();
  return authData?.role === 'customer';
};

/**
 * Create a new project
 */
export const create = api(
  { expose: true, method: "POST", path: "/projects", auth: true },
  async (data: CreateProjectParams): Promise<ProjectResponse> => {
    if (!isCustomer()) {
      throw APIError.permissionDenied("Only customers can create projects");
    }
    try {
      const ownerId = getAuthData()!.userID;
      if (!data.name || !data.location || !data.description) {
        throw APIError.invalidArgument("Missing required fields");
      }
      const result = await ProjectService.create({ ...data, ownerId });
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error creating project");
    }
  }
);

/**
 * Get project by ID
 */
export const readOne = api(
  { expose: true, method: "GET", path: "/projects/:id", auth: true },
  async ({ id }: { id: string }): Promise<ProjectResponse> => {
    try {
      const result = await ProjectService.findOne(id);
      if (!result) {
        throw APIError.notFound("Project not found");
      }
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error fetching project");
    }
  }
);

/**
 * List all projects
 */
export const list = api(
  { expose: true, method: "GET", path: "/projects", auth: true },
  async (): Promise<ProjectListResponse> => {
    try {
      const projects = await ProjectService.findAll();
      return { projects };
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error fetching projects");
    }
  }
);

/**
 * Update project
 */
export const update = api(
  { expose: true, method: "PUT", path: "/projects/:id", auth: true },
  async ({ id, data }: { id: string; data: Omit<UpdateProjectParams, 'id'> }): Promise<ProjectResponse> => {
    try {
      const result = await ProjectService.update(id, data);
      if (!result) {
        throw APIError.notFound("Project not found");
      }
      return result;
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error updating project");
    }
  }
);

/**
 * Delete project
 */
export const destroy = api(
  { expose: true, method: "DELETE", path: "/projects/:id", auth: true },
  async ({ id }: { id: string }): Promise<DeleteProjectResponse> => {
    try {
      const result = await ProjectService.delete(id);
      return { success: result };
    } catch (error) {
      throw APIError.aborted(error?.toString() || "Error deleting project");
    }
  }
);