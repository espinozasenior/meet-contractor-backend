import { Bucket } from "encore.dev/storage/objects";

export interface FileEntry {
  data: any[];
  filename: string;
  mimeType: string;
}

export interface UploadFileParams {
  project_id: string;
}

export interface UploadFileResponse {
  media: {
    name: string;
    mime_type: string;
    url: string;
  };
}

export interface ListResponse {
  files: {
    name: string;
    url: string;
  }[];
}

export interface MediaHeaders {
  "Content-Type"?: string;
  "Connection"?: string;
  [key: string]: string | undefined;
}

export interface MediaBucketConfig {
  versioned: boolean;
  public: boolean;
}