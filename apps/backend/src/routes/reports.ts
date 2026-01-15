import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, and, like, sql, gte, lte, or } from "drizzle-orm"
import { db, schema } from "../db"
import { authMiddleware, adminMiddleware, reporterMiddleware } from "../middleware/auth"
import { uploadFile, validateFile, deleteFile } from "../lib/storage"
import { calculateReportScore, recalculateEvidenceScore, updateTotalScore } from "../lib/scoring"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const reports = new Hono<{ Variables: Variables }>()

// Reusable verified status condition
const getVerifiedCondition = () => or(
  eq(schema.reports.status, "verified"),
  eq(schema.reports.status, "in_progress"),
  eq(schema.reports.status, "resolved")
)

const createReportSchema = z.object({
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]),
  title: z.string().min(10, "Judul minimal 10 karakter").max(255),
  description: z.string().min(50, "Deskripsi minimal 50 karakter"),
  location: z.string().min(5, "Lokasi wajib diisi").max(255),
  provinceId: z.string().length(2, "Provinsi wajib dipilih"),
  cityId: z.string().min(4).max(5, "Kota/Kabupaten wajib dipilih"),
  districtId: z.string().min(7).max(8).optional(),
  incidentDate: z.string().transform((val) => new Date(val)),
  relation: z.enum(["parent", "teacher", "principal", "supplier", "student", "community", "other"]),
  relationDetail: z.string().max(255).optional(),
})

const querySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]).optional(),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]).optional(),
  credibilityLevel: z.enum(["high", "medium", "low"]).optional(),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "incidentDate", "status", "totalScore"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

