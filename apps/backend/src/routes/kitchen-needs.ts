import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, desc, sql, and, asc } from "drizzle-orm"
import { db, schema } from "../db"
import { authMiddleware, adminMiddleware } from "../middleware/auth"
import type { AuthUser, AuthAdmin } from "../types"

type UserVariables = { user: AuthUser }
type AdminVariables = { admin: AuthAdmin }

const kitchenNeeds = new Hono()

// Public: Get all active kitchen needs
kitchenNeeds.get("/", async (c) => {
  const data = await db.query.kitchenNeeds.findMany({
    where: eq(schema.kitchenNeeds.isActive, true),
    orderBy: [asc(schema.kitchenNeeds.sortOrder), desc(schema.kitchenNeeds.createdAt)],
    columns: { id: true, title: true, description: true, imageUrl: true },
  })

  return c.json({ data })
})

// Public: Get single kitchen need
kitchenNeeds.get("/:id", async (c) => {
  const id = c.req.param("id")

  const item = await db.query.kitchenNeeds.findFirst({
    where: and(eq(schema.kitchenNeeds.id, id), eq(schema.kitchenNeeds.isActive, true)),
    columns: { id: true, title: true, description: true, imageUrl: true },
  })

  if (!item) return c.json({ error: "Konten tidak ditemukan" }, 404)

  return c.json({ data: item })
})

// Authenticated: Submit a request
const submitRequestSchema = z.object({
  kitchenNeedId: z.string().uuid(),
  sppgName: z.string().min(3, "Nama SPPG minimal 3 karakter").max(255),
  contactPerson: z.string().min(3, "Nama kontak minimal 3 karakter").max(255),
  position: z.string().min(2, "Jabatan minimal 2 karakter").max(100),
  phoneNumber: z.string().min(10, "No telepon minimal 10 digit").max(20),
  details: z.string().min(20, "Detail minimal 20 karakter"),
})

kitchenNeeds.post("/requests", authMiddleware, zValidator("json", submitRequestSchema), async (c) => {
  const user = c.get("user")
  const data = c.req.valid("json")

  // Verify kitchen need exists
  const kitchenNeed = await db.query.kitchenNeeds.findFirst({
    where: eq(schema.kitchenNeeds.id, data.kitchenNeedId),
  })

  if (!kitchenNeed) return c.json({ error: "Konten kebutuhan tidak ditemukan" }, 404)

  const [request] = await db.insert(schema.kitchenNeedsRequests).values({
    publicId: user.id,
    kitchenNeedId: data.kitchenNeedId,
    sppgName: data.sppgName,
    contactPerson: data.contactPerson,
    position: data.position,
    phoneNumber: data.phoneNumber,
    details: data.details,
  }).returning()

  return c.json({
    data: request,
    message: "Permintaan berhasil dikirim",
  }, 201)
})

// Authenticated: Get user's own requests
kitchenNeeds.get("/requests/my", authMiddleware, async (c) => {
  const user = c.get("user")

  const data = await db.query.kitchenNeedsRequests.findMany({
    where: eq(schema.kitchenNeedsRequests.publicId, user.id),
    orderBy: [desc(schema.kitchenNeedsRequests.createdAt)],
    with: { kitchenNeed: { columns: { id: true, title: true } } },
  })

  return c.json({
    data: data.map((r) => ({
      id: r.id,
      category: r.kitchenNeed?.title || "Unknown",
      sppgName: r.sppgName,
      status: r.status,
      createdAt: r.createdAt,
    })),
  })
})

// Admin: Get all kitchen needs (including inactive)
kitchenNeeds.get("/admin/all", adminMiddleware, async (c) => {
  const data = await db.query.kitchenNeeds.findMany({
    orderBy: [asc(schema.kitchenNeeds.sortOrder), desc(schema.kitchenNeeds.createdAt)],
  })

  return c.json({ data })
})

// Admin: Upload image
kitchenNeeds.post("/admin/upload", adminMiddleware, async (c) => {
  const formData = await c.req.formData()
  const file = formData.get("file") as File | null

  if (!file) return c.json({ error: "File tidak ditemukan" }, 400)

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Format file tidak didukung" }, 400)
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return c.json({ error: "Ukuran file maksimal 5MB" }, 400)
  }

  const ext = file.name.split(".").pop() || "jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
  const filepath = `./uploads/kitchen-needs/${filename}`

  const buffer = await file.arrayBuffer()
  await Bun.write(filepath, buffer)

  const imageUrl = `/uploads/kitchen-needs/${filename}`
  return c.json({ data: { imageUrl }, message: "Gambar berhasil diunggah" })
})

