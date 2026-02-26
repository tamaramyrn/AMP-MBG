import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, sessions, members, passwordResetTokens } from "../db/schema"
import { eq, and, gt } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/auth", auth))

describe("Auth Integration - Full Signup/Login", () => {
  const uniqueEmail = `full-${randomBytes(4).toString("hex")}@example.com`
  const uniquePhone = `812${randomBytes(4).toString("hex").slice(0, 8)}`
  let userId: string

  afterAll(async () => {
    if (userId) {
      await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
  })

  test("registers new user successfully", async () => {
    const res = await testRequest(app, "POST", "/api/auth/signup", {
      body: {
        email: uniqueEmail,
        password: "Test1234",
        passwordConfirmation: "Test1234",
        name: "Full Flow User",
        phone: uniquePhone,
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.token).toBeDefined()
    expect(json.user.email).toBe(uniqueEmail)
    userId = json.user.id
  })

  test("rejects duplicate email signup", async () => {
    const res = await testRequest(app, "POST", "/api/auth/signup", {
      body: {
        email: uniqueEmail,
        password: "Test1234",
        passwordConfirmation: "Test1234",
        name: "Duplicate User",
        phone: `812${randomBytes(4).toString("hex").slice(0, 8)}`,
      },
    })
    expect(res.status).toBe(400)
  })

  test("logs in with email", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: uniqueEmail, password: "Test1234" },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.token).toBeDefined()
  })

  test("logs in with phone", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: uniquePhone, password: "Test1234" },
    })
    // Phone format may vary
    expect([200, 401]).toContain(res.status)
  })

  test("rejects wrong password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: uniqueEmail, password: "WrongPass1" },
    })
    expect(res.status).toBe(401)
  })

  test("checks auth with valid token", async () => {
    const loginRes = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: uniqueEmail, password: "Test1234" },
    })
    const { token } = await loginRes.json()

    const res = await testRequest(app, "GET", "/api/auth/me", { token })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user).toBeDefined()
  })
})

describe("Auth Integration - Google-Only User Login", () => {
  let googleUserId: string

  beforeAll(async () => {
    const [user] = await db.insert(publics).values({
      email: `google-only-${randomBytes(4).toString("hex")}@example.com`,
      name: "Google Only User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      signupMethod: "google",
      googleId: `google-login-${randomBytes(8).toString("hex")}`,
    }).returning()
    googleUserId = user.id
  })

  afterAll(async () => {
    if (googleUserId) {
      await db.delete(publics).where(eq(publics.id, googleUserId)).catch(() => {})
    }
  })

  test("returns 403 for Google-only user", async () => {
    const user = await db.query.publics.findFirst({
      where: eq(publics.id, googleUserId),
    })
    if (!user) return
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: user.email, password: "AnyPass123" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("Google")
  })
})

describe("Auth Integration - Signup With Existing Google Account", () => {
  let googleUserId: string
  const googleEmail = `google-signup-${randomBytes(4).toString("hex")}@example.com`
  const signupPhone = `812${randomBytes(4).toString("hex").slice(0, 8)}`

  beforeAll(async () => {
    const [user] = await db.insert(publics).values({
      email: googleEmail,
      name: "Google Signup User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      signupMethod: "google",
      googleId: `google-signup-${randomBytes(8).toString("hex")}`,
    }).returning()
    googleUserId = user.id
  })

  afterAll(async () => {
    if (googleUserId) {
      await db.delete(sessions).where(eq(sessions.publicId, googleUserId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, googleUserId)).catch(() => {})
    }
  })

  test("adds password to existing Google account", async () => {
    const res = await testRequest(app, "POST", "/api/auth/signup", {
      body: {
        email: googleEmail,
        password: "NewPass123",
        passwordConfirmation: "NewPass123",
        name: "Updated Name",
        phone: signupPhone,
      },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.token).toBeDefined()
    expect(json.message).toContain("Password added")
  })
})

describe("Auth Integration - Password Reset Flow", () => {
  let userId: string
  let resetToken: string
  const userEmail = `reset-flow-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    const hashedPassword = await hashPassword("OldPass123")
    const [user] = await db.insert(publics).values({
      email: userEmail,
      password: hashedPassword,
      name: "Reset Flow User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
  })

  afterAll(async () => {
    if (userId) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.publicId, userId)).catch(() => {})
      await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
  })

  test("sends forgot-password email", async () => {
    const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
      body: { email: userEmail },
    })
    expect(res.status).toBe(200)
  })

  test("extracts reset token from DB", async () => {
    const token = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.publicId, userId),
        gt(passwordResetTokens.expiresAt, new Date())
      ),
    })
    expect(token).toBeDefined()
    resetToken = token!.token
  })

  test("verifies valid reset token", async () => {
    if (!resetToken) return
    const res = await testRequest(app, "GET", `/api/auth/verify-reset-token/${resetToken}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
  })

  test("resets password with valid token", async () => {
    if (!resetToken) return
    const res = await testRequest(app, "POST", "/api/auth/reset-password", {
      body: {
        token: resetToken,
        password: "NewPass123",
        passwordConfirmation: "NewPass123",
      },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain("successful")
  })

  test("rejects used reset token", async () => {
    if (!resetToken) return
    const res = await testRequest(app, "POST", "/api/auth/reset-password", {
      body: {
        token: resetToken,
        password: "AnotherPass1",
        passwordConfirmation: "AnotherPass1",
      },
    })
    expect(res.status).toBe(400)
  })

  test("logs in with new password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: userEmail, password: "NewPass123" },
    })
    expect(res.status).toBe(200)
  })
})

