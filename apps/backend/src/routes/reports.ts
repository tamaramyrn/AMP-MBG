import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, and, like, sql, gte, lte } from "drizzle-orm"
import { db, schema } from "../db"
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from "../middleware/auth"
import { uploadFile, validateFile, deleteFile } from "../lib/storage"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const reports = new Hono<{ Variables: Variables }>()

const createReportSchema = z.object({
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]),
  title: z.string().min(10, "Judul minimal 10 karakter").max(255),
  description: z.string().min(50, "Deskripsi minimal 50 karakter"),
  location: z.string().min(5, "Lokasi wajib diisi"),
  provinceId: z.string().length(2, "Provinsi wajib dipilih"),
  cityId: z.string().length(5, "Kota/Kabupaten wajib dipilih"),
  districtId: z.string().length(8).optional(),
  incidentDate: z.string().transform((val) => new Date(val)),
  relation: z.string().optional(),
  relationDetail: z.string().optional(),
  reporterName: z.string().optional(),
  reporterPhone: z.string().optional(),
  reporterEmail: z.string().email().optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
})

const querySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]).optional(),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]).optional(),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})

reports.get("/", zValidator("query", querySchema), async (c) => {
  const { page, limit, category, status, provinceId, cityId, startDate, endDate, search } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []

  if (category) conditions.push(eq(schema.reports.category, category))
  if (status) conditions.push(eq(schema.reports.status, status))
  if (provinceId) conditions.push(eq(schema.reports.provinceId, provinceId))
  if (cityId) conditions.push(eq(schema.reports.cityId, cityId))
  if (startDate) conditions.push(gte(schema.reports.incidentDate, new Date(startDate)))
  if (endDate) conditions.push(lte(schema.reports.incidentDate, new Date(endDate + "T23:59:59")))
  if (search) conditions.push(like(schema.reports.title, `%${search}%`))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.query.reports.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(schema.reports.createdAt)],
      with: { province: true, city: true, district: true },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.reports).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      location: r.location,
      province: r.province?.name || "",
      city: r.city?.name || "",
      district: r.district?.name || "",
      incidentDate: r.incidentDate,
      status: r.status,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

reports.get("/stats", async (c) => {
  const [totalResult, byStatusResult, byCategoryResult, byProvinceResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.reports),
    db.select({ status: schema.reports.status, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.status),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.category),
    db.select({ provinceId: schema.reports.provinceId, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.provinceId).limit(10),
  ])

  return c.json({
    total: Number(totalResult[0]?.count || 0),
    byStatus: byStatusResult.map((r) => ({ status: r.status, count: Number(r.count) })),
    byCategory: byCategoryResult.map((r) => ({ category: r.category, count: Number(r.count) })),
    byProvince: byProvinceResult.map((r) => ({ provinceId: r.provinceId, count: Number(r.count) })),
  })
})

reports.get("/recent", async (c) => {
  const data = await db.query.reports.findMany({
    limit: 6,
    orderBy: [desc(schema.reports.createdAt)],
    with: { province: true, city: true },
  })

  return c.json({
    data: data.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      location: r.location,
      province: r.province?.name || "",
      city: r.city?.name || "",
      incidentDate: r.incidentDate,
      status: r.status,
      createdAt: r.createdAt,
    })),
  })
})

reports.get("/:id", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
    with: { province: true, city: true, district: true, files: true },
  })

  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  return c.json({
    data: {
      ...report,
      province: report.province?.name || "",
      city: report.city?.name || "",
      district: report.district?.name || "",
    },
  })
})

reports.post("/", optionalAuthMiddleware, zValidator("json", createReportSchema), async (c) => {
  const data = c.req.valid("json")
  const user = c.get("user")

  const [report] = await db.insert(schema.reports).values({
    ...data,
    userId: user?.id || null,
    reporterEmail: data.reporterEmail || null,
    districtId: data.districtId || null,
  }).returning()

  return c.json({ data: report, message: "Laporan berhasil dikirim" }, 201)
})

reports.get("/my/reports", authMiddleware, zValidator("query", z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
})), async (c) => {
  const user = c.get("user")
  const { page, limit } = c.req.valid("query")
  const offset = (page - 1) * limit

  const [data, countResult] = await Promise.all([
    db.query.reports.findMany({
      where: eq(schema.reports.userId, user.id),
      limit,
      offset,
      orderBy: [desc(schema.reports.createdAt)],
      with: { province: true, city: true },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.reports).where(eq(schema.reports.userId, user.id)),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      location: r.location,
      province: r.province?.name || "",
      city: r.city?.name || "",
      incidentDate: r.incidentDate,
      status: r.status,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

reports.post("/:id/files", optionalAuthMiddleware, async (c) => {
  const id = c.req.param("id")
  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })

  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  const formData = await c.req.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) return c.json({ error: "File wajib diunggah" }, 400)
  if (files.length > 5) return c.json({ error: "Maksimal 5 file" }, 400)

  const uploadedFiles = []

  for (const file of files) {
    const validation = validateFile(file)
    if (!validation.valid) return c.json({ error: validation.error }, 400)

    const { url } = await uploadFile(file, `reports/${id}`)
    const [inserted] = await db.insert(schema.reportFiles).values({
      reportId: id,
      fileName: file.name,
      fileUrl: url,
      fileType: file.type,
      fileSize: String(file.size),
    }).returning()

    uploadedFiles.push(inserted)
  }

  return c.json({ data: uploadedFiles, message: "File berhasil diunggah" }, 201)
})

reports.delete("/:id/files/:fileId", authMiddleware, async (c) => {
  const { id, fileId } = c.req.param()
  const user = c.get("user")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  if (report.userId !== user.id && user.role !== "admin" && user.role !== "moderator") {
    return c.json({ error: "Forbidden" }, 403)
  }

  const file = await db.query.reportFiles.findFirst({ where: eq(schema.reportFiles.id, fileId) })
  if (!file) return c.json({ error: "File tidak ditemukan" }, 404)

  const key = file.fileUrl.split("/").slice(-2).join("/")
  await deleteFile(key)
  await db.delete(schema.reportFiles).where(eq(schema.reportFiles.id, fileId))

  return c.json({ message: "File berhasil dihapus" })
})

const updateStatusSchema = z.object({
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]),
  notes: z.string().optional(),
})

reports.patch("/:id/status", adminMiddleware, zValidator("json", updateStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { status } = c.req.valid("json")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  const [updated] = await db.update(schema.reports)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.reports.id, id))
    .returning()

  return c.json({ data: updated, message: "Status laporan berhasil diperbarui" })
})

reports.delete("/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  await db.delete(schema.reports).where(eq(schema.reports.id, id))

  return c.json({ message: "Laporan berhasil dihapus" })
})

export default reports
