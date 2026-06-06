import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { productImageUploadSchema } from "@/lib/validators";

const publicUrlEnvKeys = ["R2_PUBLIC_URL", "R2_PUBLIC_BUCKET_URL", "R2_CUSTOM_DOMAIN"] as const;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Cloudflare R2 uploads.`);
  }
  return value;
}

function getPublicBaseUrl() {
  const value = publicUrlEnvKeys.map((key) => process.env[key]).find(Boolean);
  if (!value) {
    throw new Error("R2_PUBLIC_URL is required for Cloudflare R2 uploads.");
  }
  return value.replace(/\/$/, "");
}

function getR2Client() {
  const accountId = requiredEnv("R2_ACCOUNT_ID");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function extensionFromFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension ? `.${extension}` : "";
}

export async function uploadProductImage(file: File, vendorId: string) {
  const parsed = productImageUploadSchema.parse({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });

  const key = [
    "vendor-products",
    vendorId,
    `${crypto.randomUUID()}${extensionFromFileName(parsed.fileName)}`,
  ].join("/");

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: requiredEnv("R2_BUCKET_NAME"),
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: parsed.contentType,
    })
  );

  return {
    key,
    url: `${getPublicBaseUrl()}/${key}`,
  };
}
