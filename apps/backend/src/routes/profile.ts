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

profile.use("*", authMiddleware)

profile.get("/", async (c) => {
  const authUser = c.get("user")

  const [publicUser, reportStats] = await Promise.all([
    db.query.publics.findFirst({
      where: eq(schema.publics.id, authUser.id),
      columns: {
        id: true, email: true, phone: true, name: true,
        signupMethod: true, googleId: true, googleEmail: true,
        reportCount: true, verifiedReportCount: true,
        createdAt: true, lastLoginAt: true, password: true,
      },
      with: {
        member: { columns: { id: true, memberType: true, organizationName: true, isVerified: true } },
      },
    }),
    db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${schema.reports.status} = 'pending')`,
      resolved: sql<number>`count(*) filter (where ${schema.reports.status} = 'resolved')`,
    }).from(schema.reports).where(eq(schema.reports.publicId, authUser.id)),
  ])

  if (!publicUser) return c.json({ error: "User tidak ditemukan" }, 404)

  return c.json({
    user: {
      id: publicUser.id,
      email: publicUser.email,
      phone: publicUser.phone,
      name: publicUser.name,
      signupMethod: publicUser.signupMethod,
      reportCount: publicUser.reportCount,
      verifiedReportCount: publicUser.verifiedReportCount,
      createdAt: publicUser.createdAt,
      lastLoginAt: publicUser.lastLoginAt,
      hasPassword: !!publicUser.password,
      isGoogleLinked: !!publicUser.googleId,
      googleEmail: publicUser.googleEmail || null,
      isMember: !!publicUser.member,
      member: publicUser.member || null,
    },
    stats: {
      totalReports: Number(reportStats[0]?.total || 0),
      pendingReports: Number(reportStats[0]?.pending || 0),
      resolvedReports: Number(reportStats[0]?.resolved || 0),
    },
  })
})

const formatPhone = (rawPhone: string): string => {
  const cleaned = rawPhone.replace(/\D/g, "")
  if (cleaned.startsWith("62")) return "+" + cleaned
  if (cleaned.startsWith("08")) return "+62" + cleaned.slice(1)
  if (cleaned.startsWith("8")) return "+62" + cleaned
  return "+62" + cleaned
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  phone: z.string().min(9).max(15).optional(),
  email: z.string().email("Email tidak valid").optional(),
})

profile.patch("/", zValidator("json", updateProfileSchema), async (c) => {
  const authUser = c.get("user")
  const { name, phone: rawPhone, email } = c.req.valid("json")

  const phone = rawPhone ? formatPhone(rawPhone) : undefined

  if (phone) {
    const existingPhone = await db.query.publics.findFirst({
      where: eq(schema.publics.phone, phone),
    })
    if (existingPhone && existingPhone.id !== authUser.id) {
      return c.json({ error: "Nomor telepon sudah digunakan" }, 400)
    }
  }

  if (email) {
    const existingEmail = await db.query.publics.findFirst({
      where: eq(schema.publics.email, email),
    })
    if (existingEmail && existingEmail.id !== authUser.id) {
      return c.json({ error: "Email sudah digunakan" }, 400)
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (email !== undefined) updateData.email = email

  const [updated] = await db.update(schema.publics)
    .set(updateData)
    .where(eq(schema.publics.id, authUser.id))
    .returning({
      id: schema.publics.id,
      email: schema.publics.email,
      phone: schema.publics.phone,
      name: schema.publics.name,
    })

  return c.json({
    user: updated,
    message: "Profil berhasil diperbarui",
  })
})

const passwordValidator = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: passwordValidator,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru tidak cocok",
  path: ["confirmPassword"],
})

profile.put("/password", zValidator("json", changePasswordSchema), async (c) => {
  const authUser = c.get("user")
  const { currentPassword, newPassword } = c.req.valid("json")

  const publicUser = await db.query.publics.findFirst({
    where: eq(schema.publics.id, authUser.id),
  })

  if (!publicUser) return c.json({ error: "User tidak ditemukan" }, 404)

  if (!publicUser.password) {
    return c.json({ error: "Anda login dengan Google. Silakan set password terlebih dahulu." }, 400)
  }

  const isValid = await verifyPassword(currentPassword, publicUser.password)
  if (!isValid) return c.json({ error: "Password saat ini salah" }, 400)

  const hashedPassword = await hashPassword(newPassword)

  await Promise.all([
    db.update(schema.publics)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.publics.id, authUser.id)),
    db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.publicId, authUser.id)),
  ])

  return c.json({ message: "Password berhasil diubah" })
})

const setPasswordSchema = z.object({
  newPassword: passwordValidator,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
})

profile.post("/password", zValidator("json", setPasswordSchema), async (c) => {
  const authUser = c.get("user")
  const { newPassword } = c.req.valid("json")

  const publicUser = await db.query.publics.findFirst({
    where: eq(schema.publics.id, authUser.id),
  })

  if (!publicUser) return c.json({ error: "User tidak ditemukan" }, 404)

  if (publicUser.password) {
    return c.json({ error: "Password sudah diset. Gunakan fitur ubah password." }, 400)
  }

  const hashedPassword = await hashPassword(newPassword)

  await db.update(schema.publics)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(schema.publics.id, authUser.id))

  return c.json({ message: "Password berhasil diset" })
})

const reportHistorySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  status: z.enum(["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]).optional(),
})

profile.get("/reports", zValidator("query", reportHistorySchema), async (c) => {
  const authUser = c.get("user")
  const { page, limit, status } = c.req.valid("query")
  const offset = (page - 1) * limit

  const whereClause = status
    ? and(eq(schema.reports.publicId, authUser.id), eq(schema.reports.status, status))
    : eq(schema.reports.publicId, authUser.id)

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

profile.get("/reports/:id", async (c) => {
  const authUser = c.get("user")
  const id = c.req.param("id")

  const report = await db.query.reports.findFirst({
    where: and(eq(schema.reports.id, id), eq(schema.reports.publicId, authUser.id)),
    with: {
      province: { columns: { name: true } },
      city: { columns: { name: true } },
      district: { columns: { name: true } },
      files: true,
      statusHistory: {
        orderBy: [desc(schema.reportStatusHistory.createdAt)],
        with: { changedByAdmin: { columns: { name: true } } },
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
        changedBy: h.changedByAdmin?.name || "Admin",
        createdAt: h.createdAt,
      })),
    },
  })
})

profile.delete("/", async (c) => {
  const authUser = c.get("user")

  // Delete all related data in order
  await Promise.all([
    // Revoke and delete sessions
    db.delete(schema.sessions).where(eq(schema.sessions.publicId, authUser.id)),
    // Delete password reset tokens
    db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.publicId, authUser.id)),
    // Delete member record if exists
    db.delete(schema.members).where(eq(schema.members.publicId, authUser.id)),
  ])

  // Set reports publicId to null (keep reports for data integrity)
  await db.update(schema.reports)
    .set({ publicId: null })
    .where(eq(schema.reports.publicId, authUser.id))

  // Set kitchen needs requests publicId to null
  await db.update(schema.kitchenNeedsRequests)
    .set({ publicId: null })
    .where(eq(schema.kitchenNeedsRequests.publicId, authUser.id))

  // Delete the user account
  await db.delete(schema.publics).where(eq(schema.publics.id, authUser.id))

  return c.json({ message: "Akun berhasil dihapus" })
})

export default profile
