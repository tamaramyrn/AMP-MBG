import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, and, like, sql, gte, lte, or } from "drizzle-orm"
import { db, schema } from "../db"
import { authMiddleware, adminMiddleware, reporterMiddleware } from "../middleware/auth"
import { uploadFile, validateFile, deleteFile } from "../lib/storage"
import { calculateReportScore, recalculateEvidenceScore, updateTotalScore } from "../lib/scoring"
import type { AuthUser, AuthAdmin } from "../types"

type UserVariables = { user: AuthUser }
type AdminVariables = { admin: AuthAdmin }

const reports = new Hono()

const createReportSchema = z.object({
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]),
  title: z.string().min(10, "Judul minimal 10 karakter").max(255),
  description: z.string().min(50, "Deskripsi minimal 50 karakter").max(5000),
  location: z.string().min(5, "Lokasi wajib diisi").max(255),
  provinceId: z.string().length(2, "Provinsi wajib dipilih"),
  cityId: z.string().min(4).max(5, "Kota/Kabupaten wajib dipilih"),
  districtId: z.string().min(7).max(8).optional(),
  incidentDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  relation: z.enum(["parent", "teacher", "principal", "supplier", "student", "community", "other"]),
  relationDetail: z.string().max(255).optional(),
})

const querySchema = z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "10")))),
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]).optional(),
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]).optional(),
  credibilityLevel: z.enum(["high", "medium", "low"]).optional(),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["createdAt", "incidentDate", "status", "totalScore"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

reports.get("/", zValidator("query", querySchema), async (c) => {
  const { page, limit, category, status, credibilityLevel, provinceId, cityId, districtId, startDate, endDate, search, sortBy, sortOrder } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []

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

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

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
  const [aggregates, byStatusResult, byCategoryResult, byProvinceResult, provinces] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      uniqueCities: sql<number>`count(distinct ${schema.reports.cityId})`,
      highRisk: sql<number>`count(*) filter (where ${schema.reports.category} = 'poisoning')`,
    }).from(schema.reports),
    db.select({ status: schema.reports.status, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.status),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.category),
    db.select({ provinceId: schema.reports.provinceId, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.provinceId).limit(10),
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

// Summary with counts
reports.get("/summary", async (c) => {
  const [aggregates, topCategoryResult, userCount, adminCount, memberStats] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      uniqueCities: sql<number>`count(distinct ${schema.reports.cityId})`,
      highRisk: sql<number>`count(*) filter (where ${schema.reports.credibilityLevel} = 'high')`,
      mediumRisk: sql<number>`count(*) filter (where ${schema.reports.credibilityLevel} = 'medium')`,
      lowRisk: sql<number>`count(*) filter (where ${schema.reports.credibilityLevel} = 'low')`,
    }).from(schema.reports),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` })
      .from(schema.reports)
      .groupBy(schema.reports.category)
      .orderBy(desc(sql`count(*)`))
      .limit(1),
    db.select({ count: sql<number>`count(*)` }).from(schema.publics),
    db.select({ count: sql<number>`count(*)` }).from(schema.admins),
    db.select({
      total: sql<number>`count(*)`,
      foundations: sql<number>`count(*) filter (where ${schema.members.memberType} = 'foundation')`,
    }).from(schema.members).where(eq(schema.members.isVerified, true)),
  ])

  return c.json({
    total: Number(aggregates[0]?.total || 0),
    uniqueCities: Number(aggregates[0]?.uniqueCities || 0),
    highRisk: Number(aggregates[0]?.highRisk || 0),
    mediumRisk: Number(aggregates[0]?.mediumRisk || 0),
    lowRisk: Number(aggregates[0]?.lowRisk || 0),
    topCategory: topCategoryResult[0] ? {
      category: topCategoryResult[0].category,
      count: Number(topCategoryResult[0].count),
    } : null,
    totalCommunityUsers: Number(userCount[0]?.count || 0),
    totalAmpMbgUsers: Number(adminCount[0]?.count || 0) + Number(memberStats[0]?.total || 0),
    totalFoundations: Number(memberStats[0]?.foundations || 0),
  })
})

// Foundation list endpoint
reports.get("/foundations", async (c) => {
  const foundations = await db.query.members.findMany({
    where: and(
      eq(schema.members.memberType, "foundation"),
      eq(schema.members.isVerified, true)
    ),
    columns: {
      id: true,
      organizationName: true,
    },
    orderBy: (members, { asc }) => [asc(members.organizationName)],
  })

  return c.json({
    data: foundations.map((f) => ({
      id: f.id,
      name: f.organizationName || "Unnamed Foundation",
    })),
    total: foundations.length,
  })
})

reports.get("/recent", async (c) => {
  const data = await db.query.reports.findMany({
    columns: {
      id: true, category: true, title: true, location: true,
      incidentDate: true, status: true, relation: true, createdAt: true,
    },
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
      relation: r.relation,
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

  if (!report) return c.json({ error: "Report not found" }, 404)

  return c.json({
    data: {
      ...report,
      province: report.province?.name || "",
      city: report.city?.name || "",
      district: report.district?.name || "",
    },
  })
})

// Auth-only report submission
const userReports = new Hono<{ Variables: UserVariables }>()

userReports.post("/", reporterMiddleware, zValidator("json", createReportSchema), async (c) => {
  const data = c.req.valid("json")
  const user = c.get("user")
  const incidentDateObj = new Date(data.incidentDate)

  // Create with zero scores
  const [report] = await db.insert(schema.reports).values({
    category: data.category,
    title: data.title,
    description: data.description,
    location: data.location,
    provinceId: data.provinceId,
    cityId: data.cityId,
    districtId: data.districtId || null,
    incidentDate: incidentDateObj,
    relation: data.relation,
    relationDetail: data.relationDetail || null,
    publicId: user.id,
    scoreRelation: 0,
    scoreLocationTime: 0,
    scoreEvidence: 0,
    scoreNarrative: 0,
    scoreReporterHistory: 0,
    scoreSimilarity: 0,
    totalScore: 0,
    credibilityLevel: "low",
  }).returning()

  await db.update(schema.publics)
    .set({
      reportCount: sql`${schema.publics.reportCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(schema.publics.id, user.id))

  // Background scoring (fire-and-forget)
  const reportId = report.id
  const scoringData = { ...data, incidentDateObj }
  const userId = user.id

  Promise.resolve().then(async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [reporter, reportsStats, mbgSchedule] = await Promise.all([
        db.query.publics.findFirst({
          where: eq(schema.publics.id, userId),
          columns: { reportCount: true, verifiedReportCount: true },
        }),
        db.select({
          similarCount: sql<number>`count(*) filter (where ${schema.reports.createdAt} >= ${thirtyDaysAgo}::timestamp)`,
          totalCount: sql<number>`count(*)`,
        }).from(schema.reports).where(and(
          eq(schema.reports.cityId, scoringData.cityId),
          eq(schema.reports.category, scoringData.category)
        )),
        db.query.mbgSchedules.findFirst({
          where: and(
            eq(schema.mbgSchedules.cityId, scoringData.cityId),
            eq(schema.mbgSchedules.isActive, true),
            scoringData.districtId ? eq(schema.mbgSchedules.districtId, scoringData.districtId) : undefined
          ),
        }),
      ])

      let mbgScheduleMatch = undefined
      if (mbgSchedule) {
        const incidentDay = scoringData.incidentDateObj.getDay().toString()
        const dayMatches = mbgSchedule.scheduleDays.includes(incidentDay)
        const incidentHour = scoringData.incidentDateObj.getHours()
        const incidentMinute = scoringData.incidentDateObj.getMinutes()
        const incidentTimeStr = `${incidentHour.toString().padStart(2, "0")}:${incidentMinute.toString().padStart(2, "0")}`
        const timeMatches = incidentTimeStr >= mbgSchedule.startTime && incidentTimeStr <= mbgSchedule.endTime
        mbgScheduleMatch = { exists: true, dayMatches, timeMatches }
      } else {
        const anySchedule = await db.query.mbgSchedules.findFirst({
          where: eq(schema.mbgSchedules.cityId, scoringData.cityId),
        })
        if (anySchedule) {
          mbgScheduleMatch = { exists: true, dayMatches: false, timeMatches: false }
        }
      }

      const scoringResult = calculateReportScore({
        relation: scoringData.relation,
        relationDetail: scoringData.relationDetail,
        description: scoringData.description,
        filesCount: 0,
        incidentDate: scoringData.incidentDateObj,
        provinceId: scoringData.provinceId,
        cityId: scoringData.cityId,
        districtId: scoringData.districtId,
        reporterReportCount: reporter?.reportCount || 0,
        reporterVerifiedCount: reporter?.verifiedReportCount || 0,
        similarReportsCount: Number(reportsStats[0]?.similarCount || 0),
        locationHasHistory: Number(reportsStats[0]?.totalCount || 0) > 0,
        mbgScheduleMatch,
      })

      await db.update(schema.reports)
        .set({ ...scoringResult, updatedAt: new Date() })
        .where(eq(schema.reports.id, reportId))
    } catch (err) {
      console.error("[Scoring] Background scoring failed:", reportId, err)
    }
  })

  return c.json({
    data: report,
    message: "Report submitted successfully",
  }, 201)
})

