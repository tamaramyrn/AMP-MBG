import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, sql, like, and, or, gte, lte, inArray } from "drizzle-orm"
import { db, schema } from "../db"
import { adminMiddleware } from "../middleware/auth"
import { hashPassword } from "../lib/password"
import type { AuthAdmin } from "../types"

type Variables = { admin: AuthAdmin }

const admin = new Hono<{ Variables: Variables }>()

admin.use("*", adminMiddleware)

// Public users management
const userQuerySchema = z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "10")))),
  search: z.string().max(100).optional(),
  signupMethod: z.enum(["manual", "google"]).optional(),
})

admin.get("/users", zValidator("query", userQuerySchema), async (c) => {
  const { page, limit, search, signupMethod } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (signupMethod) conditions.push(eq(schema.publics.signupMethod, signupMethod))
  if (search) {
    conditions.push(
      or(like(schema.publics.name, `%${search}%`), like(schema.publics.email, `%${search}%`))
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.select({
      id: schema.publics.id,
      name: schema.publics.name,
      email: schema.publics.email,
      phone: schema.publics.phone,
      signupMethod: schema.publics.signupMethod,
      googleId: schema.publics.googleId,
      reportCount: schema.publics.reportCount,
      verifiedReportCount: schema.publics.verifiedReportCount,
      lastLoginAt: schema.publics.lastLoginAt,
      createdAt: schema.publics.createdAt,
    }).from(schema.publics).where(whereClause).limit(limit).offset(offset).orderBy(desc(schema.publics.createdAt)),
    db.select({ count: sql<number>`count(*)` }).from(schema.publics).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((u) => ({ ...u, isGoogleLinked: !!u.googleId })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

admin.get("/users/:id", async (c) => {
  const id = c.req.param("id")

  const user = await db.query.publics.findFirst({
    where: eq(schema.publics.id, id),
    columns: { password: false },
    with: {
      reports: { limit: 10, orderBy: [desc(schema.reports.createdAt)] },
      member: true,
    },
  })

  if (!user) return c.json({ error: "User not found" }, 404)

  return c.json({
    data: {
      ...user,
      hasPassword: user.signupMethod === "manual",
      isGoogleLinked: !!user.googleId,
      isMember: !!user.member,
    }
  })
})

admin.delete("/users/:id", async (c) => {
  const id = c.req.param("id")

  const user = await db.query.publics.findFirst({ where: eq(schema.publics.id, id) })
  if (!user) return c.json({ error: "User not found" }, 404)

  await db.delete(schema.publics).where(eq(schema.publics.id, id))

  return c.json({ message: "User deleted successfully" })
})

// Dashboard
admin.get("/dashboard", async (c) => {
  const [adminCount, userCount, memberCount, reportAggregates, byStatus, byCategory, recentReports] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.admins),
    db.select({ count: sql<number>`count(*)` }).from(schema.publics),
    db.select({ count: sql<number>`count(*)` }).from(schema.members),
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
      with: { province: true, city: true, public: { columns: { name: true } } },
    }),
  ])

  return c.json({
    users: {
      total: Number(userCount[0]?.count || 0),
      byRole: [
        { role: "admin", count: Number(adminCount[0]?.count || 0) },
        { role: "member", count: Number(memberCount[0]?.count || 0) },
        { role: "public", count: Number(userCount[0]?.count || 0) },
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
      reporter: r.public?.name || "Anonymous",
      createdAt: r.createdAt,
    })),
  })
})

// Report status history
admin.get("/reports/:id/history", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Report not found" }, 404)

  const history = await db.query.reportStatusHistory.findMany({
    where: eq(schema.reportStatusHistory.reportId, id),
    orderBy: [desc(schema.reportStatusHistory.createdAt)],
    with: { changedByAdmin: { columns: { name: true, email: true } } },
  })

  return c.json({
    data: history.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes,
      changedBy: h.changedByAdmin?.name || h.changedByAdmin?.email || "Unknown",
      createdAt: h.createdAt,
    })),
  })
})

// Reports management
const adminReportsQuerySchema = z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "10")))),
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]).optional(),
  category: z.enum(["poisoning", "kitchen", "quality", "policy", "implementation", "social"]).optional(),
  credibilityLevel: z.enum(["high", "medium", "low"]).optional(),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().max(100).optional(),
})

