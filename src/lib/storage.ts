import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

function getFileExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[contentType] || ".jpg";
}

export async function uploadFile(
  buffer: Buffer,
  contentType: string,
  folder: string = "pets"
): Promise<string> {
  const ext = getFileExtension(contentType);
  const uploadDir = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);

  return `/api/uploads/${folder}/${fileName}`;
}

export async function deleteFile(url: string): Promise<void> {
  const prefix = "/api/uploads/";
  if (url.startsWith(prefix)) {
    const relative = url.slice(prefix.length);
    const filePath = path.join(UPLOADS_DIR, relative);
    await fs.unlink(filePath).catch(() => {});
  } else if (url.startsWith("/uploads/")) {
    // Legacy path support
    const relative = url.slice("/uploads/".length);
    const filePath = path.join(UPLOADS_DIR, relative);
    await fs.unlink(filePath).catch(() => {});
  }
}

export function getUploadPath(relativePath: string): string {
  return path.join(UPLOADS_DIR, relativePath);
}
