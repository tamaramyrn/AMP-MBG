import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, sql, like, and, or, gte, lte, inArray } from "drizzle-orm"
import { db, schema } from "../db"
import { adminMiddleware } from "../middleware/auth"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const admin = new Hono<{ Variables: Variables }>()

admin.use("*", adminMiddleware)

const userQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  role: z.enum(["admin", "public"]).optional(),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional().transform((val) => val === "true" ? true : val === "false" ? false : undefined),
})

admin.get("/users", zValidator("query", userQuerySchema), async (c) => {
  const { page, limit, role, search, isActive } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (role) conditions.push(eq(schema.users.role, role))
  if (isActive !== undefined) conditions.push(eq(schema.users.isActive, isActive))
  if (search) {
    conditions.push(
      or(like(schema.users.name, `%${search}%`), like(schema.users.email, `%${search}%`), like(schema.users.nik, `%${search}%`))
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.select({
      id: schema.users.id,
      nik: schema.users.nik,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      isVerified: schema.users.isVerified,
      isActive: schema.users.isActive,
      reportCount: schema.users.reportCount,
      verifiedReportCount: schema.users.verifiedReportCount,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
    }).from(schema.users).where(whereClause).limit(limit).offset(offset).orderBy(desc(schema.users.createdAt)),
    db.select({ count: sql<number>`count(*)` }).from(schema.users).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

admin.get("/users/:id", async (c) => {
  const id = c.req.param("id")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
    columns: { password: false },
    with: { reports: { limit: 10, orderBy: [desc(schema.reports.createdAt)] } },
  })

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  return c.json({ data: user })
})

const updateUserSchema = z.object({
  role: z.enum(["admin", "public"]).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

admin.patch("/users/:id", zValidator("json", updateUserSchema), async (c) => {
  const id = c.req.param("id")
  const data = c.req.valid("json")
  const currentUser = c.get("user")

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  // Prevent demoting own role
  if (data.role && currentUser.id === id && data.role !== user.role) {
    return c.json({ error: "Tidak dapat mengubah role sendiri" }, 400)
  }

  const [updated] = await db.update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id, role: schema.users.role, isVerified: schema.users.isVerified, isActive: schema.users.isActive })

  return c.json({ data: updated, message: "User berhasil diperbarui" })
})

admin.delete("/users/:id", async (c) => {
  const id = c.req.param("id")
  const currentUser = c.get("user")

  if (currentUser.id === id) return c.json({ error: "Tidak dapat menghapus akun sendiri" }, 400)

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  await db.delete(schema.users).where(eq(schema.users.id, id))

  return c.json({ message: "User berhasil dihapus" })
})

admin.get("/dashboard", async (c) => {
  // Optimized: Combine counts into single queries
  const [userAggregates, reportAggregates, byStatus, byCategory, recentReports] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      adminCount: sql<number>`count(*) filter (where ${schema.users.role} = 'admin')`,
      publicCount: sql<number>`count(*) filter (where ${schema.users.role} = 'public')`,
    }).from(schema.users),
    db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${schema.reports.status} = 'pending')`,
      uniqueCities: sql<number>`count(distinct ${schema.reports.cityId})`,
    }).from(schema.reports),
    db.select({ status: schema.reports.status, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.status),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.category),
    db.query.reports.findMany({
      columns: { id: true, title: true, category: true, status: true, createdAt: true },
      limit: 5,
      orderBy: [desc(schema.reports.createdAt)],
      with: { province: true, city: true, user: { columns: { name: true } } },
    }),
  ])

  return c.json({
    users: {
      total: Number(userAggregates[0]?.total || 0),
      byRole: [
        { role: "admin", count: Number(userAggregates[0]?.adminCount || 0) },
        { role: "public", count: Number(userAggregates[0]?.publicCount || 0) },
      ],
    },
    reports: {
      total: Number(reportAggregates[0]?.total || 0),
      pending: Number(reportAggregates[0]?.pending || 0),
      uniqueCities: Number(reportAggregates[0]?.uniqueCities || 0),
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      byCategory: byCategory.map((r) => ({ category: r.category, count: Number(r.count) })),
    },
    recentReports: recentReports.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      province: r.province?.name || "",
      city: r.city?.name || "",
      reporter: r.user?.name || "Anonim",
      createdAt: r.createdAt,
    })),
  })
})

// Get report status history
admin.get("/reports/:id/history", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  const history = await db.query.reportStatusHistory.findMany({
    where: eq(schema.reportStatusHistory.reportId, id),
    orderBy: [desc(schema.reportStatusHistory.createdAt)],
    with: { changedByUser: { columns: { name: true, email: true } } },
  })

  return c.json({
    data: history.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes,
      changedBy: h.changedByUser?.name || h.changedByUser?.email || "Unknown",
      createdAt: h.createdAt,
    })),
  })
})

// Get all reports with admin-specific data
const adminReportsQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]).optional(),
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]).optional(),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})

admin.get("/reports", zValidator("query", adminReportsQuerySchema), async (c) => {
  const { page, limit, status, category, provinceId, cityId, startDate, endDate, search } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (status) conditions.push(eq(schema.reports.status, status))
  if (category) conditions.push(eq(schema.reports.category, category))
  if (provinceId) conditions.push(eq(schema.reports.provinceId, provinceId))
  if (cityId) conditions.push(eq(schema.reports.cityId, cityId))
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
      limit,
      offset,
      orderBy: [desc(schema.reports.createdAt)],
      with: {
        user: { columns: { name: true, email: true, phone: true } },
        province: true,
        city: true,
        district: true,
        verifier: { columns: { name: true } },
        files: { columns: { id: true, fileName: true, fileUrl: true } },
      },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.reports).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status,
      provinceId: r.provinceId,
      province: r.province?.name,
      cityId: r.cityId,
      city: r.city?.name,
      districtId: r.districtId,
      district: r.district?.name,
      location: r.location,
      incidentDate: r.incidentDate,
      relation: r.relation,
      relationDetail: r.relationDetail,
      reporter: r.user?.name || "Anonim",
      reporterEmail: r.user?.email,
      reporterPhone: r.user?.phone,
      verifiedBy: r.verifier?.name,
      verifiedAt: r.verifiedAt,
      adminNotes: r.adminNotes,
      files: r.files,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// Get single report detail for admin
admin.get("/reports/:id", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
    with: {
      user: { columns: { id: true, name: true, email: true, phone: true, nik: true } },
      province: true,
      city: true,
      district: true,
      verifier: { columns: { name: true, email: true } },
      files: true,
      statusHistory: {
        orderBy: [desc(schema.reportStatusHistory.createdAt)],
        with: { changedByUser: { columns: { name: true, email: true } } },
      },
    },
  })

  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  return c.json({
    data: {
      ...report,
      province: report.province?.name || "",
      city: report.city?.name || "",
      district: report.district?.name || "",
      reporter: {
        id: report.user?.id,
        name: report.user?.name || "Anonim",
        email: report.user?.email,
        phone: report.user?.phone,
        nik: report.user?.nik,
      },
      verifier: report.verifier ? {
        name: report.verifier.name,
        email: report.verifier.email,
      } : null,
      statusHistory: report.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        notes: h.notes,
        changedBy: h.changedByUser?.name || h.changedByUser?.email || "Unknown",
        createdAt: h.createdAt,
      })),
    },
  })
})

// Update report status
const updateReportStatusSchema = z.object({
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]),
  notes: z.string().max(1000).optional(),
})

admin.patch("/reports/:id/status", zValidator("json", updateReportStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { status, notes } = c.req.valid("json")
  const user = c.get("user")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  const previousStatus = report.status

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) updateData.adminNotes = notes

  if (status === "verified" && previousStatus !== "verified") {
    updateData.verifiedBy = user.id
    updateData.verifiedAt = new Date()
  }

  const [updated] = await db.update(schema.reports)
    .set(updateData)
    .where(eq(schema.reports.id, id))
    .returning()

  // Record status change in parallel (fire and forget)
  db.insert(schema.reportStatusHistory).values({
    reportId: id,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: user.id,
    notes: notes || null,
  }).catch(() => {})

  return c.json({ data: updated, message: "Status laporan berhasil diperbarui" })
})

// Bulk update report status
const bulkUpdateSchema = z.object({
  reportIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]),
  notes: z.string().max(500).optional(),
})

admin.patch("/reports/bulk-status", zValidator("json", bulkUpdateSchema), async (c) => {
  const { reportIds, status, notes } = c.req.valid("json")
  const user = c.get("user")

  // Get current status for history
  const reports = await db.query.reports.findMany({
    where: inArray(schema.reports.id, reportIds),
  })

  if (reports.length === 0) {
    return c.json({ error: "Tidak ada laporan yang ditemukan" }, 404)
  }

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) updateData.adminNotes = notes

  if (status === "verified") {
    updateData.verifiedBy = user.id
    updateData.verifiedAt = new Date()
  }

  // Parallel: Update reports and insert history
  const historyRecords = reports.map((r) => ({
    reportId: r.id,
    fromStatus: r.status,
    toStatus: status,
    changedBy: user.id,
    notes: notes || null,
  }))

  await Promise.all([
    db.update(schema.reports)
      .set(updateData)
      .where(inArray(schema.reports.id, reportIds)),
    db.insert(schema.reportStatusHistory).values(historyRecords),
  ])

  return c.json({
    message: `${reports.length} laporan berhasil diperbarui`,
    updated: reports.length,
  })
})

// Delete report
admin.delete("/reports/:id", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  await db.delete(schema.reports).where(eq(schema.reports.id, id))

  return c.json({ message: "Laporan berhasil dihapus" })
})

// Analytics endpoint
admin.get("/analytics", async (c) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Optimized: Combine counts into single queries
  const [
    reportAggregates,
    userAggregates,
    reportsByMonth,
    topProvinces,
  ] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      last30Days: sql<number>`count(*) filter (where ${schema.reports.createdAt} >= ${thirtyDaysAgo})`,
      last7Days: sql<number>`count(*) filter (where ${schema.reports.createdAt} >= ${sevenDaysAgo})`,
      highRisk: sql<number>`count(*) filter (where ${schema.reports.category} = 'poisoning')`,
    }).from(schema.reports),
    db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${schema.users.isActive} = true)`,
    }).from(schema.users),
    db.select({
      month: sql<string>`to_char(${schema.reports.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
      .from(schema.reports)
      .groupBy(sql`to_char(${schema.reports.createdAt}, 'YYYY-MM')`)
      .orderBy(desc(sql`to_char(${schema.reports.createdAt}, 'YYYY-MM')`))
      .limit(12),
    db.select({
      provinceId: schema.reports.provinceId,
      count: sql<number>`count(*)`,
    })
      .from(schema.reports)
      .groupBy(schema.reports.provinceId)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
  ])

  // Get province names
  const provinceIds = topProvinces.map((p) => p.provinceId).filter(Boolean) as string[]
  const provinces = provinceIds.length > 0
    ? await db.query.provinces.findMany({
        where: inArray(schema.provinces.id, provinceIds),
        columns: { id: true, name: true },
      })
    : []
  const provinceMap = new Map(provinces.map((p) => [p.id, p.name]))

  return c.json({
    overview: {
      totalReports: Number(reportAggregates[0]?.total || 0),
      last30Days: Number(reportAggregates[0]?.last30Days || 0),
      last7Days: Number(reportAggregates[0]?.last7Days || 0),
      totalUsers: Number(userAggregates[0]?.total || 0),
      activeUsers: Number(userAggregates[0]?.active || 0),
      highRiskReports: Number(reportAggregates[0]?.highRisk || 0),
    },
    trends: {
      reportsByMonth: reportsByMonth.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
    },
    topProvinces: topProvinces.map((p) => ({
      provinceId: p.provinceId,
      province: provinceMap.get(p.provinceId || "") || "",
      count: Number(p.count),
    })),
  })
})

// Sessions management
admin.get("/sessions", zValidator("query", z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "20")),
  userId: z.string().uuid().optional(),
})), async (c) => {
  const { page, limit, userId } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (userId) conditions.push(eq(schema.sessions.userId, userId))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.query.sessions.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(schema.sessions.createdAt)],
      with: { user: { columns: { name: true, email: true } } },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.sessions).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user?.name,
      userEmail: s.user?.email,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isRevoked: s.isRevoked,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// Revoke user sessions
admin.post("/sessions/:userId/revoke-all", async (c) => {
  const userId = c.req.param("userId")

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  await db.update(schema.sessions)
    .set({ isRevoked: true })
    .where(eq(schema.sessions.userId, userId))

  return c.json({ message: "Semua sesi user berhasil dicabut" })
})

// MBG Schedule Management
const mbgScheduleQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "20")),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional().transform((val) => val === "true"),
  search: z.string().optional(),
})

admin.get("/mbg-schedules", zValidator("query", mbgScheduleQuerySchema), async (c) => {
  const { page, limit, provinceId, cityId, isActive, search } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (provinceId) conditions.push(eq(schema.mbgSchedules.provinceId, provinceId))
  if (cityId) conditions.push(eq(schema.mbgSchedules.cityId, cityId))
  if (isActive !== undefined) conditions.push(eq(schema.mbgSchedules.isActive, isActive))
  if (search) {
    conditions.push(
      or(
        like(schema.mbgSchedules.schoolName, `%${search}%`),
        like(schema.mbgSchedules.address, `%${search}%`)
      )
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.query.mbgSchedules.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(schema.mbgSchedules.createdAt)],
      with: { province: true, city: true, district: true },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.mbgSchedules).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((s) => ({
      id: s.id,
      schoolName: s.schoolName,
      provinceId: s.provinceId,
      province: s.province?.name,
      cityId: s.cityId,
      city: s.city?.name,
      districtId: s.districtId,
      district: s.district?.name,
      address: s.address,
      scheduleDays: s.scheduleDays,
      startTime: s.startTime,
      endTime: s.endTime,
      isActive: s.isActive,
      createdAt: s.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

const createMbgScheduleSchema = z.object({
  schoolName: z.string().min(3).max(255),
  provinceId: z.string().length(2),
  cityId: z.string().min(4).max(5),
  districtId: z.string().min(7).max(8).optional(),
  address: z.string().max(500).optional(),
  scheduleDays: z.string().regex(/^[1-5]+$/).default("12345"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).default("07:00"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).default("12:00"),
})

admin.post("/mbg-schedules", zValidator("json", createMbgScheduleSchema), async (c) => {
  const data = c.req.valid("json")

  const [schedule] = await db.insert(schema.mbgSchedules).values({
    ...data,
    districtId: data.districtId || null,
  }).returning()

  return c.json({ data: schedule, message: "Jadwal MBG berhasil ditambahkan" }, 201)
})

admin.patch("/mbg-schedules/:id", zValidator("json", createMbgScheduleSchema.partial().extend({
  isActive: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param("id")
  const data = c.req.valid("json")

  const schedule = await db.query.mbgSchedules.findFirst({
    where: eq(schema.mbgSchedules.id, id),
  })

  if (!schedule) return c.json({ error: "Jadwal tidak ditemukan" }, 404)

  const [updated] = await db.update(schema.mbgSchedules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.mbgSchedules.id, id))
    .returning()

  return c.json({ data: updated, message: "Jadwal MBG berhasil diperbarui" })
})

admin.delete("/mbg-schedules/:id", async (c) => {
  const id = c.req.param("id")

  const schedule = await db.query.mbgSchedules.findFirst({
    where: eq(schema.mbgSchedules.id, id),
  })

  if (!schedule) return c.json({ error: "Jadwal tidak ditemukan" }, 404)

  await db.delete(schema.mbgSchedules).where(eq(schema.mbgSchedules.id, id))

  return c.json({ message: "Jadwal MBG berhasil dihapus" })
})

// Export reports data for admin
admin.get("/reports/export", zValidator("query", z.object({
  format: z.enum(["csv", "json"]).default("json"),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})), async (c) => {
  const { format, status, startDate, endDate } = c.req.valid("query")

  const conditions = []
  if (status) conditions.push(eq(schema.reports.status, status))
  if (startDate) conditions.push(gte(schema.reports.createdAt, new Date(startDate)))
  if (endDate) conditions.push(lte(schema.reports.createdAt, new Date(endDate + "T23:59:59")))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const data = await db.query.reports.findMany({
    where: whereClause,
    orderBy: [desc(schema.reports.createdAt)],
    with: { province: true, city: true, district: true, user: { columns: { name: true } } },
  })

  if (format === "csv") {
    const headers = "ID,Judul,Kategori,Status,Provinsi,Kota,Tanggal Kejadian,Skor,Kredibilitas,Dibuat\n"
    const rows = data.map((r) =>
      `"${r.id}","${r.title}","${r.category}","${r.status}","${r.province?.name || ""}","${r.city?.name || ""}","${r.incidentDate.toISOString()}","${r.totalScore}","${r.credibilityLevel}","${r.createdAt.toISOString()}"`
    ).join("\n")

    c.header("Content-Type", "text/csv")
    c.header("Content-Disposition", "attachment; filename=reports.csv")
    return c.body(headers + rows)
  }

  return c.json({ data })
})

// Credibility scoring breakdown
admin.get("/reports/:id/scoring", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
  })

  if (!report) return c.json({ error: "Laporan tidak ditemukan" }, 404)

  return c.json({
    data: {
      scoreRelation: { value: report.scoreRelation, max: 3, label: "Relasi dengan MBG" },
      scoreLocationTime: { value: report.scoreLocationTime, max: 3, label: "Validitas Lokasi & Waktu" },
      scoreEvidence: { value: report.scoreEvidence, max: 3, label: "Bukti Pendukung" },
      scoreNarrative: { value: report.scoreNarrative, max: 3, label: "Konsistensi Narasi" },
      scoreReporterHistory: { value: report.scoreReporterHistory, max: 3, label: "Riwayat Pelapor" },
      scoreSimilarity: { value: report.scoreSimilarity, max: 3, label: "Kesesuaian Laporan Lain" },
      totalScore: report.totalScore,
      credibilityLevel: report.credibilityLevel,
    },
  })
})

export default admin