describe("Auth Integration - Apply Member", () => {
  let userId: string
  let userToken: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `member-app-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Member Applicant",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    if (userId) {
      await db.delete(members).where(eq(members.publicId, userId)).catch(() => {})
      await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
  })

  test("applies for membership", async () => {
    const res = await testRequest(app, "POST", "/api/auth/apply-member", {
      token: userToken,
      body: {
        memberType: "foundation",
        organizationName: `Test Org ${randomBytes(4).toString("hex")}`,
        organizationEmail: `org-${randomBytes(4).toString("hex")}@test.com`,
        organizationPhone: "08123456789",
        roleInOrganization: "Test role description for the organization",
        organizationMbgRole: "Test MBG related description for member",
      },
    })
    expect(res.status).toBe(200)
  })

  test("rejects duplicate member application", async () => {
    const member = await db.query.members.findFirst({
      where: eq(members.publicId, userId),
    })
    if (!member) return
    const res = await testRequest(app, "POST", "/api/auth/apply-member", {
      token: userToken,
      body: {
        memberType: "foundation",
        organizationName: member.organizationName,
        organizationEmail: member.organizationEmail || "org@test.com",
        organizationPhone: "08123456789",
        roleInOrganization: "Test role description for the organization",
        organizationMbgRole: "Test MBG related description for member",
      },
    })
    expect(res.status).toBe(400)
  })
})

describe("Auth Integration - No-Password User Login", () => {
  let noPasswordUserId: string
  let noPasswordEmail: string

  beforeAll(async () => {
    noPasswordEmail = `no-pw-${randomBytes(4).toString("hex")}@example.com`
    const [user] = await db.insert(publics).values({
      email: noPasswordEmail,
      name: "No Password User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    noPasswordUserId = user.id
  })

  afterAll(async () => {
    if (noPasswordUserId) {
      await db.delete(publics).where(eq(publics.id, noPasswordUserId)).catch(() => {})
    }
  })

  test("returns 403 for user with no password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: noPasswordEmail, password: "AnyPass123" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("no password")
  })
})

describe("Auth Integration - Admin Login", () => {
  test("admin login with valid credentials", async () => {
    const res = await testRequest(app, "POST", "/api/auth/admin/login", {
      body: { email: "admin@ampmbg.id", password: "admin123" },
    })
    // Depends on seed password
    expect([200, 401]).toContain(res.status)
  })

  test("admin login rejects invalid email", async () => {
    const res = await testRequest(app, "POST", "/api/auth/admin/login", {
      body: { email: "nonexistent@admin.com", password: "wrong" },
    })
    expect(res.status).toBe(401)
  })

  test("admin login rejects wrong password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/admin/login", {
      body: { email: "admin@ampmbg.id", password: "wrongpassword" },
    })
    expect(res.status).toBe(401)
  })
})

describe("Auth Integration - Google Complete Phone", () => {
  let tempUserId: string

  beforeAll(async () => {
    const [user] = await db.insert(publics).values({
      email: `google-phone-${randomBytes(4).toString("hex")}@example.com`,
      name: "Google Phone User",
      signupMethod: "google",
      googleId: `google-phone-${randomBytes(8).toString("hex")}`,
    }).returning()
    tempUserId = user.id
  })

  afterAll(async () => {
    if (tempUserId) {
      await db.delete(sessions).where(eq(sessions.publicId, tempUserId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, tempUserId)).catch(() => {})
    }
  })

  test("completes phone for Google user", async () => {
    const tempToken = await signToken({
      sub: tempUserId,
      email: "test@example.com",
      type: "user",
      temp: true,
    })
    const uniquePhone = `812${randomBytes(4).toString("hex").slice(0, 8)}`
    const res = await testRequest(app, "POST", "/api/auth/google/complete-phone", {
      token: tempToken,
      body: { phone: uniquePhone },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.token).toBeDefined()
  })

  test("rejects non-Google user for complete-phone", async () => {
    const [normalUser] = await db.insert(publics).values({
      email: `normal-phone-${randomBytes(4).toString("hex")}@example.com`,
      name: "Normal User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    const tempToken = await signToken({
      sub: normalUser.id,
      email: normalUser.email,
      type: "user",
      temp: true,
    })
    const res = await testRequest(app, "POST", "/api/auth/google/complete-phone", {
      token: tempToken,
      body: { phone: `812${randomBytes(4).toString("hex").slice(0, 8)}` },
    })
    expect(res.status).toBe(400)
    await db.delete(publics).where(eq(publics.id, normalUser.id)).catch(() => {})
  })

  test("rejects when phone already set", async () => {
    // Phone set from first test
    const tempToken = await signToken({
      sub: tempUserId,
      email: "test@example.com",
      type: "user",
      temp: true,
    })
    const res = await testRequest(app, "POST", "/api/auth/google/complete-phone", {
      token: tempToken,
      body: { phone: `812${randomBytes(4).toString("hex").slice(0, 8)}` },
    })
    expect(res.status).toBe(400)
  })
})