admin.get("/reports", zValidator("query", adminReportsQuerySchema), async (c) => {
  const { page, limit, status, category, credibilityLevel, provinceId, cityId, districtId, startDate, endDate, search } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (status) conditions.push(eq(schema.reports.status, status))
  if (category) conditions.push(eq(schema.reports.category, category))
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
      limit,
      offset,
      orderBy: [desc(schema.reports.createdAt)],
      with: {
        public: { columns: { name: true, email: true, phone: true } },
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
      credibilityLevel: r.credibilityLevel,
      totalScore: r.totalScore,
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
      reporter: r.public?.name || "Anonymous",
      reporterEmail: r.public?.email,
      reporterPhone: r.public?.phone,
      verifiedBy: r.verifier?.name,
      verifiedAt: r.verifiedAt,
      adminNotes: r.adminNotes,
      files: r.files,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// Export reports
admin.get("/reports/export", zValidator("query", z.object({
  format: z.enum(["csv", "json"]).default("json"),
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]).optional(),
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
    limit: 10000,
    orderBy: [desc(schema.reports.createdAt)],
    with: { province: true, city: true, district: true, public: { columns: { name: true } } },
  })

  if (format === "csv") {
    const csvSafe = (s: string) => s.replace(/^[=+\-@\t\r]/g, "'$&").replace(/"/g, '""')
    const headers = "ID,Title,Category,Status,Province,City,Incident Date,Score,Credibility,Created\n"
    const rows = data.map((r) =>
      `"${r.id}","${csvSafe(r.title)}","${r.category}","${r.status}","${csvSafe(r.province?.name || "")}","${csvSafe(r.city?.name || "")}","${r.incidentDate.toISOString()}","${r.totalScore}","${r.credibilityLevel}","${r.createdAt.toISOString()}"`
    ).join("\n")

    c.header("Content-Type", "text/csv")
    c.header("Content-Disposition", "attachment; filename=reports.csv")
    return c.body(headers + rows)
  }

  return c.json({ data })
})

// Single report detail
admin.get("/reports/:id", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
    with: {
      public: { columns: { id: true, name: true, email: true, phone: true } },
      province: true,
      city: true,
      district: true,
      verifier: { columns: { name: true, email: true } },
      files: true,
      statusHistory: {
        orderBy: [desc(schema.reportStatusHistory.createdAt)],
        with: { changedByAdmin: { columns: { name: true, email: true } } },
      },
    },
  })

  if (!report) return c.json({ error: "Report not found" }, 404)

  return c.json({
    data: {
      ...report,
      province: report.province?.name || "",
      city: report.city?.name || "",
      district: report.district?.name || "",
      reporter: {
        id: report.public?.id,
        name: report.public?.name || "Anonymous",
        email: report.public?.email,
        phone: report.public?.phone,
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
        changedBy: h.changedByAdmin?.name || h.changedByAdmin?.email || "Unknown",
        createdAt: h.createdAt,
      })),
    },
  })
})

// Update report status
const updateReportStatusSchema = z.object({
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]),
  credibilityLevel: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().max(1000).optional(),
})

admin.patch("/reports/:id/status", zValidator("json", updateReportStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { status, credibilityLevel, notes } = c.req.valid("json")
  const currentAdmin = c.get("admin")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Report not found" }, 404)

  const previousStatus = report.status

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) updateData.adminNotes = notes
  if (credibilityLevel) updateData.credibilityLevel = credibilityLevel

  if (previousStatus === "pending" && status !== "pending") {
    updateData.verifiedBy = currentAdmin.id
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

  db.insert(schema.reportStatusHistory).values({
    reportId: id,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: currentAdmin.id,
    notes: notes || null,
  }).catch(() => {})

  return c.json({ data: updated, message: "Report status updated successfully" })
})

// Bulk update report status
const bulkUpdateSchema = z.object({
  reportIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]),
  notes: z.string().max(500).optional(),
})

