import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, sql, and } from "drizzle-orm"
import { db, schema } from "../db"
import { authMiddleware } from "../middleware/auth"
import { hashPassword, verifyPassword } from "../lib/password"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const profile = new Hono<{ Variables: Variables }>()

// All routes require authentication
profile.use("*", authMiddleware)

// Get current user profile
profile.get("/", async (c) => {
  const authUser = c.get("user")

  // Optimized: Single query for user and stats
  const [user, reportStats] = await Promise.all([
    db.query.users.findFirst({
      where: eq(schema.users.id, authUser.id),
      columns: {
        id: true, nik: true, email: true, phone: true, name: true,
        role: true, isVerified: true, reportCount: true,
        verifiedReportCount: true, createdAt: true, lastLoginAt: true,
      },
    }),
    // Combined aggregates in single query
    db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${schema.reports.status} = 'pending')`,
      resolved: sql<number>`count(*) filter (where ${schema.reports.status} = 'resolved')`,
    }).from(schema.reports).where(eq(schema.reports.userId, authUser.id)),
  ])

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  return c.json({
    user,
    stats: {
      totalReports: Number(reportStats[0]?.total || 0),
      pendingReports: Number(reportStats[0]?.pending || 0),
      resolvedReports: Number(reportStats[0]?.resolved || 0),
    },
  })
})

// Update profile
const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  phone: z.string().min(10).max(15).optional(),
  email: z.string().email("Email tidak valid").optional(),
})

profile.patch("/", zValidator("json", updateProfileSchema), async (c) => {
  const authUser = c.get("user")
  const { name, phone, email } = c.req.valid("json")

  // Check for duplicate phone
  if (phone) {
    const existingPhone = await db.query.users.findFirst({
      where: eq(schema.users.phone, phone),
    })
    if (existingPhone && existingPhone.id !== authUser.id) {
      return c.json({ error: "Nomor telepon sudah digunakan" }, 400)
    }
  }

  // Check for duplicate email
  if (email) {
    const existingEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    })
    if (existingEmail && existingEmail.id !== authUser.id) {
      return c.json({ error: "Email sudah digunakan" }, 400)
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (email !== undefined) {
    updateData.email = email
    updateData.isVerified = false
  }

  const [updated] = await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, authUser.id))
    .returning({
      id: schema.users.id,
      nik: schema.users.nik,
      email: schema.users.email,
      phone: schema.users.phone,
      name: schema.users.name,
      role: schema.users.role,
      isVerified: schema.users.isVerified,
    })

  return c.json({
    user: updated,
    message: "Profil berhasil diperbarui",
  })
})

// Change password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru tidak cocok",
  path: ["confirmPassword"],
})

profile.put("/password", zValidator("json", changePasswordSchema), async (c) => {
  const authUser = c.get("user")
  const { currentPassword, newPassword } = c.req.valid("json")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, authUser.id),
  })

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) return c.json({ error: "Password saat ini salah" }, 400)

  const hashedPassword = await hashPassword(newPassword)

  // Parallel: Update password and revoke sessions
  await Promise.all([
    db.update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, authUser.id)),
    db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.userId, authUser.id)),
  ])

  return c.json({ message: "Password berhasil diubah" })
})

// Get user's report history
const reportHistorySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "rejected"]).optional(),
})

profile.get("/reports", zValidator("query", reportHistorySchema), async (c) => {
  const authUser = c.get("user")
  const { page, limit, status } = c.req.valid("query")
  const offset = (page - 1) * limit

  const whereClause = status
    ? and(eq(schema.reports.userId, authUser.id), eq(schema.reports.status, status))
    : eq(schema.reports.userId, authUser.id)

  const [data, countResult] = await Promise.all([
    db.query.reports.findMany({
      where: whereClause,
      columns: {
        id: true, category: true, title: true, description: true,
        location: true, incidentDate: true, status: true, relation: true, createdAt: true,
      },
      limit,
      offset,
      orderBy: [desc(schema.reports.createdAt)],
      with: {
        province: { columns: { name: true } },
        city: { columns: { name: true } },
        files: { columns: { id: true, fileName: true, fileUrl: true } },
      },
    }),
    db.select({ count: sql<number>`count(*)` })
      .from(schema.reports)
      .where(whereClause),
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
      relation: r.relation,
      files: r.files,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// Get single report detail for owner
profile.get("/reports/:id", async (c) => {
  const authUser = c.get("user")
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: and(eq(schema.reports.id, id), eq(schema.reports.userId, authUser.id)),
    with: {
      province: { columns: { name: true } },
      city: { columns: { name: true } },
      district: { columns: { name: true } },
      files: true,
      statusHistory: {
        orderBy: [desc(schema.reportStatusHistory.createdAt)],
        with: { changedByUser: { columns: { name: true } } },
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
      statusHistory: report.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        notes: h.notes,
        changedBy: h.changedByUser?.name || "Admin",
        createdAt: h.createdAt,
      })),
    },
  })
})

// Delete account (soft delete by deactivating)
profile.delete("/", async (c) => {
  const authUser = c.get("user")

  // Parallel updates
  await Promise.all([
    db.update(schema.users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.users.id, authUser.id)),
    db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.userId, authUser.id)),
  ])

  return c.json({ message: "Akun berhasil dinonaktifkan" })
})

export default profile
