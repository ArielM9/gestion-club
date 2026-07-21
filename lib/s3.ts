import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  // Region is configurable per environment. "garage" is the default that
  // works for local Garage/MinIO deployments; production should set
  // S3_REGION explicitly (e.g. "us-east-1", "eu-west-1").
  region: process.env.S3_REGION || "garage",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // ← CRÍTICO para MinIO
});