import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, and, gt } from "drizzle-orm"
import { db, schema } from "../db"
import { hashPassword, verifyPassword } from "../lib/password"
import { signToken } from "../lib/jwt"
import { authMiddleware, adminMiddleware, tempAuthMiddleware, hashToken } from "../middleware/auth"
import { rateLimiter } from "../middleware/rate-limit"
import { randomBytes, createHash } from "crypto"
import { sendEmail, getPasswordResetEmailHtml } from "../lib/email"
import type { AuthUser, AuthAdmin } from "../types"
import { formatPhoneNumber } from "../lib/validation"

type UserVariables = { user: AuthUser }
type AdminVariables = { admin: AuthAdmin }

const auth = new Hono<{ Variables: UserVariables & AdminVariables }>()

const generateToken = () => randomBytes(32).toString("hex")
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Create user session
async function createUserSession(c: any, publicId: string, token: string) {
  try {
    await db.insert(schema.sessions).values({
      publicId,
      token: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      userAgent: c.req.header("user-agent") || null,
      ipAddress: c.req.header("x-forwarded-for") || null,
    })
  } catch {
    // Duplicate token, skip
  }
}

// Create admin session
async function createAdminSession(c: any, adminId: string, token: string) {
  try {
    await db.insert(schema.adminSessions).values({
      adminId,
      token: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      userAgent: c.req.header("user-agent") || null,
      ipAddress: c.req.header("x-forwarded-for") || null,
    })
  } catch {
    // Duplicate token, skip
  }
}

// Validators

const phoneValidator = z.string().min(9, "Nomor telepon minimal 9 digit").max(15, "Nomor telepon maksimal 15 digit")
const emailValidator = z.string().email("Email tidak valid").toLowerCase()
const passwordValidator = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
  .regex(/[a-z]/, "Password harus mengandung minimal 1 huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")

const userSignupSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  passwordConfirmation: z.string(),
  name: z.string().min(1, "Nama wajib diisi").max(255),
  phone: phoneValidator,
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

const userLoginSchema = z.object({
  identifier: z.string().min(1, "Email atau nomor telepon wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

const adminLoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: passwordValidator,
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

const googleCodeSchema = z.object({
  code: z.string().min(1, "Authorization code wajib diisi"),
})

const completePhoneSchema = z.object({
  phone: phoneValidator,
})

// Google OAuth helpers

async function verifyGoogleToken(credential: string): Promise<{ email: string; name: string; sub: string } | null> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    if (!response.ok) return null
    const payload = await response.json()
    if (!payload.email || !payload.sub) return null
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return null
    return { email: payload.email, name: payload.name || payload.email.split("@")[0], sub: payload.sub }
  } catch {
    return null
  }
}

async function exchangeGoogleCode(code: string): Promise<{ email: string; name: string; sub: string } | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return null

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error("[Google OAuth] Token exchange failed:", tokenResponse.status, errorData)
      return null
    }
    const tokens = await tokenResponse.json()

    if (tokens.id_token) {
      return verifyGoogleToken(tokens.id_token)
    }

    if (tokens.access_token) {
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (!userInfoResponse.ok) return null
      const userInfo = await userInfoResponse.json()
      if (!userInfo.email || !userInfo.id) return null
      return { email: userInfo.email, name: userInfo.name || userInfo.email.split("@")[0], sub: userInfo.id }
    }

    return null
  } catch (err) {
    console.error("[Google OAuth] Exchange error:", err)
    return null
  }
}


// Admin auth routes

auth.post("/admin/login", rateLimiter(10, 15 * 60 * 1000), zValidator("json", adminLoginSchema), async (c) => {
  const { email, password } = c.req.valid("json")

  const admin = await db.query.admins.findFirst({
    where: eq(schema.admins.email, email.toLowerCase()),
  })

  if (!admin) return c.json({ error: "Invalid email or password" }, 401)
  if (!admin.isActive) return c.json({ error: "Account has been deactivated" }, 403)

  const isValid = await verifyPassword(password, admin.password)
  if (!isValid) return c.json({ error: "Invalid email or password" }, 401)

  await db.update(schema.admins)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.admins.id, admin.id))

  const token = await signToken({ sub: admin.id, email: admin.email, type: "admin" })
  await createAdminSession(c, admin.id, token)

  return c.json({
    message: "Login successful",
    admin: { id: admin.id, email: admin.email, name: admin.name, adminRole: admin.adminRole },
    token,
  })
})