admin.patch("/reports/bulk-status", zValidator("json", bulkUpdateSchema), async (c) => {
  const { reportIds, status, notes } = c.req.valid("json")
  const currentAdmin = c.get("admin")

  const reports = await db.query.reports.findMany({
    where: inArray(schema.reports.id, reportIds),
  })

  if (reports.length === 0) {
    return c.json({ error: "No reports found" }, 404)
  }

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) updateData.adminNotes = notes

  if (status !== "pending") {
    updateData.verifiedBy = currentAdmin.id
    updateData.verifiedAt = new Date()
  }

  const historyRecords = reports.map((r) => ({
    reportId: r.id,
    fromStatus: r.status,
    toStatus: status,
    changedBy: currentAdmin.id,
    notes: notes || null,
  }))

  await Promise.all([
    db.update(schema.reports)
      .set(updateData)
      .where(inArray(schema.reports.id, reportIds)),
    db.insert(schema.reportStatusHistory).values(historyRecords),
  ])

  // Update verifiedReportCount per reporter
  const reporterUpdates = new Map<string, number>()
  for (const r of reports) {
    if (!r.publicId) continue
    const delta =
      (status === "resolved" && r.status !== "resolved") ? 1 :
      (r.status === "resolved" && status !== "resolved") ? -1 : 0
    if (delta !== 0) {
      reporterUpdates.set(r.publicId, (reporterUpdates.get(r.publicId) || 0) + delta)
    }
  }
  for (const [publicId, delta] of reporterUpdates) {
    if (delta > 0) {
      await db.update(schema.publics)
        .set({ verifiedReportCount: sql`${schema.publics.verifiedReportCount} + ${delta}` })
        .where(eq(schema.publics.id, publicId))
    } else {
      await db.update(schema.publics)
        .set({ verifiedReportCount: sql`GREATEST(${schema.publics.verifiedReportCount} + ${delta}, 0)` })
        .where(eq(schema.publics.id, publicId))
    }
  }

  return c.json({
    message: `${reports.length} reports updated successfully`,
    updated: reports.length,
  })
})

// Delete report
admin.delete("/reports/:id", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({ where: eq(schema.reports.id, id) })
  if (!report) return c.json({ error: "Report not found" }, 404)

  await db.delete(schema.reports).where(eq(schema.reports.id, id))

  return c.json({ message: "Report deleted successfully" })
})

// Analytics
const analyticsQuerySchema = z.object({
  year: z.string().optional().transform((val) => val ? parseInt(val) : new Date().getFullYear()),
  month: z.string().optional().transform((val) => val ? parseInt(val) : 0),
})

