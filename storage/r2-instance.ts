import { S3Client } from "@aws-sdk/client-s3";

const getR2Endpoint = () => {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const isEu = process.env.R2_REGION === "weur" || process.env.R2_BUCKET_REGION === "weur";
  const endpoint = isEu
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : `https://${accountId}.r2.cloudflarestorage.com`;
  
  console.log(endpoint)
  return endpoint
};

export const r2Client = new S3Client({
  region: "auto",
  endpoint: getR2Endpoint(),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID_2!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY_2!,
  },
  forcePathStyle: true
});