auth.get("/admin/me", adminMiddleware, async (c) => {
  const authAdmin = c.get("admin")

  const admin = await db.query.admins.findFirst({
    where: eq(schema.admins.id, authAdmin.id),
    columns: { id: true, email: true, name: true, phone: true, adminRole: true, createdAt: true },
  })

  if (!admin) return c.json({ error: "Admin not found" }, 404)

  return c.json({ admin })
})

auth.post("/admin/logout", adminMiddleware, async (c) => {
  const authHeader = c.req.header("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const hashed = hashToken(authHeader.slice(7))
    await db.update(schema.adminSessions)
      .set({ isRevoked: true })
      .where(eq(schema.adminSessions.token, hashed))
  }
  return c.json({ message: "Logout successful" })
})

// Public auth routes

auth.post("/signup", rateLimiter(5, 15 * 60 * 1000), zValidator("json", userSignupSchema), async (c) => {
  const { email, password, name, phone: rawPhone } = c.req.valid("json")

  const formattedPhone = formatPhoneNumber(rawPhone)

  const existingPublic = await db.query.publics.findFirst({
    where: eq(schema.publics.email, email),
  })

  if (existingPublic) {
    if (existingPublic.password) {
      return c.json({ error: "Email already registered" }, 400)
    }
    const hashedPassword = await hashPassword(password)
    await db.update(schema.publics)
      .set({ password: hashedPassword, phone: formattedPhone, updatedAt: new Date() })
      .where(eq(schema.publics.id, existingPublic.id))

    const token = await signToken({ sub: existingPublic.id, email: existingPublic.email, type: "user" })
    await createUserSession(c, existingPublic.id, token)
    return c.json({
      message: "Password added to your account",
      user: { id: existingPublic.id, email: existingPublic.email, phone: formattedPhone, name: existingPublic.name },
      token,
    })
  }

  const existingPhone = await db.query.publics.findFirst({
    where: eq(schema.publics.phone, formattedPhone),
  })
  if (existingPhone) return c.json({ error: "Phone number already registered" }, 400)

  const hashedPassword = await hashPassword(password)

  const [publicUser] = await db.insert(schema.publics).values({
    email,
    phone: formattedPhone,
    password: hashedPassword,
    name,
  }).returning({
    id: schema.publics.id,
    email: schema.publics.email,
    phone: schema.publics.phone,
    name: schema.publics.name,
  })

  const token = await signToken({ sub: publicUser.id, email: publicUser.email, type: "user" })
  await createUserSession(c, publicUser.id, token)

  return c.json({
    message: "Registration successful",
    user: { id: publicUser.id, email: publicUser.email, phone: publicUser.phone, name: publicUser.name },
    token,
  }, 201)
})

auth.post("/login", rateLimiter(10, 15 * 60 * 1000), zValidator("json", userLoginSchema), async (c) => {
  const { identifier, password } = c.req.valid("json")

  let phoneWithPrefix = identifier
  const cleanPhone = identifier.replace(/\D/g, "")
  if (/^\d{9,15}$/.test(cleanPhone)) {
    phoneWithPrefix = formatPhoneNumber(cleanPhone)
  }

  const publicUser = await db.query.publics.findFirst({
    where: eq(schema.publics.email, identifier.toLowerCase()),
  })

  const publicByPhone = publicUser ? null : await db.query.publics.findFirst({
    where: eq(schema.publics.phone, phoneWithPrefix),
  })

  const foundPublic = publicUser || publicByPhone

  if (!foundPublic) return c.json({ error: "Invalid credentials" }, 401)

  if (!foundPublic.password) {
    if (foundPublic.googleId) {
      return c.json({ error: "This account uses Google sign-in. Please login with Google or create a password." }, 403)
    }
    return c.json({ error: "This account has no password" }, 403)
  }

  const isValid = await verifyPassword(password, foundPublic.password)
  if (!isValid) return c.json({ error: "Invalid credentials" }, 401)

  await db.update(schema.publics)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.publics.id, foundPublic.id))

  const token = await signToken({ sub: foundPublic.id, email: foundPublic.email, type: "user" })
  await createUserSession(c, foundPublic.id, token)

  return c.json({
    message: "Login successful",
    user: {
      id: foundPublic.id,
      email: foundPublic.email,
      phone: foundPublic.phone,
      name: foundPublic.name,
      hasPassword: !!foundPublic.password,
      isGoogleLinked: !!foundPublic.googleId,
    },
    token,
  })
})

