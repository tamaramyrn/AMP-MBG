import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { mkdir, writeFile, unlink } from "fs/promises"
import { join } from "path"

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local"

// S3-compatible client (R2 for prod, Supabase for staging)
const s3 = STORAGE_TYPE !== "local" ? new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: STORAGE_TYPE === "supabase",
}) : null

const bucket = process.env.S3_BUCKET || "amp-mbg"
const publicUrl = process.env.S3_PUBLIC_URL || ""
const localUploadDir = process.env.LOCAL_UPLOAD_DIR || "./uploads"

export async function uploadFile(file: File, folder: string = "reports"): Promise<{ url: string; key: string }> {
  const ext = file.name.split(".").pop() || "bin"
  const key = `${folder}/${randomUUID()}.${ext}`
  const buffer = await file.arrayBuffer()

  if (STORAGE_TYPE === "local") {
    const dir = join(localUploadDir, folder)
    await mkdir(dir, { recursive: true })
    const filePath = join(localUploadDir, key)
    await writeFile(filePath, Buffer.from(buffer))
    const url = `/uploads/${key}`
    return { url, key }
  }

  await s3!.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    })
  )

  const url = publicUrl ? `${publicUrl}/${key}` : `https://${bucket}.supabase.co/storage/v1/object/public/${key}`
  return { url, key }
}

export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_TYPE === "local") {
    const filePath = join(localUploadDir, key)
    await unlink(filePath).catch(() => {})
    return
  }

  await s3!.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
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

