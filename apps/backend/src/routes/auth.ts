import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, or, and, gt } from "drizzle-orm"
import { db, schema } from "../db"
import { hashPassword, verifyPassword } from "../lib/password"
import { signToken } from "../lib/jwt"
import { authMiddleware } from "../middleware/auth"
import { randomBytes } from "crypto"
import type { AuthUser } from "../types"

type Variables = { user: AuthUser }

const auth = new Hono<{ Variables: Variables }>()

// Generate secure random token
const generateToken = () => randomBytes(32).toString("hex")

// Phone: accepts various formats (62xxx, 08xxx, 8xxx)
const phoneValidator = z.string()
  .min(9, "Nomor telepon minimal 9 digit")
  .max(15, "Nomor telepon maksimal 15 digit")

// Email: must have @ and .
const emailValidator = z.string()
  .email("Email tidak valid")
  .regex(/@.*\./, "Email harus mengandung @ dan .")
  .toLowerCase()

// Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
const passwordValidator = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password harus mengandung minimal 1 simbol")

const signupSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  passwordConfirmation: z.string(),
  name: z.string().min(1, "Nama wajib diisi").max(255),
  phone: phoneValidator,
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

const loginSchema = z.object({
  identifier: z.string().min(1, "Email atau nomor telepon wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
})

auth.post("/signup", zValidator("json", signupSchema), async (c) => {
  const { email, password, name, phone: rawPhone } = c.req.valid("json")

  // Format phone with +62 prefix (handles 62xxx, 08xxx, 8xxx formats)
  let formattedPhone = rawPhone.replace(/\D/g, "")
  if (formattedPhone.startsWith("62")) {
    formattedPhone = "+" + formattedPhone
  } else if (formattedPhone.startsWith("08")) {
    formattedPhone = "+62" + formattedPhone.slice(1)
  } else if (formattedPhone.startsWith("8")) {
    formattedPhone = "+62" + formattedPhone
  } else {
    formattedPhone = "+62" + formattedPhone
  }

  const existingUser = await db.query.users.findFirst({
    where: or(
      eq(schema.users.email, email),
      eq(schema.users.phone, formattedPhone)
    ),
  })

  if (existingUser) {
    if (existingUser.email === email) return c.json({ error: "Email sudah terdaftar" }, 400)
    if (existingUser.phone === formattedPhone) return c.json({ error: "Nomor telepon sudah terdaftar" }, 400)
  }

  const hashedPassword = await hashPassword(password)

  const [user] = await db.insert(schema.users).values({
    email,
    phone: formattedPhone,
    password: hashedPassword,
    name,
    role: "public",
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

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { identifier, password } = c.req.valid("json")

  // Support login by email or phone (various formats)
  let phoneWithPrefix = identifier
  const cleanPhone = identifier.replace(/\D/g, "")
  if (/^\d{9,15}$/.test(cleanPhone)) {
    if (cleanPhone.startsWith("62")) {
      phoneWithPrefix = "+" + cleanPhone
    } else if (cleanPhone.startsWith("08")) {
      phoneWithPrefix = "+62" + cleanPhone.slice(1)
    } else if (cleanPhone.startsWith("8")) {
      phoneWithPrefix = "+62" + cleanPhone
    } else {
      phoneWithPrefix = "+62" + cleanPhone
    }
  }

  const user = await db.query.users.findFirst({
    where: or(
      eq(schema.users.email, identifier.toLowerCase()),
      eq(schema.users.phone, phoneWithPrefix)
    ),
  })

  if (!user) return c.json({ error: "Email/telepon atau password salah" }, 401)

  if (!user.isActive) return c.json({ error: "Akun Anda telah dinonaktifkan" }, 403)

  // Members don't have passwords and cannot login
  if (!user.password) return c.json({ error: "Akun ini tidak dapat melakukan login" }, 403)

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) return c.json({ error: "Email/telepon atau password salah" }, 401)

  await db.update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id))

  const token = await signToken({ sub: user.id, email: user.email, role: user.role })

  return c.json({
    message: "Login berhasil",
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, isVerified: user.isVerified },
    token,
  })
})

auth.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, authUser.id),
    columns: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      isVerified: true,
      reportCount: true,
      verifiedReportCount: true,
      createdAt: true,
    },
  })

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)

  return c.json({ user })
})

// Update profile phone validator
const updatePhoneValidator = z.string()
  .min(9, "Nomor telepon minimal 9 digit")
  .max(12, "Nomor telepon maksimal 12 digit")
  .regex(/^\d{9,12}$/, "Nomor telepon harus 9-12 angka")
  .optional()

auth.put("/profile", authMiddleware, zValidator("json", z.object({
  name: z.string().min(1).max(255).optional(),
  phone: updatePhoneValidator,
})), async (c) => {
  const authUser = c.get("user")
  const { name, phone } = c.req.valid("json")

  let formattedPhone: string | undefined
  if (phone) {
    formattedPhone = `+62${phone}`
    const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, formattedPhone) })
    if (existing && existing.id !== authUser.id) return c.json({ error: "Nomor telepon sudah digunakan" }, 400)
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (name !== undefined) updateData.name = name
  if (formattedPhone !== undefined) updateData.phone = formattedPhone

  const [updated] = await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, authUser.id))
    .returning({ id: schema.users.id, email: schema.users.email, phone: schema.users.phone, name: schema.users.name, role: schema.users.role })

  return c.json({ user: updated, message: "Profil berhasil diperbarui" })
})