admin.get("/analytics", zValidator("query", analyticsQuerySchema), async (c) => {
  const { year, month } = c.req.valid("query")

  const trendQuery = month > 0
    ? db.select({
        day: sql<number>`extract(day from ${schema.reports.createdAt})`,
        count: sql<number>`count(*)`,
      })
        .from(schema.reports)
        .where(sql`extract(year from ${schema.reports.createdAt}) = ${year} AND extract(month from ${schema.reports.createdAt}) = ${month}`)
        .groupBy(sql`extract(day from ${schema.reports.createdAt})`)
        .orderBy(sql`extract(day from ${schema.reports.createdAt})`)
    : db.select({
        month: sql<string>`to_char(${schema.reports.createdAt}, 'Mon')`,
        monthNum: sql<number>`extract(month from ${schema.reports.createdAt})`,
        count: sql<number>`count(*)`,
      })
        .from(schema.reports)
        .where(sql`extract(year from ${schema.reports.createdAt}) = ${year}`)
        .groupBy(sql`to_char(${schema.reports.createdAt}, 'Mon')`, sql`extract(month from ${schema.reports.createdAt})`)
        .orderBy(sql`extract(month from ${schema.reports.createdAt})`)

  const [
    reportAggregates,
    userAggregates,
    trendData,
    topProvinces,
    topCities,
    topDistricts,
  ] = await Promise.all([
    db.select({
      total: sql<number>`count(*)`,
      last30Days: sql<number>`count(*) filter (where ${schema.reports.createdAt} >= now() - interval '30 days')`,
      last7Days: sql<number>`count(*) filter (where ${schema.reports.createdAt} >= now() - interval '7 days')`,
      highRisk: sql<number>`count(*) filter (where ${schema.reports.credibilityLevel} = 'high')`,
      mediumRisk: sql<number>`count(*) filter (where ${schema.reports.credibilityLevel} = 'medium')`,
      lowRisk: sql<number>`count(*) filter (where ${schema.reports.credibilityLevel} = 'low')`,
    }).from(schema.reports),
    db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${schema.publics.lastLoginAt} >= now() - interval '30 days')`,
      withGoogle: sql<number>`count(*) filter (where ${schema.publics.googleId} is not null)`,
    }).from(schema.publics),
    trendQuery,
    db.select({
      provinceId: schema.reports.provinceId,
      count: sql<number>`count(*)`,
    })
      .from(schema.reports)
      .groupBy(schema.reports.provinceId)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
    db.select({
      cityId: schema.reports.cityId,
      provinceId: schema.reports.provinceId,
      count: sql<number>`count(*)`,
    })
      .from(schema.reports)
      .groupBy(schema.reports.cityId, schema.reports.provinceId)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
    db.select({
      districtId: schema.reports.districtId,
      cityId: schema.reports.cityId,
      count: sql<number>`count(*)`,
    })
      .from(schema.reports)
      .where(sql`${schema.reports.districtId} is not null`)
      .groupBy(schema.reports.districtId, schema.reports.cityId)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
  ])

  const provinceIds = [...new Set([
    ...topProvinces.map((p) => p.provinceId),
    ...topCities.map((c) => c.provinceId),
  ])].filter(Boolean) as string[]
  const cityIds = [...new Set([
    ...topCities.map((c) => c.cityId),
    ...topDistricts.map((d) => d.cityId),
  ])].filter(Boolean) as string[]
  const districtIds = topDistricts.map((d) => d.districtId).filter(Boolean) as string[]

  const [provinces, cities, districts] = await Promise.all([
    provinceIds.length > 0
      ? db.query.provinces.findMany({ where: inArray(schema.provinces.id, provinceIds), columns: { id: true, name: true } })
      : [],
    cityIds.length > 0
      ? db.query.cities.findMany({ where: inArray(schema.cities.id, cityIds), columns: { id: true, name: true } })
      : [],
    districtIds.length > 0
      ? db.query.districts.findMany({ where: inArray(schema.districts.id, districtIds), columns: { id: true, name: true } })
      : [],
  ])

  const provinceMap = new Map(provinces.map((p) => [p.id, p.name]))
  const cityMap = new Map(cities.map((c) => [c.id, c.name]))
  const districtMap = new Map(districts.map((d) => [d.id, d.name]))

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  let formattedTrends: { label: string; count: number }[]
  if (month > 0) {
    const daysInMonth = new Date(year, month, 0).getDate()
    formattedTrends = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const found = (trendData as Array<{ day?: number; count: number }>).find((r) => Number(r.day) === day)
      return { label: String(day), count: Number(found?.count || 0) }
    })
  } else {
    formattedTrends = monthLabels.map((label, idx) => {
      const found = (trendData as Array<{ monthNum?: number; count: number }>).find((r) => Number(r.monthNum) === idx + 1)
      return { label, count: Number(found?.count || 0) }
    })
  }

  return c.json({
    overview: {
      totalReports: Number(reportAggregates[0]?.total || 0),
      last30Days: Number(reportAggregates[0]?.last30Days || 0),
      last7Days: Number(reportAggregates[0]?.last7Days || 0),
      totalUsers: Number(userAggregates[0]?.total || 0),
      activeUsers: Number(userAggregates[0]?.active || 0),
      highRiskReports: Number(reportAggregates[0]?.highRisk || 0),
      mediumRiskReports: Number(reportAggregates[0]?.mediumRisk || 0),
      lowRiskReports: Number(reportAggregates[0]?.lowRisk || 0),
    },
    trends: {
      data: formattedTrends,
      isMonthly: month === 0,
    },
    topProvinces: topProvinces.map((p) => ({
      provinceId: p.provinceId,
      province: provinceMap.get(p.provinceId || "") || "",
      count: Number(p.count),
    })),
    topCities: topCities.map((c) => ({
      cityId: c.cityId,
      city: cityMap.get(c.cityId || "") || "",
      province: provinceMap.get(c.provinceId || "") || "",
      count: Number(c.count),
    })),
    topDistricts: topDistricts.map((d) => ({
      districtId: d.districtId,
      district: districtMap.get(d.districtId || "") || "",
      city: cityMap.get(d.cityId || "") || "",
      count: Number(d.count),
    })),
  })
})

// User sessions management
admin.get("/sessions", zValidator("query", z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "20")))),
  userId: z.string().uuid().optional(),
})), async (c) => {
  const { page, limit, userId } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (userId) conditions.push(eq(schema.sessions.publicId, userId))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [data, countResult] = await Promise.all([
    db.query.sessions.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(schema.sessions.createdAt)],
      with: { public: { columns: { name: true, email: true } } },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.sessions).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((s) => ({
      id: s.id,
      userId: s.publicId,
      userName: s.public?.name,
      userEmail: s.public?.email,
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

  const user = await db.query.publics.findFirst({ where: eq(schema.publics.id, userId) })
  if (!user) return c.json({ error: "User not found" }, 404)

  await db.update(schema.sessions)
    .set({ isRevoked: true })
    .where(eq(schema.sessions.publicId, userId))

  return c.json({ message: "All user sessions revoked" })
})

// MBG schedule management
const mbgScheduleQuerySchema = z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "20")))),
  provinceId: z.string().optional(),
  cityId: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional().transform((val) => val === "true"),
  search: z.string().max(100).optional(),
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

  return c.json({ data: schedule, message: "MBG schedule created successfully" }, 201)
})

admin.patch("/mbg-schedules/:id", zValidator("json", createMbgScheduleSchema.partial().extend({
  isActive: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param("id")
  const data = c.req.valid("json")

  const schedule = await db.query.mbgSchedules.findFirst({
    where: eq(schema.mbgSchedules.id, id),
  })

  if (!schedule) return c.json({ error: "Schedule not found" }, 404)

  const [updated] = await db.update(schema.mbgSchedules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.mbgSchedules.id, id))
    .returning()

  return c.json({ data: updated, message: "MBG schedule updated successfully" })
})

admin.delete("/mbg-schedules/:id", async (c) => {
  const id = c.req.param("id")

  const schedule = await db.query.mbgSchedules.findFirst({
    where: eq(schema.mbgSchedules.id, id),
  })

  if (!schedule) return c.json({ error: "Schedule not found" }, 404)

  await db.delete(schema.mbgSchedules).where(eq(schema.mbgSchedules.id, id))

  return c.json({ message: "MBG schedule deleted successfully" })
})

// Report scoring breakdown
admin.get("/reports/:id/scoring", async (c) => {
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
  })

  if (!report) return c.json({ error: "Report not found" }, 404)

  return c.json({
    data: {
      scoreRelation: { value: report.scoreRelation, max: 3, label: "MBG Relation" },
      scoreLocationTime: { value: report.scoreLocationTime, max: 3, label: "Location & Time Validity" },
      scoreEvidence: { value: report.scoreEvidence, max: 3, label: "Supporting Evidence" },
      scoreNarrative: { value: report.scoreNarrative, max: 3, label: "Narrative Consistency" },
      scoreReporterHistory: { value: report.scoreReporterHistory, max: 3, label: "Reporter History" },
      scoreSimilarity: { value: report.scoreSimilarity, max: 3, label: "Similar Reports" },
      totalScore: report.totalScore,
      credibilityLevel: report.credibilityLevel,
    },
  })
})

// Admin accounts management
const adminQuerySchema = z.object({
  search: z.string().max(100).optional(),
  isActive: z.enum(["true", "false"]).optional().transform((val) => val === "true" ? true : val === "false" ? false : undefined),
})

admin.get("/admins", zValidator("query", adminQuerySchema), async (c) => {
  const { search, isActive } = c.req.valid("query")

  const conditions = []
  if (isActive !== undefined) conditions.push(eq(schema.admins.isActive, isActive))
  if (search) {
    conditions.push(
      or(like(schema.admins.name, `%${search}%`), like(schema.admins.email, `%${search}%`))
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const data = await db.select({
    id: schema.admins.id,
    name: schema.admins.name,
    email: schema.admins.email,
    phone: schema.admins.phone,
    adminRole: schema.admins.adminRole,
    isActive: schema.admins.isActive,
    lastLoginAt: schema.admins.lastLoginAt,
    createdAt: schema.admins.createdAt,
  }).from(schema.admins).where(whereClause).orderBy(desc(schema.admins.createdAt))

  return c.json({ data })
})

const createAdminSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email().max(255),
  password: z.string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  adminRole: z.string().min(2).max(100),
})

admin.post("/admins", zValidator("json", createAdminSchema), async (c) => {
  const { name, email, password, adminRole } = c.req.valid("json")

  const existing = await db.query.admins.findFirst({ where: eq(schema.admins.email, email) })
  if (existing) return c.json({ error: "Email already registered" }, 400)

  const hashedPassword = await hashPassword(password)

  const [newAdmin] = await db.insert(schema.admins).values({
    name,
    email,
    password: hashedPassword,
    adminRole,
    isActive: true,
  }).returning({ id: schema.admins.id, name: schema.admins.name, email: schema.admins.email, adminRole: schema.admins.adminRole })

  return c.json({ data: newAdmin, message: "Admin created successfully" }, 201)
})

admin.patch("/admins/:id", zValidator("json", z.object({
  name: z.string().min(3).max(255).optional(),
  adminRole: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param("id")
  const data = c.req.valid("json")
  const currentAdmin = c.get("admin")

  const adminUser = await db.query.admins.findFirst({ where: eq(schema.admins.id, id) })
  if (!adminUser) return c.json({ error: "Admin not found" }, 404)

  // Block self-deactivation
  if (data.isActive === false && currentAdmin.id === id) {
    return c.json({ error: "Cannot deactivate your own account" }, 400)
  }

  const [updated] = await db.update(schema.admins)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.admins.id, id))
    .returning({ id: schema.admins.id, name: schema.admins.name, adminRole: schema.admins.adminRole, isActive: schema.admins.isActive })

  return c.json({ data: updated, message: "Admin updated successfully" })
})

admin.delete("/admins/:id", async (c) => {
  const id = c.req.param("id")
  const currentAdmin = c.get("admin")

  if (currentAdmin.id === id) return c.json({ error: "Cannot delete your own account" }, 400)

  const adminUser = await db.query.admins.findFirst({ where: eq(schema.admins.id, id) })
  if (!adminUser) return c.json({ error: "Admin not found" }, 404)

  await db.delete(schema.admins).where(eq(schema.admins.id, id))
  return c.json({ message: "Admin deleted successfully" })
})

// Member management
const memberQuerySchema = z.object({
  status: z.enum(["verified", "pending", "all"]).optional().default("all"),
  memberType: z.enum(["supplier", "caterer", "school", "government", "foundation", "ngo", "farmer", "other"]).optional(),
  search: z.string().max(100).optional(),
})

admin.get("/members", zValidator("query", memberQuerySchema), async (c) => {
  const { status, memberType, search } = c.req.valid("query")

  const conditions = []
  if (status === "verified") conditions.push(eq(schema.members.isVerified, true))
  if (status === "pending") conditions.push(eq(schema.members.isVerified, false))
  if (memberType) conditions.push(eq(schema.members.memberType, memberType))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const data = await db.query.members.findMany({
    where: whereClause,
    orderBy: [desc(schema.members.createdAt)],
    with: {
      public: { columns: { id: true, name: true, email: true, phone: true } },
      verifier: { columns: { name: true } },
    },
  })

  // Search filter
  let filteredData = data
  if (search) {
    const searchLower = search.toLowerCase()
    filteredData = data.filter((m) =>
      m.public?.name?.toLowerCase().includes(searchLower) ||
      m.public?.email?.toLowerCase().includes(searchLower) ||
      m.organizationName.toLowerCase().includes(searchLower)
    )
  }

  return c.json({
    data: filteredData.map((m) => ({
      id: m.id,
      userId: m.publicId,
      name: m.public?.name || "",
      email: m.public?.email || "",
      phone: m.public?.phone || "",
      memberType: m.memberType,
      organizationName: m.organizationName,
      organizationEmail: m.organizationEmail,
      organizationPhone: m.organizationPhone,
      roleInOrganization: m.roleInOrganization,
      organizationMbgRole: m.organizationMbgRole,
      isVerified: m.isVerified,
      verifiedAt: m.verifiedAt,
      verifiedBy: m.verifier?.name || null,
      appliedAt: m.appliedAt,
      createdAt: m.createdAt,
      organizationInfo: {
        name: m.organizationName,
        email: m.organizationEmail || "",
        phone: m.organizationPhone || "",
        roleInOrganization: m.roleInOrganization || "",
        organizationMbgRole: m.organizationMbgRole || "",
      }
    }))
  })
})

// Create member
const createMemberSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  memberType: z.enum(["supplier", "caterer", "school", "government", "foundation", "ngo", "farmer", "other"]),
  organizationName: z.string().min(3).max(255).optional(),
  organizationEmail: z.string().email().optional(),
  organizationPhone: z.string().optional(),
  roleInOrganization: z.string().optional(),
  organizationMbgRole: z.string().optional(),
})

admin.post("/members", zValidator("json", createMemberSchema), async (c) => {
  const data = c.req.valid("json")
  const admin = c.get("admin")

  // Format phone number
  let formattedPhone = data.phone
  if (formattedPhone.startsWith("08")) {
    formattedPhone = "+62" + formattedPhone.slice(1)
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+62" + formattedPhone
  }

  // Check existing email
  const existingEmail = await db.query.publics.findFirst({
    where: eq(schema.publics.email, data.email),
  })
  if (existingEmail) {
    return c.json({ error: "Email already registered" }, 400)
  }

  // Check existing phone
  const existingPhone = await db.query.publics.findFirst({
    where: eq(schema.publics.phone, formattedPhone),
  })
  if (existingPhone) {
    return c.json({ error: "Phone number already registered" }, 400)
  }

  // Create user first
  const [user] = await db.insert(schema.publics).values({
    name: data.name,
    email: data.email,
    phone: formattedPhone,
  }).returning()

  // Create linked member
  const [member] = await db.insert(schema.members).values({
    publicId: user.id,
    memberType: data.memberType,
    organizationName: data.organizationName || data.name,
    organizationEmail: data.organizationEmail,
    organizationPhone: data.organizationPhone,
    roleInOrganization: data.roleInOrganization,
    organizationMbgRole: data.organizationMbgRole,
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: admin.id,
    appliedAt: new Date(),
  }).returning()

  return c.json({
    data: { ...member, userId: user.id },
    message: "Member created successfully",
  }, 201)
})

// Get single member detail
admin.get("/members/:id", async (c) => {
  const id = c.req.param("id")

  const member = await db.query.members.findFirst({
    where: eq(schema.members.id, id),
    with: {
      public: { columns: { id: true, name: true, email: true, phone: true, createdAt: true } },
      verifier: { columns: { name: true, email: true } },
    },
  })

  if (!member) return c.json({ error: "Member not found" }, 404)

  return c.json({
    data: {
      id: member.id,
      userId: member.publicId,
      name: member.public?.name || "",
      email: member.public?.email || "",
      phone: member.public?.phone || "",
      memberType: member.memberType,
      organizationName: member.organizationName,
      organizationEmail: member.organizationEmail,
      organizationPhone: member.organizationPhone,
      roleInOrganization: member.roleInOrganization,
      organizationMbgRole: member.organizationMbgRole,
      isVerified: member.isVerified,
      verifiedAt: member.verifiedAt,
      verifiedBy: member.verifier?.name || null,
      appliedAt: member.appliedAt,
      createdAt: member.createdAt,
      organizationInfo: {
        name: member.organizationName,
        email: member.organizationEmail || "",
        phone: member.organizationPhone || "",
        roleInOrganization: member.roleInOrganization || "",
        organizationMbgRole: member.organizationMbgRole || "",
      }
    }
  })
})

// Verify member
admin.patch("/members/:id/verify", async (c) => {
  const id = c.req.param("id")
  const currentAdmin = c.get("admin")

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, id) })
  if (!member) return c.json({ error: "Member not found" }, 404)

  const now = new Date()
  await db.update(schema.members)
    .set({ isVerified: true, verifiedAt: now, verifiedBy: currentAdmin.id, updatedAt: now })
    .where(eq(schema.members.id, id))

  return c.json({ message: "Member verified successfully" })
})

// Update member status
const updateMemberStatusSchema = z.object({
  isVerified: z.boolean().optional(),
})

admin.patch("/members/:id/status", zValidator("json", updateMemberStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { isVerified } = c.req.valid("json")
  const currentAdmin = c.get("admin")

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, id) })
  if (!member) return c.json({ error: "Member not found" }, 404)

  const now = new Date()

  // Update verification status
  if (isVerified !== undefined) {
    const memberUpdate: Record<string, unknown> = { isVerified, updatedAt: now }
    if (isVerified) {
      memberUpdate.verifiedAt = now
      memberUpdate.verifiedBy = currentAdmin.id
    }
    await db.update(schema.members).set(memberUpdate).where(eq(schema.members.id, id))
  }

  return c.json({ message: "Member status updated successfully" })
})

// Delete member
admin.delete("/members/:id", async (c) => {
  const id = c.req.param("id")

  const member = await db.query.members.findFirst({ where: eq(schema.members.id, id) })
  if (!member) return c.json({ error: "Member not found" }, 404)

  // Delete member only
  await db.delete(schema.members).where(eq(schema.members.id, id))

  return c.json({ message: "Member deleted successfully" })
})

export default admin
