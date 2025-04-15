import { prisma } from "./database";
import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import busboy from "busboy";
import { APICallMeta, appMeta, currentRequest } from "encore.dev";
import { Bucket } from "encore.dev/storage/objects";
import {
  FileEntry,
  UploadFileParams,
  UploadFileResponse,
  ListResponse,
  MediaHeaders,
} from "./media.interface";

// Define a bucket named 'profile-files' for storing files
export const filesBucket = new Bucket("profile-files", {
  versioned: false,
  public: true,
});

export const save = api.raw(
  { expose: true, method: "POST", path: "/upload/:project_id", auth: false, bodyLimit: null },
  async (req, res) => {
    try {
      const { project_id } = (currentRequest() as APICallMeta).pathParams;
      if (!project_id) {
        throw APIError.invalidArgument("project_id is required");
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: project_id }
      });

      if (!project) {
        throw APIError.notFound(`Project with ID ${project_id} not found`);
      }

      const bb = busboy({
        headers: req.headers as MediaHeaders,
        limits: { files: 1 },
      });
      const entry: FileEntry = { id: crypto.randomUUID(), filename: "", data: [], mimeType: "" };

      return new Promise<UploadFileResponse>((resolve, reject) => {
        bb.on("file", (_, file, info) => {
          entry.mimeType = info.mimeType;
          entry.filename = info.filename;
          file
            .on("data", (data) => {
              entry.data.push(data);
            })
            .on("close", () => {
              log.info(`File ${entry.filename} uploaded`);
            })
            .on("error", (err) => {
              reject(APIError.internal(`File upload failed: ${(err as Error).message}`));
            });
        });

        bb.on("close", async () => {
          try {
            if (!entry.filename || !entry.mimeType) {
              throw APIError.invalidArgument("No file was provided");
            }

            const buf = Buffer.concat(entry.data);

            // Save file to bucket
            await filesBucket.upload(entry.filename, buf, {
              contentType: entry.mimeType,
            });

            // Save file to DB
            const media = await prisma.media.upsert({
              where: { id: entry.id },
              update: {
                data: buf,
                mime_type: entry.mimeType,
                project: {
                  connect: { id: project_id }
                }
              },
              create: {
                id: entry.id,
                name: entry.filename,
                data: buf,
                mime_type: entry.mimeType,
                project: {
                  connect: { id: project_id }
                }
              }
            });
            log.info(`File ${entry.filename} saved`);

            resolve({
              media: {
                id: entry.id,
                name: entry.filename,
                mime_type: entry.mimeType,
                url: filesBucket.publicUrl(entry.filename)
              }
            });
          } catch (err) {
            reject(APIError.internal(`Failed to save file: ${(err as Error).message}`));
          }
        });

        bb.on("error", (err) => {
          reject(APIError.internal(`Busboy error: ${(err as Error).message}`));
        });

        req.pipe(bb);
      });
    } catch (err) {
      throw APIError.internal(`Upload initialization failed: ${(err as Error).message}`);
    }
  }
);

/**
 * Raw endpoint for storing a multiple files to the database.
 * Setting bodyLimit to null allows for unlimited file size.
 */
export const saveMultiple = api.raw(
  { expose: true, method: "POST", path: "/upload-multiple/:project_id", auth: true, bodyLimit: null },
  async (req, res) => {
    try {
      const { project_id } = (currentRequest() as APICallMeta).pathParams;
      if (!project_id) {
        throw APIError.invalidArgument("project_id is required");
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: project_id }
      });

      if (!project) {
        throw APIError.notFound(`Project with ID ${project_id} not found`);
      }

      const bb = busboy({
        headers: req.headers as MediaHeaders,
      });
      const entries: FileEntry[] = [];

      return new Promise<UploadFileResponse>((resolve, reject) => {
        bb.on("file", (_, file, info) => {
          const entry: FileEntry = { 
            id: crypto.randomUUID(),
            filename: info.filename,
            data: [],
            mimeType: info.mimeType
          };

          file
            .on("data", (data) => {
              entry.data.push(data);
            })
            .on("close", () => {
              entries.push(entry);
              log.info(`File ${entry.filename} uploaded`);
            })
            .on("error", (err) => {
              reject(APIError.internal(`File upload failed: ${(err as Error).message}`));
            });
        });

        bb.on("close", async () => {
          try {
            if (entries.length === 0) {
              throw APIError.invalidArgument("No files were provided");
            }

            // Process the last file for the response
            const lastEntry = entries[entries.length - 1];
            const lastBuf = Buffer.concat(lastEntry.data);

            // Save all files
            for (const entry of entries) {
              const buf = Buffer.concat(entry.data);

              // Save file to bucket
              await filesBucket.upload(entry.filename, buf, {
                contentType: entry.mimeType,
              });

              // Save file to DB
              await prisma.media.upsert({
                where: { name: entry.filename },
                update: {
                  data: buf,
                  mime_type: entry.mimeType,
                  project: {
                    connect: { id: project_id }
                  }
                },
                create: {
                  name: entry.filename,
                  data: buf,
                  mime_type: entry.mimeType,
                  project: {
                    connect: { id: project_id }
                  }
                }
              });
              log.info(`File ${entry.filename} saved`);
            }

            resolve({
              media: {
                id: lastEntry.id,
                name: lastEntry.filename,
                mime_type: lastEntry.mimeType,
                url: filesBucket.publicUrl(lastEntry.filename)
              }
            });
          } catch (err) {
            reject(APIError.internal(`Failed to save files: ${(err as Error).message}`));
          }
        });

        bb.on("error", (err) => {
          reject(APIError.internal(`Busboy error: ${(err as Error).message}`));
        });

        req.pipe(bb);
      });
    } catch (err) {
      throw APIError.internal(`Upload initialization failed: ${(err as Error).message}`);
    }
  }
);

