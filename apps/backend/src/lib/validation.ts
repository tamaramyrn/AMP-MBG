import { z } from "zod"

// NIK: Strictly 16 digits
export const nikSchema = z.string()
  .length(16, "NIK harus tepat 16 digit")
  .regex(/^\d{16}$/, "NIK harus berupa 16 angka")

// Phone: 9-12 digits (will be prefixed with +62)
export const phoneInputSchema = z.string()
  .min(9, "Nomor telepon minimal 9 digit")
  .max(12, "Nomor telepon maksimal 12 digit")
  .regex(/^\d{9,12}$/, "Nomor telepon harus 9-12 angka")
  .transform((val) => `+62${val}`)

// Phone stored format (+62 + 9-12 digits)
export const phoneSchema = z.string()
  .min(12, "Nomor telepon tidak valid")
  .max(15, "Nomor telepon tidak valid")
  .regex(/^\+62\d{9,12}$/, "Format nomor telepon tidak valid")

// Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
export const passwordSchema = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password harus mengandung minimal 1 simbol")

// Email: must contain @ and .
export const emailSchema = z.string()
  .email("Email tidak valid")
  .regex(/@.*\./, "Email harus mengandung @ dan .")
  .toLowerCase()

export const uuidSchema = z.string().uuid("ID tidak valid")

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "10")))),
})

// Date validation
export const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Tanggal tidak valid",
})

export const pastDateSchema = z.string().refine((val) => {
  const date = new Date(val)
  return !isNaN(date.getTime()) && date <= new Date()
}, {
  message: "Tanggal tidak boleh di masa depan",
})

// Province ID
export const provinceIdSchema = z.string().length(2, "ID provinsi tidak valid")

// City ID
export const cityIdSchema = z.string().min(4).max(5, "ID kota tidak valid")

// District ID
export const districtIdSchema = z.string().min(7).max(8, "ID kecamatan tidak valid")

// Report category
export const reportCategorySchema = z.enum([
  "poisoning", "kitchen", "quality", "policy", "implementation", "social"
])

// Report status
export const reportStatusSchema = z.enum([
  "pending", "verified", "in_progress", "resolved", "rejected"
])

// User role (admin or public)
export const userRoleSchema = z.enum(["admin", "public"])

// Credibility level
export const credibilityLevelSchema = z.enum(["high", "medium", "low"])

// Reporter relation
export const relationSchema = z.enum([
  "parent", "teacher", "principal", "supplier", "student", "community", "other"
])

// Title validation
export const reportTitleSchema = z.string()
  .min(10, "Judul minimal 10 karakter")
  .max(255, "Judul maksimal 255 karakter")

// Description validation
export const reportDescriptionSchema = z.string()
  .min(50, "Deskripsi minimal 50 karakter")
  .max(5000, "Deskripsi maksimal 5000 karakter")

// Location text validation
export const locationTextSchema = z.string()
  .min(5, "Lokasi minimal 5 karakter")
  .max(255, "Lokasi maksimal 255 karakter")

// Sanitize string (basic XSS prevention)
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim()
}

// Validate file extension
export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split(".").pop()?.toLowerCase()
  return ext ? allowedExtensions.includes(ext) : false
}

// Validate Indonesian NIK checksum (basic validation)
export function isValidNIK(nik: string): boolean {
  if (!/^\d{16}$/.test(nik)) return false

  const provinceCode = nik.substring(0, 2)
  const validProvinceCodes = [
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21",
    "31", "32", "33", "34", "35", "36", "51", "52", "53", "61",
    "62", "63", "64", "65", "71", "72", "73", "74", "75", "76",
    "81", "82", "91", "92", "94", "95", "96", "97"
  ]

  return validProvinceCodes.includes(provinceCode)
}

// Format phone number with +62 prefix
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    return `+62${cleaned.substring(1)}`
  }
  if (cleaned.startsWith("62")) {
    return `+${cleaned}`
  }
  return `+62${cleaned}`
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "")
  return cleaned.length >= 9 && cleaned.length <= 15
}
