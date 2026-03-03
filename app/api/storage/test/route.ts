import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

export async function GET() {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
    })
  );

  return NextResponse.json(result);
}