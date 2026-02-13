import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

const isS3Configured = !!(
  process.env.S3_BUCKET_NAME &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY
);

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}

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
  const key = `${folder}/${randomUUID()}${ext}`;

  if (isS3Configured) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // If using a custom endpoint (like R2), construct the public URL
    const baseUrl = process.env.S3_PUBLIC_URL ||
      `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`;
    return `${baseUrl}/${key}`;
  }

  // Local fallback: save to public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `${randomUUID()}${ext}`);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${folder}/${path.basename(filePath)}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (isS3Configured && !url.startsWith("/uploads")) {
    const client = getS3Client();
    // Extract key from URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith("/")
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
      })
    );
  } else if (url.startsWith("/uploads")) {
    const filePath = path.join(process.cwd(), "public", url);
    await fs.unlink(filePath).catch(() => {});
  }
}
