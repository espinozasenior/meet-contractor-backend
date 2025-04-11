// DTOs for Project Service and Controller

// Request DTOs
export interface CreateProjectParams {
  name: string;
  location: string;
  description?: string;
  status?: string;
}

export interface CreateProjectDTO extends CreateProjectParams{
  ownerId: string
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
}

export interface ProjectListResponse {
  projects: ProjectResponse[];
}

export interface DeleteProjectResponse {
  success: boolean;
}