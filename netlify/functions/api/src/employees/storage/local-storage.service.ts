import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { diskStorage, type StorageEngine } from "multer";
import type { RequestUser } from "../../auth/request-context";
import { UPLOADS_ROOT } from "./uploads-path";

// Local filesystem storage for employee documents in dev. Swappable for an
// S3/MinIO-backed implementation later without changing the controller API —
// only storageKey's meaning (a relative path here) and resolveAbsolutePath /
// deleteFile would need a new implementation behind the same interface.
export function createEmployeeDocumentsStorage(): StorageEngine {
  return diskStorage({
    destination: (req, _file, callback) => {
      const user = (req as Request & { user?: RequestUser }).user;
      const employeeId = req.params.id;
      if (!user || !employeeId) {
        callback(new Error("Missing organization or employee context for upload"), "");
        return;
      }
      const dir = path.join(UPLOADS_ROOT, user.organizationId, employeeId);
      fs.mkdirSync(dir, { recursive: true });
      callback(null, dir);
    },
    filename: (_req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      callback(null, `${crypto.randomUUID()}-${safeName}`);
    },
  });
}

@Injectable()
export class LocalStorageService {
  // Given the absolute path multer wrote to, return the key we persist in
  // the DB: a path relative to UPLOADS_ROOT, portable across deployments.
  toStorageKey(absolutePath: string): string {
    return path.relative(UPLOADS_ROOT, absolutePath).split(path.sep).join("/");
  }

  resolveAbsolutePath(storageKey: string): string {
    return path.join(UPLOADS_ROOT, storageKey);
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      await fs.promises.unlink(this.resolveAbsolutePath(storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
