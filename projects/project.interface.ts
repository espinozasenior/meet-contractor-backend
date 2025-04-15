// DTOs for Project Service and Controller

// Request DTOs
export interface CreateProjectParams {
  name: string;
  location: string;
  description?: string;
}

export interface CreateProjectDTO extends CreateProjectParams{
  ownerId: string;
  status?: string;
}

export interface UpdateProjectParams {
  id: string;
  name?: string;
  location?: string;
}

// Response DTOs
export interface ProjectResponse {
  id: string;
  ownerId: string;
  name: string;
  status: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  conversations?: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    lastReadAt?: Date | null;
    lastMessageAt?: Date | null;
    visibility: string;
  }[];
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
}

export interface DeleteProjectResponse {
  success: boolean;
}