// Raw endpoint for serving a file from the database
export const get = api.raw(
  { expose: true, method: "GET", path: "/files/:id" },
  async (req, resp) => {
    try {
      const { id } = (currentRequest() as APICallMeta).pathParams;
      const row = await prisma.media.findUnique({
        where: {
          id,
        },
      });

      if (!row) {
        throw APIError.notFound("File not found");
      }

      const headers: MediaHeaders = {
        "Content-Type": row.mime_type,
        "Connection": "close"
      };
      resp.writeHead(200, headers);
      const chunk = Buffer.from(row.data);
      resp.end(chunk);
    } catch (err) {
      throw APIError.internal((err as Error).message);
    }
  },
);

// API endpoint for listing all files in the database
export const listDBFiles = api(
  { expose: true, method: "GET", path: "/db-files" },
  async (): Promise<ListResponse> => {
    try {
      const rows = await prisma.media.findMany({
        select: {
          name: true,
        },
      });
      if (!rows) {
        return { files: [] };
      }
      const resp: ListResponse = { files: [] };
      const { apiBaseUrl } = appMeta();
      for await (const row of rows) {
        resp.files.push({
          name: row.name,
          url: `${apiBaseUrl}/files/${row.name}`,
        });
      }
      return resp;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Can't reach database server")) {
        throw APIError.unavailable("Database connection error: Unable to reach the database server. Please try again later.");
      }
      throw APIError.internal(`Database error: ${(error as Error).message}`);
    }
  },
);

// API endpoint for listing all files in the bucket
export const listBucketFiles = api(
  { expose: true, method: "GET", path: "/bucket-files" },
  async (): Promise<ListResponse> => {
    try {
      const resp: ListResponse = { files: [] };

      for await (const entry of filesBucket.list({})) {
        resp.files.push({
          url: filesBucket.publicUrl(entry.name),
          name: entry.name,
        });
      }

      return resp;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Can't reach database server")) {
        throw APIError.unavailable("Database connection error: Unable to reach the database server. Please try again later.");
      }
      throw APIError.internal(`Database error: ${(error as Error).message}`);
    }
  },
);

// Serving some static HTML for demo purposes
export const frontend = api.raw(
  { expose: true, path: "/!path", method: "GET" },
  (req, resp) => {
    const headers: MediaHeaders = { "Content-Type": "text/html" };
    resp.writeHead(200, headers);
    resp.end(`
      <html>
        <head></head>
        <body>          
          <form method="POST" enctype="multipart/form-data" action="/upload/b06dc8c1-c580-440a-add2-6da5b167bafc">
            <label for="filefield">Single file upload:</label><br>
            <input type="file" name="filefield">
            <input type="submit">
          </form>
          <br/> 
          <form method="POST" enctype="multipart/form-data" action="/upload-multiple">
            <label for="filefield">Multiple files upload:</label><br>
            <input type="file" name="filefield" multiple>
            <input type="submit">
          </form>
          <br/>
          <h2>Files in DB:</h2>
          <div id="bd-files"></div>
          
          <h2>Files in Bucket:</h2>
          <div id="bucket-files"></div>

         <script>
           async function getData(elementId, url) {
            const el = document.getElementById(elementId);
            try {
              const response = await fetch(url);
              const json = await response.json();
              const list = document.createElement("ul");
              json.files.forEach((file) => {
                const item = document.createElement("li");
                const link = document.createElement("a");
                link.href = file.url;
                link.textContent = file.name;
                item.appendChild(link);
                list.appendChild(item);
              });
              el.appendChild(list);
            } catch (error) {
              console.error(error.message);
            }
          }
          getData("bd-files", "/db-files");
          getData("bucket-files", "/bucket-files");
        </script>
        </body>
      </html>
    `);
  },
);