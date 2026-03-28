import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

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
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `${randomUUID()}${ext}`);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${folder}/${path.basename(filePath)}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (url.startsWith("/uploads")) {
    const filePath = path.join(process.cwd(), "public", url);
    await fs.unlink(filePath).catch(() => {});
  }
}