auth.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user")

  const publicUser = await db.query.publics.findFirst({
    where: eq(schema.publics.id, authUser.id),
    columns: {
      id: true, email: true, phone: true, name: true, password: true,
      signupMethod: true, googleId: true, googleEmail: true,
      reportCount: true, verifiedReportCount: true, createdAt: true,
    },
    with: {
      member: { columns: { id: true, isVerified: true, memberType: true } },
    },
  })

  if (!publicUser) return c.json({ error: "User not found" }, 404)

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
      hasPassword: !!publicUser.password,
      isGoogleLinked: !!publicUser.googleId,
      googleEmail: publicUser.googleEmail,
      isMember: !!publicUser.member,
      memberStatus: publicUser.member?.isVerified ? "verified" : publicUser.member ? "pending" : null,
    },
  })
})

auth.post("/logout", authMiddleware, async (c) => {
  const authHeader = c.req.header("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const hashed = hashToken(authHeader.slice(7))
    await db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.token, hashed))
  }
  return c.json({ message: "Logout successful" })
})

// Google auth routes

auth.post("/google/code", rateLimiter(10, 15 * 60 * 1000), zValidator("json", googleCodeSchema), async (c) => {
  const { code } = c.req.valid("json")

  const googleUser = await exchangeGoogleCode(code)
  if (!googleUser) return c.json({ error: "Invalid Google code" }, 401)

  // Check existing Google link
  const existingByGoogleId = await db.query.publics.findFirst({
    where: eq(schema.publics.googleId, googleUser.sub),
  })

  if (existingByGoogleId) {
    if (!existingByGoogleId.phone) {
      return c.json({
        requiresPhone: true,
        tempToken: await signToken({ sub: existingByGoogleId.id, email: existingByGoogleId.email, type: "user", temp: true }),
        message: "Please complete your phone number",
      })
    }

    await db.update(schema.publics)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.publics.id, existingByGoogleId.id))

    const token = await signToken({ sub: existingByGoogleId.id, email: existingByGoogleId.email, type: "user" })
    await createUserSession(c, existingByGoogleId.id, token)
    return c.json({
      message: "Login successful",
      user: {
        id: existingByGoogleId.id,
        email: existingByGoogleId.email,
        phone: existingByGoogleId.phone,
        name: existingByGoogleId.name,
        hasPassword: !!existingByGoogleId.password,
        isGoogleLinked: true,
      },
      token,
    })
  }

  // Link Google to email
  const existingByEmail = await db.query.publics.findFirst({
    where: eq(schema.publics.email, googleUser.email),
  })

  if (existingByEmail) {
    await db.update(schema.publics)
      .set({ googleId: googleUser.sub, googleEmail: googleUser.email, updatedAt: new Date() })
      .where(eq(schema.publics.id, existingByEmail.id))

    if (!existingByEmail.phone) {
      return c.json({
        requiresPhone: true,
        tempToken: await signToken({ sub: existingByEmail.id, email: existingByEmail.email, type: "user", temp: true }),
        message: "Please complete your phone number",
      })
    }

    await db.update(schema.publics)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.publics.id, existingByEmail.id))

    const token = await signToken({ sub: existingByEmail.id, email: existingByEmail.email, type: "user" })
    await createUserSession(c, existingByEmail.id, token)
    return c.json({
      message: "Google linked to your account",
      user: {
        id: existingByEmail.id,
        email: existingByEmail.email,
        phone: existingByEmail.phone,
        name: existingByEmail.name,
        hasPassword: !!existingByEmail.password,
        isGoogleLinked: true,
      },
      token,
    })
  }

  // New Google account
  const [newPublic] = await db.insert(schema.publics).values({
    email: googleUser.email,
    name: googleUser.name,
    signupMethod: "google",
    googleId: googleUser.sub,
    googleEmail: googleUser.email,
  }).returning({
    id: schema.publics.id,
    email: schema.publics.email,
    name: schema.publics.name,
  })

  return c.json({
    requiresPhone: true,
    tempToken: await signToken({ sub: newPublic.id, email: newPublic.email, type: "user", temp: true }),
    message: "Please complete your phone number",
  }, 201)
})

