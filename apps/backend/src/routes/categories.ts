import { Hono } from "hono"

const categories = new Hono()

const CATEGORIES = [
  { value: "poisoning", label: "Keracunan dan Masalah Kesehatan" },
  { value: "kitchen", label: "Operasional Dapur" },
  { value: "quality", label: "Kualitas dan Keamanan Dapur" },
  { value: "policy", label: "Kebijakan dan Anggaran" },
  { value: "implementation", label: "Implementasi Program" },
  { value: "social", label: "Dampak Sosial dan Ekonomi" },
]

const ORGANIZATIONS = [
  { value: "supplier", label: "Supplier/Vendor" },
  { value: "caterer", label: "Katering" },
  { value: "school", label: "Pihak Sekolah" },
  { value: "government", label: "Pemerintah Daerah" },
  { value: "ngo", label: "LSM/NGO" },
  { value: "other", label: "Lainnya" },
]

const RELATIONS = [
  { value: "student_parent", label: "Orang Tua Siswa" },
  { value: "teacher", label: "Guru/Tenaga Pendidik" },
  { value: "school_staff", label: "Staff Sekolah" },
  { value: "caterer", label: "Pihak Katering" },
  { value: "government", label: "Pemerintah/Dinas" },
  { value: "journalist", label: "Wartawan/Media" },
  { value: "ngo", label: "LSM/NGO" },
  { value: "public", label: "Masyarakat Umum" },
  { value: "other", label: "Lainnya" },
]

categories.get("/", async (c) => {
  return c.json({ data: CATEGORIES })
})

categories.get("/organizations", async (c) => {
  return c.json({ data: ORGANIZATIONS })
})

categories.get("/relations", async (c) => {
  return c.json({ data: RELATIONS })
})

export default categories
