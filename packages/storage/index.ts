import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export const bucketName = process.env.MINIO_BUCKET_NAME!;

export async function getPresignedUploadUrl(key: string, contentType: string = 'application/pdf') {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  return await getS3SignedUrl(s3, command, { expiresIn: 900 });
}

export async function moveObject(sourceKey: string, destinationKey: string) {
  await s3.send(new CopyObjectCommand({
    Bucket: bucketName,
    CopySource: `${bucketName}/${sourceKey}`,
    Key: destinationKey,
  }));
  await s3.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: sourceKey,
  }));
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));
}