auth.post("/google/complete-phone", tempAuthMiddleware, zValidator("json", completePhoneSchema), async (c) => {
  const authUser = c.get("user")
  const { phone: rawPhone } = c.req.valid("json")

  const publicUser = await db.query.publics.findFirst({
    where: eq(schema.publics.id, authUser.id),
  })

  if (!publicUser) return c.json({ error: "User not found" }, 404)
  if (!publicUser.googleId) return c.json({ error: "This feature is for Google accounts only" }, 400)
  if (publicUser.phone) return c.json({ error: "Phone number already set" }, 400)

  const formattedPhone = formatPhoneNumber(rawPhone)

  const existingPhone = await db.query.publics.findFirst({
    where: eq(schema.publics.phone, formattedPhone),
  })
  if (existingPhone) return c.json({ error: "Phone number already in use" }, 400)

  const [updatedPublic] = await db.update(schema.publics)
    .set({ phone: formattedPhone, lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.publics.id, publicUser.id))
    .returning({
      id: schema.publics.id,
      email: schema.publics.email,
      phone: schema.publics.phone,
      name: schema.publics.name,
    })

  const token = await signToken({ sub: updatedPublic.id, email: updatedPublic.email, type: "user" })
  await createUserSession(c, updatedPublic.id, token)

  return c.json({
    message: "Phone number added successfully",
    user: { ...updatedPublic, hasPassword: !!publicUser.password, isGoogleLinked: true },
    token,
  })
})

// Password reset routes

