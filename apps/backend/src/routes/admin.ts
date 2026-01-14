import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, sql, like, and, or } from "drizzle-orm"
import { db, schema } from "../db"
import { adminMiddleware } from "../middleware/auth"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const admin = new Hono<{ Variables: Variables }>()

admin.use("*", adminMiddleware)

const userQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "10")),
  role: z.enum(["user", "admin", "moderator", "member"]).optional(),
  search: z.string().optional(),
})

admin.get("/users", zValidator("query", userQuerySchema), async (c) => {
  const { page, limit, role, search } = c.req.valid("query")
  const offset = (page - 1) * limit

  const conditions = []
  if (role) conditions.push(eq(schema.users.role, role))
  if (search) {
    conditions.push(
      or(like(schema.users.name, `%${search}%`), like(schema.users.email, `%${search}%`))
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
      organization: schema.users.organization,
      isVerified: schema.users.isVerified,
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
  role: z.enum(["user", "admin", "moderator", "member"]).optional(),
  isVerified: z.boolean().optional(),
})

admin.patch("/users/:id", zValidator("json", updateUserSchema), async (c) => {
  const id = c.req.param("id")
  const data = c.req.valid("json")

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  const [updated] = await db.update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id, role: schema.users.role, isVerified: schema.users.isVerified })

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
  const [usersCount, reportsCount, byStatus, byCategory, recentReports] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.users),
    db.select({ count: sql<number>`count(*)` }).from(schema.reports),
    db.select({ status: schema.reports.status, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.status),
    db.select({ category: schema.reports.category, count: sql<number>`count(*)` }).from(schema.reports).groupBy(schema.reports.category),
    db.query.reports.findMany({
      limit: 5,
      orderBy: [desc(schema.reports.createdAt)],
      with: { province: true, city: true },
    }),
  ])

  return c.json({
    users: Number(usersCount[0]?.count || 0),
    reports: Number(reportsCount[0]?.count || 0),
    byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    byCategory: byCategory.map((r) => ({ category: r.category, count: Number(r.count) })),
    recentReports: recentReports.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      province: r.province?.name || "",
      city: r.city?.name || "",
      createdAt: r.createdAt,
    })),
  })
})

export default admin
