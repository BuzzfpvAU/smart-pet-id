import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

const isBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

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
  const filename = `${folder}/${randomUUID()}${ext}`;

  if (isBlobConfigured) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
    });
    return blob.url;
  }

  // Local fallback for development
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `${randomUUID()}${ext}`);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${folder}/${path.basename(filePath)}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (isBlobConfigured && !url.startsWith("/uploads")) {
    await del(url);
  } else if (url.startsWith("/uploads")) {
    const filePath = path.join(process.cwd(), "public", url);
    await fs.unlink(filePath).catch(() => {});
  }
}
