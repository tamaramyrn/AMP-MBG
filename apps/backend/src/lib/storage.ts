import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

const bucket = process.env.R2_BUCKET || "amp-mbg"
const publicUrl = process.env.R2_PUBLIC_URL || ""

export async function uploadFile(file: File, folder: string = "reports"): Promise<{ url: string; key: string }> {
  const ext = file.name.split(".").pop() || "bin"
  const key = `${folder}/${randomUUID()}.${ext}`
  const buffer = await file.arrayBuffer()

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    })
  )

  const url = publicUrl ? `${publicUrl}/${key}` : `https://${bucket}.r2.cloudflarestorage.com/${key}`
  return { url, key }
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Ukuran file maksimal 10MB" }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Tipe file tidak diizinkan" }
  }
  return { valid: true }
}