auth.post("/forgot-password", rateLimiter(3, 15 * 60 * 1000), zValidator("json", forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid("json")

  const publicUser = await db.query.publics.findFirst({
    where: eq(schema.publics.email, email),
  })

  if (!publicUser) {
    return c.json({ message: "If the email is registered, a reset link will be sent" })
  }

  if (!publicUser.password && publicUser.googleId) {
    return c.json({ message: "If the email is registered, a reset link will be sent" })
  }

  await db.delete(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.publicId, publicUser.id))

  const token = generateToken()
  const hashedResetToken = createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db.insert(schema.passwordResetTokens).values({
    publicId: publicUser.id,
    token: hashedResetToken,
    expiresAt,
  })

  // Determine frontend URL
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",")
  const requestOrigin = c.req.header("origin") || c.req.header("referer")?.replace(/\/$/, "").split("/").slice(0, 3).join("/")
  const frontendUrl = allowedOrigins.includes(requestOrigin || "") ? requestOrigin : allowedOrigins[0]
  const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`

  const emailSent = await sendEmail({
    to: publicUser.email,
    subject: "Atur Ulang Kata Sandi - AMP MBG",
    html: getPasswordResetEmailHtml(publicUser.name, resetUrl),
  })

  if (!emailSent) {
    console.error("[Forgot Password] Failed to send email. Check SMTP configuration.")
  }

  return c.json({
    message: "If the email is registered, a reset link will be sent",
  })
})

auth.get("/verify-reset-token/:token", rateLimiter(5, 15 * 60 * 1000), async (c) => {
  const token = c.req.param("token")
  const hashedToken = createHash("sha256").update(token).digest("hex")

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, hashedToken),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
  })

  if (!resetToken || resetToken.usedAt) {
    return c.json({ error: "Invalid or expired token" }, 400)
  }

  return c.json({ valid: true })
})

auth.post("/reset-password", rateLimiter(5, 15 * 60 * 1000), zValidator("json", resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid("json")
  const hashedToken = createHash("sha256").update(token).digest("hex")

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, hashedToken),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
    with: { public: true },
  })

  if (!resetToken || resetToken.usedAt) {
    return c.json({ error: "Invalid or expired token" }, 400)
  }

  const hashedPassword = await hashPassword(password)

  await Promise.all([
    db.update(schema.publics)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.publics.id, resetToken.publicId)),
    db.update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.id, resetToken.id)),
    db.update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.publicId, resetToken.publicId)),
  ])

  return c.json({ message: "Password reset successful" })
})

// Profile routes

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().min(9).max(12).regex(/^\d{9,12}$/, "Nomor telepon harus 9-12 angka").optional(),
})

auth.put("/profile", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  const authUser = c.get("user")
  const { name, phone } = c.req.valid("json")

  let formattedPhone: string | undefined
  if (phone) {
    formattedPhone = `+62${phone}`
    const existing = await db.query.publics.findFirst({ where: eq(schema.publics.phone, formattedPhone) })
    if (existing && existing.id !== authUser.id) return c.json({ error: "Phone number already in use" }, 400)
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (name !== undefined) updateData.name = name
  if (formattedPhone !== undefined) updateData.phone = formattedPhone

  const [updated] = await db.update(schema.publics)
    .set(updateData)
    .where(eq(schema.publics.id, authUser.id))
    .returning({ id: schema.publics.id, email: schema.publics.email, phone: schema.publics.phone, name: schema.publics.name })

  return c.json({ user: updated, message: "Profile updated successfully" })
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

  const publicUser = await db.query.publics.findFirst({ where: eq(schema.publics.id, authUser.id) })
  if (!publicUser) return c.json({ error: "User not found" }, 404)
  if (!publicUser.password) return c.json({ error: "This account has no password. Use Create Password." }, 400)

  const isValid = await verifyPassword(currentPassword, publicUser.password)
  if (!isValid) return c.json({ error: "Current password is incorrect" }, 400)

  const hashedPassword = await hashPassword(newPassword)
  await db.update(schema.publics).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(schema.publics.id, authUser.id))

  return c.json({ message: "Password changed successfully" })
})

// Create password (Google users)
auth.post("/create-password", authMiddleware, zValidator("json", z.object({
  password: passwordValidator,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
})), async (c) => {
  const authUser = c.get("user")
  const { password } = c.req.valid("json")

  const publicUser = await db.query.publics.findFirst({ where: eq(schema.publics.id, authUser.id) })
  if (!publicUser) return c.json({ error: "User not found" }, 404)
  if (publicUser.password) return c.json({ error: "This account already has a password. Use Change Password." }, 400)

  const hashedPassword = await hashPassword(password)
  await db.update(schema.publics).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(schema.publics.id, authUser.id))

  return c.json({ message: "Password created successfully" })
})

// Member application

const applyMemberSchema = z.object({
  memberType: z.enum(["supplier", "caterer", "school", "government", "foundation", "ngo", "farmer", "other"]),
  organizationName: z.string().min(3, "Nama organisasi minimal 3 karakter").max(255),
  organizationEmail: z.string().email("Email organisasi tidak valid"),
  organizationPhone: z.string().min(9, "Nomor telepon minimal 9 digit").max(15),
  roleInOrganization: z.string().min(10, "Deskripsi peran minimal 10 karakter").max(500),
  organizationMbgRole: z.string().min(10, "Deskripsi peran MBG minimal 10 karakter").max(500),
})

auth.post("/apply-member", authMiddleware, zValidator("json", applyMemberSchema), async (c) => {
  const authUser = c.get("user")
  const data = c.req.valid("json")

  // Check duplicate org
  const existingMember = await db.query.members.findFirst({
    where: and(
      eq(schema.members.publicId, authUser.id),
      eq(schema.members.organizationName, data.organizationName),
      eq(schema.members.organizationEmail, data.organizationEmail)
    ),
  })

  if (existingMember) {
    return c.json({ error: "Organization with same name and email already registered" }, 400)
  }

  await db.insert(schema.members).values({
    publicId: authUser.id,
    memberType: data.memberType,
    organizationName: data.organizationName,
    organizationEmail: data.organizationEmail,
    organizationPhone: data.organizationPhone,
    roleInOrganization: data.roleInOrganization,
    organizationMbgRole: data.organizationMbgRole,
  })

  return c.json({
    message: "Member registration is being processed. Please wait for admin verification.",
  })
})

auth.get("/check", authMiddleware, async (c) => {
  const authUser = c.get("user")
  return c.json({ authenticated: true, user: authUser })
})

export default auth
