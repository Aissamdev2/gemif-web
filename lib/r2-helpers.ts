'use server'

import { ActionReturn } from "@/app/lib/definitions";
import { r2Client } from "../storage/r2-instance";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";



export async function deleteFileFromR2({ bucket, key }: { bucket: string, key: string }) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const res = await r2Client.send(command);

  } catch (err) {
    console.error(`Failed to delete R2 object ${key}:`, err);
    throw err;
  }
}