auth.put("/change-password", authMiddleware, zValidator("json", z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: passwordValidator,
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

auth.post("/logout", authMiddleware, async (c) => {
  const authHeader = c.req.header("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    // Revoke session if exists
    await db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.token, token))
  }
  return c.json({ message: "Logout berhasil" })
})

// Request password reset
auth.post("/forgot-password", zValidator("json", forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid("json")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  // Always return success to prevent email enumeration
  if (!user) {
    return c.json({ message: "Jika email terdaftar, kami akan mengirimkan link reset password" })
  }

  // Invalidate existing tokens
  await db.delete(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.userId, user.id))

  // Generate new token (expires in 1 hour)
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db.insert(schema.passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  })

  // TODO: Send email with reset link
  // For now, return token in development mode
  const isDev = process.env.NODE_ENV !== "production"

  return c.json({
    message: "Jika email terdaftar, kami akan mengirimkan link reset password",
    ...(isDev && { token, resetUrl: `${process.env.CORS_ORIGIN}/auth/reset-password?token=${token}` }),
  })
})

// Verify reset token (check if valid)
auth.get("/verify-reset-token/:token", async (c) => {
  const token = c.req.param("token")

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, token),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
  })

  if (!resetToken || resetToken.usedAt) {
    return c.json({ error: "Token tidak valid atau sudah kadaluarsa" }, 400)
  }

  return c.json({ valid: true })
})

// Reset password with token
auth.post("/reset-password", zValidator("json", resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid("json")

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, token),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
    with: { user: true },
  })

  if (!resetToken || resetToken.usedAt) {
    return c.json({ error: "Token tidak valid atau sudah kadaluarsa" }, 400)
  }

  const hashedPassword = await hashPassword(password)

  // Update password and mark token as used
  await Promise.all([
    db.update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, resetToken.userId)),
    db.update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.id, resetToken.id)),
    // Revoke all existing sessions
    db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.userId, resetToken.userId)),
  ])

  return c.json({ message: "Password berhasil direset" })
})

// Request email verification (resend)
auth.post("/resend-verification", authMiddleware, async (c) => {
  const authUser = c.get("user")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, authUser.id),
  })

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)
  if (user.isVerified) return c.json({ error: "Email sudah terverifikasi" }, 400)

  // Invalidate existing tokens
  await db.delete(schema.emailVerificationTokens)
    .where(eq(schema.emailVerificationTokens.userId, user.id))

  // Generate new token (expires in 24 hours)
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.insert(schema.emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  })

  // TODO: Send verification email
  const isDev = process.env.NODE_ENV !== "production"

  return c.json({
    message: "Link verifikasi telah dikirim ke email Anda",
    ...(isDev && { token, verifyUrl: `${process.env.CORS_ORIGIN}/auth/verify-email?token=${token}` }),
  })
})

// Verify email
auth.post("/verify-email", zValidator("json", verifyEmailSchema), async (c) => {
  const { token } = c.req.valid("json")

  const verifyToken = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(schema.emailVerificationTokens.token, token),
      gt(schema.emailVerificationTokens.expiresAt, new Date())
    ),
  })

  if (!verifyToken || verifyToken.usedAt) {
    return c.json({ error: "Token tidak valid atau sudah kadaluarsa" }, 400)
  }

  await Promise.all([
    db.update(schema.users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(schema.users.id, verifyToken.userId)),
    db.update(schema.emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.emailVerificationTokens.id, verifyToken.id)),
  ])

  return c.json({ message: "Email berhasil diverifikasi" })
})

// Check authentication status
auth.get("/check", authMiddleware, async (c) => {
  const authUser = c.get("user")
  return c.json({ authenticated: true, user: authUser })
})

// Apply as MBG member (anggota)
const applyMemberSchema = z.object({
  memberType: z.enum(["supplier", "caterer", "school", "government", "foundation", "ngo", "farmer", "other"]),
  organizationName: z.string().min(3, "Nama organisasi minimal 3 karakter").max(255),
  organizationEmail: z.string().email("Email organisasi tidak valid"),
  organizationPhone: z.string().min(9, "Nomor telepon minimal 9 digit").max(15),
  roleDescription: z.string().min(10, "Deskripsi peran minimal 10 karakter").max(500),
  mbgDescription: z.string().min(10, "Deskripsi peran MBG minimal 10 karakter").max(500),
})

auth.post("/apply-member", authMiddleware, zValidator("json", applyMemberSchema), async (c) => {
  const authUser = c.get("user")
  const data = c.req.valid("json")

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, authUser.id),
  })

  if (!user) return c.json({ error: "User tidak ditemukan" }, 404)
  if (user.role !== "public") return c.json({ error: "Hanya pengguna publik yang dapat mendaftar" }, 400)

  await db.update(schema.users)
    .set({
      memberType: data.memberType,
      organizationName: data.organizationName,
      organizationEmail: data.organizationEmail,
      organizationPhone: data.organizationPhone,
      roleInOrganization: data.roleDescription,
      organizationMbgRole: data.mbgDescription,
      appliedAt: new Date(),
      role: "member",
      isVerified: false,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, authUser.id))

  return c.json({
    message: "Pendaftaran sebagai anggota AMP MBG sedang diproses. Silakan tunggu verifikasi dari admin.",
  })
})

export default auth
