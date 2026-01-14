import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, or } from "drizzle-orm"
import { db, schema } from "../db"
import { hashPassword, verifyPassword } from "../lib/password"
import { signToken } from "../lib/jwt"
import { authMiddleware } from "../middleware/auth"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const auth = new Hono<{ Variables: Variables }>()

const signupSchema = z.object({
  nik: z.string().length(16, "NIK harus 16 digit"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  passwordConfirmation: z.string(),
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(10).max(15).optional(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

const signupMemberSchema = z.object({
  nik: z.string().length(16, "NIK harus 16 digit"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  passwordConfirmation: z.string(),
  name: z.string().min(1, "Nama wajib diisi"),
  organization: z.enum(["supplier", "caterer", "school", "government", "ngo", "other"]),
  phone: z.string().min(10).max(15).optional(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

const loginSchema = z.object({
  identifier: z.string().min(1, "Email atau nomor telepon wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const { nik, email, password, name, phone } = c.req.valid("json")

  const conditions = [eq(schema.users.nik, nik), eq(schema.users.email, email)]
  if (phone) conditions.push(eq(schema.users.phone, phone))

  const existingUser = await db.query.users.findFirst({
    where: or(...conditions),
  })

  if (existingUser) {
    if (existingUser.nik === nik) return c.json({ error: "NIK sudah terdaftar" }, 400)
    if (existingUser.email === email) return c.json({ error: "Email sudah terdaftar" }, 400)
    if (phone && existingUser.phone === phone) return c.json({ error: "Nomor telepon sudah terdaftar" }, 400)
  }

  const hashedPassword = await hashPassword(password)

  const [user] = await db.insert(schema.users).values({
    nik,
    email,
    phone: phone || null,
    password: hashedPassword,
    name,
    role: "user",
  }).returning({
    id: schema.users.id,
    email: schema.users.email,
    phone: schema.users.phone,
    name: schema.users.name,
    role: schema.users.role,
  })

  const token = await signToken({ sub: user.id, email: user.email, role: user.role })

  return c.json({
    message: "Registrasi berhasil",
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role },
    token,
  }, 201)
})

auth.post("/signup-member", zValidator("json", signupMemberSchema), async (c) => {
  const { nik, email, password, name, organization, phone } = c.req.valid("json")

  const conditions = [eq(schema.users.nik, nik), eq(schema.users.email, email)]
  if (phone) conditions.push(eq(schema.users.phone, phone))

  const existingUser = await db.query.users.findFirst({
    where: or(...conditions),
  })

  if (existingUser) {
    if (existingUser.nik === nik) return c.json({ error: "NIK sudah terdaftar" }, 400)
    if (existingUser.email === email) return c.json({ error: "Email sudah terdaftar" }, 400)
    if (phone && existingUser.phone === phone) return c.json({ error: "Nomor telepon sudah terdaftar" }, 400)
  }

  const hashedPassword = await hashPassword(password)

  const [user] = await db.insert(schema.users).values({
    nik,
    email,
    phone: phone || null,
    password: hashedPassword,
    name,
    role: "member",
    organization,
  }).returning({
    id: schema.users.id,
    email: schema.users.email,
    phone: schema.users.phone,
    name: schema.users.name,
    role: schema.users.role,
    organization: schema.users.organization,
  })

  const token = await signToken({ sub: user.id, email: user.email, role: user.role })

  return c.json({
    message: "Registrasi anggota berhasil",
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, organization: user.organization },
    token,
  }, 201)
})

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { identifier, password } = c.req.valid("json")

  const user = await db.query.users.findFirst({
    where: or(eq(schema.users.email, identifier), eq(schema.users.phone, identifier)),
  })

  if (!user) return c.json({ error: "Email/telepon atau password salah" }, 401)

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return c.json({ error: "Email/telepon atau password salah" }, 401)

  const token = await signToken({ sub: user.id, email: user.email, role: user.role })

  return c.json({
    message: "Login berhasil",
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, organization: user.organization },
    token,
  })
})

auth.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, authUser.id),
    columns: { id: true, nik: true, email: true, phone: true, name: true, role: true, organization: true, isVerified: true, createdAt: true },
  })

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  return c.json({ user })
})

auth.put("/profile", authMiddleware, zValidator("json", z.object({
  name: z.string().optional(),
  phone: z.string().min(10).max(15).optional(),
})), async (c) => {
  const authUser = c.get("user")
  const { name, phone } = c.req.valid("json")

  if (phone) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, phone) })
    if (existing && existing.id !== authUser.id) return c.json({ error: "Nomor telepon sudah digunakan" }, 400)
  }

  const [updated] = await db.update(schema.users)
    .set({ ...(name !== undefined && { name }), ...(phone !== undefined && { phone }), updatedAt: new Date() })
    .where(eq(schema.users.id, authUser.id))
    .returning({ id: schema.users.id, email: schema.users.email, phone: schema.users.phone, name: schema.users.name, role: schema.users.role })

  return c.json({ user: updated })
})

auth.put("/change-password", authMiddleware, zValidator("json", z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru tidak cocok",
  path: ["confirmPassword"],
})), async (c) => {
  const authUser = c.get("user")
  const { currentPassword, newPassword } = c.req.valid("json")

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, authUser.id) })
  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) return c.json({ error: "Password saat ini salah" }, 400)

  const hashedPassword = await hashPassword(newPassword)
  await db.update(schema.users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(schema.users.id, authUser.id))

  return c.json({ message: "Password berhasil diubah" })
})

export default auth