reports.get("/", zValidator("query", querySchema), async (c) => {
  const { page, limit, category, status, credibilityLevel, provinceId, cityId, districtId, startDate, endDate, search, sortBy, sortOrder } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = [getVerifiedCondition()]

  if (category) conditions.push(eq(schema.reports.category, category))
  if (status) conditions.push(eq(schema.reports.status, status))
  if (credibilityLevel) conditions.push(eq(schema.reports.credibilityLevel, credibilityLevel))
  if (provinceId) conditions.push(eq(schema.reports.provinceId, provinceId))
  if (cityId) conditions.push(eq(schema.reports.cityId, cityId))
  if (districtId) conditions.push(eq(schema.reports.districtId, districtId))
  if (startDate) conditions.push(gte(schema.reports.incidentDate, new Date(startDate)))
  if (endDate) conditions.push(lte(schema.reports.incidentDate, new Date(endDate + "T23:59:59")))
  if (search) {
    conditions.push(
      or(
        like(schema.reports.title, `%${search}%`),
        like(schema.reports.description, `%${search}%`),
        like(schema.reports.location, `%${search}%`)
      )
    )
  }

  const whereClause = and(...conditions)

  // Optimized: Single query with subquery for count
  const [data, countResult] = await Promise.all([
    db.query.reports.findMany({
      where: whereClause,
      columns: {
        id: true, category: true, title: true, description: true, location: true,
        provinceId: true, cityId: true, districtId: true, incidentDate: true,
        status: true, relation: true, totalScore: true, credibilityLevel: true,
        createdAt: true, updatedAt: true,
      },
      limit,
      offset,
      orderBy: sortBy === "incidentDate"
        ? (sortOrder === "asc" ? (r, { asc }) => [asc(r.incidentDate)] : [desc(schema.reports.incidentDate)])
        : sortBy === "status"
        ? (sortOrder === "asc" ? (r, { asc }) => [asc(r.status)] : [desc(schema.reports.status)])
        : sortBy === "totalScore"
        ? (sortOrder === "asc" ? (r, { asc }) => [asc(r.totalScore)] : [desc(schema.reports.totalScore)])
        : (sortOrder === "asc" ? (r, { asc }) => [asc(r.createdAt)] : [desc(schema.reports.createdAt)]),
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
      provinceId: r.provinceId,
      province: r.province?.name || "",
      cityId: r.cityId,
      city: r.city?.name || "",
      districtId: r.districtId,
      district: r.district?.name || "",
      incidentDate: r.incidentDate,
      status: r.status,
      relation: r.relation,
      totalScore: r.totalScore,
      credibilityLevel: r.credibilityLevel,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

reports.get("/stats", async (c) => {
  const verifiedCondition = getVerifiedCondition()

  // Optimized: Combine queries where possible
  const [aggregates, byStatusResult, byCategoryResult, byProvinceResult, provinces] = await Promise.all([
    // Single query for multiple counts
    db.select({
      total: sql<number>`count(*)`,
      uniqueCities: sql<number>`count(distinct ${schema.reports.cityId})`,
      highRisk: sql<number>`count(*) filter (where ${schema.reports.category} = 'poisoning')`,
    }).from(schema.reports).where(verifiedCondition),
    db.select({ status: schema.reports.status, count: sql<number>`count(*)` }).from(schema.reports).where(verifiedCondition).groupBy(schema.reports.status),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` }).from(schema.reports).where(verifiedCondition).groupBy(schema.reports.category),
    db.select({ provinceId: schema.reports.provinceId, count: sql<number>`count(*)` }).from(schema.reports).where(verifiedCondition).groupBy(schema.reports.provinceId).limit(10),
    db.query.provinces.findMany({ columns: { id: true, name: true } }),
  ])

  const provinceMap = new Map(provinces.map((p) => [p.id, p.name]))
  const sortedCategories = byCategoryResult.sort((a, b) => Number(b.count) - Number(a.count))
  const topCategory = sortedCategories[0]

  return c.json({
    total: Number(aggregates[0]?.total || 0),
    uniqueCities: Number(aggregates[0]?.uniqueCities || 0),
    highRisk: Number(aggregates[0]?.highRisk || 0),
    topCategory: topCategory ? { category: topCategory.category, count: Number(topCategory.count) } : null,
    byStatus: byStatusResult.map((r) => ({ status: r.status, count: Number(r.count) })),
    byCategory: byCategoryResult.map((r) => ({ category: r.category, count: Number(r.count) })),
    byProvince: byProvinceResult.map((r) => ({
      provinceId: r.provinceId,
      province: provinceMap.get(r.provinceId || "") || "",
      count: Number(r.count),
    })),
  })
})

// Alias for summary endpoint
reports.get("/summary", async (c) => {
  const verifiedCondition = getVerifiedCondition()

  // Optimized: Single query for all aggregates
  const [aggregates, topCategoryResult] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      uniqueCities: sql<number>`count(distinct ${schema.reports.cityId})`,
      highRisk: sql<number>`count(*) filter (where ${schema.reports.category} = 'poisoning')`,
    }).from(schema.reports).where(verifiedCondition),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` })
      .from(schema.reports)
      .where(verifiedCondition)
      .groupBy(schema.reports.category)
      .orderBy(desc(sql`count(*)`))
      .limit(1),
  ])

  return c.json({
    total: Number(aggregates[0]?.total || 0),
    uniqueCities: Number(aggregates[0]?.uniqueCities || 0),
    highRisk: Number(aggregates[0]?.highRisk || 0),
    topCategory: topCategoryResult[0] ? {
      category: topCategoryResult[0].category,
      count: Number(topCategoryResult[0].count),
    } : null,
  })
})

reports.get("/recent", async (c) => {
  const data = await db.query.reports.findMany({
    columns: {
      id: true, category: true, title: true, location: true,
      incidentDate: true, status: true, createdAt: true,
    },
    limit: 6,
    orderBy: [desc(schema.reports.createdAt)],
    with: { province: true, city: true },
    where: getVerifiedCondition(),
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

// Only logged-in public users can submit reports
reports.post("/", reporterMiddleware, zValidator("json", createReportSchema), async (c) => {
  const data = c.req.valid("json")
  const user = c.get("user")

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Optimized: Combine related queries
  const [reporter, reportsStats, mbgSchedule] = await Promise.all([
    db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
      columns: { reportCount: true, verifiedReportCount: true },
    }),
    // Combined query for similar reports and location history
    db.select({
      similarCount: sql<number>`count(*) filter (where ${schema.reports.createdAt} >= ${thirtyDaysAgo})`,
      totalCount: sql<number>`count(*)`,
    }).from(schema.reports).where(eq(schema.reports.cityId, data.cityId)),
    db.query.mbgSchedules.findFirst({
      where: and(
        eq(schema.mbgSchedules.cityId, data.cityId),
        eq(schema.mbgSchedules.isActive, true),
        data.districtId ? eq(schema.mbgSchedules.districtId, data.districtId) : undefined
      ),
    }),
  ])

  // Calculate MBG schedule match
  let mbgScheduleMatch = undefined
  if (mbgSchedule) {
    const incidentDay = data.incidentDate.getDay().toString()
    const dayMatches = mbgSchedule.scheduleDays.includes(incidentDay)

    const incidentHour = data.incidentDate.getHours()
    const incidentMinute = data.incidentDate.getMinutes()
    const incidentTimeStr = `${incidentHour.toString().padStart(2, "0")}:${incidentMinute.toString().padStart(2, "0")}`

    const timeMatches = incidentTimeStr >= mbgSchedule.startTime && incidentTimeStr <= mbgSchedule.endTime

    mbgScheduleMatch = { exists: true, dayMatches, timeMatches }
  } else {
    // Check if ANY MBG schedule exists in the city
    const anySchedule = await db.query.mbgSchedules.findFirst({
      where: eq(schema.mbgSchedules.cityId, data.cityId),
    })
    if (anySchedule) {
      mbgScheduleMatch = { exists: true, dayMatches: false, timeMatches: false }
    }
  }

  // Calculate scores
  const scoringResult = calculateReportScore({
    relation: data.relation,
    relationDetail: data.relationDetail,
    description: data.description,
    filesCount: 0,
    incidentDate: data.incidentDate,
    provinceId: data.provinceId,
    cityId: data.cityId,
    districtId: data.districtId,
    reporterReportCount: reporter?.reportCount || 0,
    reporterVerifiedCount: reporter?.verifiedReportCount || 0,
    similarReportsCount: Number(reportsStats[0]?.similarCount || 0),
    locationHasHistory: Number(reportsStats[0]?.totalCount || 0) > 0,
    mbgScheduleMatch,
  })

  // Insert report with scores
  const [report] = await db.insert(schema.reports).values({
    ...data,
    userId: user.id,
    districtId: data.districtId || null,
    relationDetail: data.relationDetail || null,
    ...scoringResult,
  }).returning()

  // Update reporter's report count
  await db.update(schema.users)
    .set({
      reportCount: sql`${schema.users.reportCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))

  return c.json({
    data: {
      ...report,
      scoring: scoringResult,
    },
    message: "Laporan berhasil dikirim",
  }, 201)
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

// Only report owner can upload files
reports.post("/:id/files", authMiddleware, async (c) => {
  const id = c.req.param("id")
  const user = c.get("user")
  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
    with: { files: true },
  })

  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  // Only owner or admin can upload files
  if (report.userId !== user.id && user.role !== "admin") {
    return c.json({ error: "Akses ditolak" }, 403)
  }

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

  // Recalculate evidence score based on new file count
  const newFileCount = (report.files?.length || 0) + uploadedFiles.length
  const newEvidenceScore = recalculateEvidenceScore(report.description, newFileCount)

  // Update score if changed
  if (newEvidenceScore !== report.scoreEvidence) {
    const updatedScores = updateTotalScore({
      scoreRelation: report.scoreRelation,
      scoreLocationTime: report.scoreLocationTime,
      scoreEvidence: newEvidenceScore,
      scoreNarrative: report.scoreNarrative,
      scoreReporterHistory: report.scoreReporterHistory,
      scoreSimilarity: report.scoreSimilarity,
    })

    await db.update(schema.reports)
      .set({
        scoreEvidence: newEvidenceScore,
        ...updatedScores,
        updatedAt: new Date(),
      })
      .where(eq(schema.reports.id, id))
  }

  return c.json({ data: uploadedFiles, message: "File berhasil diunggah" }, 201)
})

reports.delete("/:id/files/:fileId", authMiddleware, async (c) => {
  const { id, fileId } = c.req.param()
  const user = c.get("user")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  // Only owner or admin can delete files
  if (report.userId !== user.id && user.role !== "admin") {
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

// Admin only - update report status with history tracking
reports.patch("/:id/status", adminMiddleware, zValidator("json", updateStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { status, notes } = c.req.valid("json")
  const user = c.get("user")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  const previousStatus = report.status

  // Update report status
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) updateData.adminNotes = notes

  // Set verifier if status is verified
  if (status === "verified" && previousStatus !== "verified") {
    updateData.verifiedBy = user.id
    updateData.verifiedAt = new Date()
  }

  const [updated] = await db.update(schema.reports)
    .set(updateData)
    .where(eq(schema.reports.id, id))
    .returning()

  // Record status change in history
  await db.insert(schema.reportStatusHistory).values({
    reportId: id,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: user.id,
    notes: notes || null,
  })

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