// Mount user routes
reports.route("/", userReports)

// Authenticated user routes
const authUserReports = new Hono<{ Variables: UserVariables }>()

authUserReports.get("/my/reports", authMiddleware, zValidator("query", z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "10")))),
})), async (c) => {
  const user = c.get("user")
  const { page, limit } = c.req.valid("query")
  const offset = (page - 1) * limit

  const [data, countResult] = await Promise.all([
    db.query.reports.findMany({
      where: eq(schema.reports.publicId, user.id),
      limit,
      offset,
      orderBy: [desc(schema.reports.createdAt)],
      with: { province: true, city: true },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.reports).where(eq(schema.reports.publicId, user.id)),
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

// Owner file upload
authUserReports.post("/:id/files", authMiddleware, async (c) => {
  const id = c.req.param("id")
  const user = c.get("user")
  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
    with: { files: true },
  })

  if (!report) return c.json({ error: "Report not found" }, 404)

  // Owner-only upload
  if (report.publicId !== user.id) {
    return c.json({ error: "Access denied" }, 403)
  }

  const formData = await c.req.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) return c.json({ error: "File upload required" }, 400)
  if (files.length > 5) return c.json({ error: "Maximum 5 files" }, 400)

  const uploadedFiles = []

  for (const file of files) {
    const validation = await validateFile(file)
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

  // Recalculate evidence score
  const newFileCount = (report.files?.length || 0) + uploadedFiles.length
  const newEvidenceScore = recalculateEvidenceScore(report.description, newFileCount)

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

  return c.json({ data: uploadedFiles, message: "Files uploaded successfully" }, 201)
})

authUserReports.delete("/:id/files/:fileId", authMiddleware, async (c) => {
  const { id, fileId } = c.req.param()
  const user = c.get("user")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Report not found" }, 404)

  // Owner-only delete
  if (report.publicId !== user.id) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const file = await db.query.reportFiles.findFirst({
    where: and(eq(schema.reportFiles.id, fileId), eq(schema.reportFiles.reportId, id)),
  })
  if (!file) return c.json({ error: "File not found" }, 404)

  const keyMatch = file.fileUrl.match(/reports\/[a-f0-9-]+\.[a-z]+$/i)
  if (!keyMatch) return c.json({ error: "Invalid file reference" }, 400)
  await deleteFile(keyMatch[0])
  await db.delete(schema.reportFiles).where(eq(schema.reportFiles.id, fileId))

  return c.json({ message: "File deleted successfully" })
})

reports.route("/", authUserReports)

// Admin-only routes
const adminReports = new Hono<{ Variables: AdminVariables }>()

const updateStatusSchema = z.object({
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]),
  notes: z.string().optional(),
})

