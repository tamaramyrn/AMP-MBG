import { Hono } from "hono"

const categories = new Hono()

// Report categories
const CATEGORIES = [
  { value: "poisoning", label: "Keracunan dan Masalah Kesehatan" },
  { value: "kitchen", label: "Operasional Dapur" },
  { value: "quality", label: "Kualitas dan Keamanan Dapur" },
  { value: "policy", label: "Kebijakan dan Anggaran" },
  { value: "implementation", label: "Implementasi Program" },
  { value: "social", label: "Dampak Sosial dan Ekonomi" },
]

// Reporter relations to MBG program
const RELATIONS = [
  { value: "parent", label: "Orang Tua/Wali Murid" },
  { value: "teacher", label: "Guru/Tenaga Pendidik" },
  { value: "principal", label: "Kepala Sekolah" },
  { value: "supplier", label: "Penyedia Makanan/Supplier" },
  { value: "student", label: "Siswa" },
  { value: "community", label: "Masyarakat Umum" },
  { value: "other", label: "Lainnya" },
]

// Report status types
const STATUSES = [
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "verified", label: "Terverifikasi" },
  { value: "in_progress", label: "Sedang Ditindaklanjuti" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
]

// Credibility levels
const CREDIBILITY_LEVELS = [
  { value: "high", label: "Tinggi", minScore: 12, description: "Laporan sangat kredibel dan mendesak untuk ditindaklanjuti" },
  { value: "medium", label: "Sedang", minScore: 7, description: "Laporan memiliki kredibilitas cukup, butuh verifikasi tambahan" },
  { value: "low", label: "Rendah", minScore: 0, description: "Laporan lemah, informasi kurang lengkap" },
]

// User roles
const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "public", label: "Pengguna Publik" },
]

categories.get("/", async (c) => {
  return c.json({ data: CATEGORIES })
})

categories.get("/relations", async (c) => {
  return c.json({ data: RELATIONS })
})

categories.get("/statuses", async (c) => {
  return c.json({ data: STATUSES })
})

categories.get("/credibility-levels", async (c) => {
  return c.json({ data: CREDIBILITY_LEVELS })
})

categories.get("/roles", async (c) => {
  return c.json({ data: ROLES })
})

export default categories