// Admin: Create kitchen need
const createKitchenNeedSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

kitchenNeeds.post("/admin", adminMiddleware, zValidator("json", createKitchenNeedSchema), async (c) => {
  const data = c.req.valid("json")

  const [item] = await db.insert(schema.kitchenNeeds).values({
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl || null,
    sortOrder: data.sortOrder || 0,
  }).returning()

  return c.json({ data: item, message: "Konten berhasil ditambahkan" }, 201)
})

// Admin: Update kitchen need
kitchenNeeds.patch("/admin/:id", adminMiddleware, zValidator("json", createKitchenNeedSchema.partial().extend({
  isActive: z.boolean().optional(),
})), async (c) => {
  const id = c.req.param("id")
  const data = c.req.valid("json")

  const existing = await db.query.kitchenNeeds.findFirst({
    where: eq(schema.kitchenNeeds.id, id),
  })

  if (!existing) return c.json({ error: "Konten tidak ditemukan" }, 404)

  const [updated] = await db.update(schema.kitchenNeeds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.kitchenNeeds.id, id))
    .returning()

  return c.json({ data: updated, message: "Konten berhasil diperbarui" })
})

// Admin: Delete kitchen need
kitchenNeeds.delete("/admin/:id", adminMiddleware, async (c) => {
  const id = c.req.param("id")

  const existing = await db.query.kitchenNeeds.findFirst({
    where: eq(schema.kitchenNeeds.id, id),
  })

  if (!existing) return c.json({ error: "Konten tidak ditemukan" }, 404)

  await db.delete(schema.kitchenNeeds).where(eq(schema.kitchenNeeds.id, id))

  return c.json({ message: "Konten berhasil dihapus" })
})

// Admin: Get all requests
const requestsQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || "1")),
  limit: z.string().optional().transform((val) => parseInt(val || "20")),
  status: z.enum(["pending", "processed", "completed", "not_found"]).optional(),
})

kitchenNeeds.get("/admin/requests", adminMiddleware, zValidator("query", requestsQuerySchema), async (c) => {
  const { page, limit, status } = c.req.valid("query")
  const offset = (page - 1) * limit

  const whereClause = status ? eq(schema.kitchenNeedsRequests.status, status) : undefined

  const [data, countResult] = await Promise.all([
    db.query.kitchenNeedsRequests.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(schema.kitchenNeedsRequests.createdAt)],
      with: {
        public: { columns: { name: true, email: true } },
        kitchenNeed: { columns: { title: true } },
      },
    }),
    db.select({ count: sql<number>`count(*)` }).from(schema.kitchenNeedsRequests).where(whereClause),
  ])

  const total = Number(countResult[0]?.count || 0)

  return c.json({
    data: data.map((r) => ({
      id: r.id,
      category: r.kitchenNeed?.title || "Unknown",
      sppgName: r.sppgName,
      contactPerson: r.contactPerson,
      position: r.position,
      phoneNumber: r.phoneNumber,
      details: r.details,
      status: r.status,
      adminNotes: r.adminNotes,
      userName: r.public?.name,
      userEmail: r.public?.email,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// Admin: Update request status
const updateRequestStatusSchema = z.object({
  status: z.enum(["pending", "processed", "completed", "not_found"]),
  adminNotes: z.string().max(1000).optional(),
})

kitchenNeeds.patch("/admin/requests/:id", adminMiddleware, zValidator("json", updateRequestStatusSchema), async (c) => {
  const id = c.req.param("id")
  const { status, adminNotes } = c.req.valid("json")

  const existing = await db.query.kitchenNeedsRequests.findFirst({
    where: eq(schema.kitchenNeedsRequests.id, id),
  })

  if (!existing) return c.json({ error: "Permintaan tidak ditemukan" }, 404)

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() }
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes

  const [updated] = await db.update(schema.kitchenNeedsRequests)
    .set(updateData)
    .where(eq(schema.kitchenNeedsRequests.id, id))
    .returning()

  return c.json({ data: updated, message: "Status permintaan berhasil diperbarui" })
})

export default kitchenNeeds