// Admin status update
adminReports.patch("/:id/status", adminMiddleware, zValidator("json", updateStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { status, notes } = c.req.valid("json")
  const admin = c.get("admin")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Report not found" }, 404)

  const previousStatus = report.status

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) updateData.adminNotes = notes

  if (previousStatus === "pending" && status !== "pending") {
    updateData.verifiedBy = admin.id
    updateData.verifiedAt = new Date()
  }

  const [updated] = await db.update(schema.reports)
    .set(updateData)
    .where(eq(schema.reports.id, id))
    .returning()

  // Update verifiedReportCount
  if (report.publicId) {
    if (status === "resolved" && previousStatus !== "resolved") {
      await db.update(schema.publics)
        .set({ verifiedReportCount: sql`${schema.publics.verifiedReportCount} + 1` })
        .where(eq(schema.publics.id, report.publicId))
    } else if (previousStatus === "resolved" && status !== "resolved") {
      await db.update(schema.publics)
        .set({ verifiedReportCount: sql`GREATEST(${schema.publics.verifiedReportCount} - 1, 0)` })
        .where(eq(schema.publics.id, report.publicId))
    }
  }

  await db.insert(schema.reportStatusHistory).values({
    reportId: id,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: admin.id,
    notes: notes || null,
  })

  return c.json({ data: updated, message: "Report status updated successfully" })
})

adminReports.delete("/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Report not found" }, 404)

  await db.delete(schema.reports).where(eq(schema.reports.id, id))

  return c.json({ message: "Report deleted successfully" })
})

reports.route("/", adminReports)

export default reports
