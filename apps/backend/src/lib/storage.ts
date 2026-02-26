import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { mkdir, writeFile, unlink } from "fs/promises"
import { join } from "path"

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local"

// S3-compatible storage client
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

// Known file signatures
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46, -1, -1, -1, -1, 0x57, 0x45, 0x42, 0x50]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
}

// Validate file signature
async function validateMagicBytes(file: File): Promise<boolean> {
  const signatures = MAGIC_BYTES[file.type]
  if (!signatures) return false
  const slice = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(slice)
  return signatures.some((sig) =>
    sig.every((byte, i) => byte === -1 || bytes[i] === byte)
  )
}

export async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10MB limit" }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File type not allowed" }
  }
  if (!(await validateMagicBytes(file))) {
    return { valid: false, error: "File content mismatch" }
  }
  return { valid: true }
}

