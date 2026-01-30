import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { users, passwordResetTokens, emailVerificationTokens } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"

const app = createTestApp(new Hono().route("/auth", auth))

// Generate unique identifiers for test users
const testId = randomBytes(4).toString("hex")
const testEmail = `test-${testId}@example.com`
const testPhone = `81234${testId.slice(0, 6)}`

describe("Auth Flow - Complete Signup and Login", () => {
  let userId: string
  let userToken: string

  afterAll(async () => {
    // Cleanup test user
    if (userId) {
      await db.delete(users).where(eq(users.id, userId))
    }
  })

  test("POST /api/auth/signup creates new user", async () => {
    const res = await testRequest(app, "POST", "/api/auth/signup", {
      body: {
        email: testEmail,
        password: "Test1234",
        passwordConfirmation: "Test1234",
        name: "Test User Flow",
        phone: testPhone,
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.user).toBeDefined()
    expect(json.user.email).toBe(testEmail)
    expect(json.token).toBeDefined()
    userId = json.user.id
    userToken = json.token
  })

  test("POST /api/auth/signup rejects duplicate email", async () => {
    const res = await testRequest(app, "POST", "/api/auth/signup", {
      body: {
        email: testEmail,
        password: "Test1234",
        passwordConfirmation: "Test1234",
        name: "Duplicate User",
        phone: "81234999999",
      },
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("Email")
  })

  test("POST /api/auth/signup rejects duplicate phone", async () => {
    const res = await testRequest(app, "POST", "/api/auth/signup", {
      body: {
        email: "unique@example.com",
        password: "Test1234",
        passwordConfirmation: "Test1234",
        name: "Duplicate Phone",
        phone: testPhone,
      },
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("telepon")
  })

  test("POST /api/auth/login with email succeeds", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: {
        identifier: testEmail,
        password: "Test1234",
      },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user).toBeDefined()
    expect(json.token).toBeDefined()
  })

  test("POST /api/auth/login with phone succeeds", async () => {
    // Use the formatted phone from login response
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: {
        identifier: `+62${testPhone}`,
        password: "Test1234",
      },
    })
    expect(res.status).toBe(200)
  })

  test("POST /api/auth/login with wrong password fails", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: {
        identifier: testEmail,
        password: "WrongPass1",
      },
    })
    expect(res.status).toBe(401)
  })

  test("GET /api/auth/me returns user data", async () => {
    const res = await testRequest(app, "GET", "/api/auth/me", { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user.email).toBe(testEmail)
  })

  test("PUT /api/auth/profile updates user", async () => {
    const res = await testRequest(app, "PUT", "/api/auth/profile", {
      token: userToken,
      body: { name: "Updated Name" },
    })
    expect(res.status).toBe(200)
  })

  test("PUT /api/auth/change-password changes password", async () => {
    const res = await testRequest(app, "PUT", "/api/auth/change-password", {
      token: userToken,
      body: {
        currentPassword: "Test1234",
        newPassword: "NewPass1",
        confirmPassword: "NewPass1",
      },
    })
    expect(res.status).toBe(200)
  })

  test("POST /api/auth/logout revokes session", async () => {
    const res = await testRequest(app, "POST", "/api/auth/logout", { token: userToken })
    expect(res.status).toBe(200)
  })
})

describe("Auth Flow - Password Reset", () => {
  let resetToken: string
  let testUserId: string
  const resetTestEmail = `reset-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    // Create test user for password reset
    const [user] = await db.insert(users).values({
      email: resetTestEmail,
      password: "$argon2id$v=19$m=65536,t=2,p=1$test$test", // Dummy hash
      name: "Reset Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "public",
    }).returning()
    testUserId = user.id
  })

  afterAll(async () => {
    if (testUserId) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, testUserId))
      await db.delete(users).where(eq(users.id, testUserId))
    }
  })

  test("POST /api/auth/forgot-password for existing user", async () => {
    const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
      body: { email: resetTestEmail },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBeDefined()
    // In dev mode, token is returned
    if (json.token) {
      resetToken = json.token
    }
  })

  test("GET /api/auth/verify-reset-token/:token validates token", async () => {
    if (!resetToken) return
    const res = await testRequest(app, "GET", `/api/auth/verify-reset-token/${resetToken}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
  })

  test("POST /api/auth/reset-password resets password", async () => {
    if (!resetToken) return
    const res = await testRequest(app, "POST", "/api/auth/reset-password", {
      body: {
        token: resetToken,
        password: "NewPass123",
        passwordConfirmation: "NewPass123",
      },
    })
    expect(res.status).toBe(200)
  })

  test("POST /api/auth/reset-password fails with used token", async () => {
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
})

describe("Auth Flow - Email Verification", () => {
  let verifyToken: string
  let testUserId: string
  let userToken: string
  const verifyTestEmail = `verify-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    // Create unverified test user
    const [user] = await db.insert(users).values({
      email: verifyTestEmail,
      password: "$argon2id$v=19$m=65536,t=2,p=1$test$test",
      name: "Verify Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "public",
      isVerified: false,
    }).returning()
    testUserId = user.id

    // Create verification token
    verifyToken = randomBytes(32).toString("hex")
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token: verifyToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    // Generate auth token
    const { signToken } = await import("../lib/jwt")
    userToken = await signToken({ sub: user.id, email: verifyTestEmail, role: "public" })
  })

  afterAll(async () => {
    if (testUserId) {
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, testUserId))
      await db.delete(users).where(eq(users.id, testUserId))
    }
  })

  test("POST /api/auth/verify-email verifies email", async () => {
    const res = await testRequest(app, "POST", "/api/auth/verify-email", {
      body: { token: verifyToken },
    })
    expect(res.status).toBe(200)
  })

  test("POST /api/auth/verify-email fails with used token", async () => {
    const res = await testRequest(app, "POST", "/api/auth/verify-email", {
      body: { token: verifyToken },
    })
    expect(res.status).toBe(400)
  })

  test("POST /api/auth/resend-verification for verified user fails", async () => {
    const res = await testRequest(app, "POST", "/api/auth/resend-verification", {
      token: userToken,
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("terverifikasi")
  })
})

describe("Auth Flow - Login Restrictions", () => {
  let inactiveUserId: string
  let memberUserId: string
  const inactiveEmail = `inactive-${randomBytes(4).toString("hex")}@example.com`
  const memberEmail = `member-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    const { hashPassword } = await import("../lib/password")
    const hashedPassword = await hashPassword("Test1234")

    // Create inactive user
    const [inactiveUser] = await db.insert(users).values({
      email: inactiveEmail,
      password: hashedPassword,
      name: "Inactive User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "public",
      isActive: false,
    }).returning()
    inactiveUserId = inactiveUser.id

    // Create member without password
    const [memberUser] = await db.insert(users).values({
      email: memberEmail,
      password: null,
      name: "Member User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "member",
    }).returning()
    memberUserId = memberUser.id
  })

  afterAll(async () => {
    if (inactiveUserId) await db.delete(users).where(eq(users.id, inactiveUserId))
    if (memberUserId) await db.delete(users).where(eq(users.id, memberUserId))
  })

  test("POST /api/auth/login fails for inactive user", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: inactiveEmail, password: "Test1234" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("dinonaktifkan")
  })

  test("POST /api/auth/login fails for member without password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: memberEmail, password: "Test1234" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("tidak dapat melakukan login")
  })
})

describe("Auth Flow - App Type Restrictions", () => {
  let publicUserId: string
  let adminUserId: string
  const publicEmail = `public-${randomBytes(4).toString("hex")}@example.com`
  const adminEmail = `admin-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    const { hashPassword } = await import("../lib/password")
    const hashedPassword = await hashPassword("Test1234")

    const [publicUser] = await db.insert(users).values({
      email: publicEmail,
      password: hashedPassword,
      name: "Public Test",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "public",
    }).returning()
    publicUserId = publicUser.id

    const [adminUser] = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: "Admin Test",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "admin",
    }).returning()
    adminUserId = adminUser.id
  })

  afterAll(async () => {
    if (publicUserId) await db.delete(users).where(eq(users.id, publicUserId))
    if (adminUserId) await db.delete(users).where(eq(users.id, adminUserId))
  })

  test("public user cannot login to admin app", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: publicEmail, password: "Test1234", appType: "admin" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("dashboard admin")
  })

  test("admin user cannot login to public app", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: adminEmail, password: "Test1234", appType: "public" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("aplikasi publik")
  })

  test("public user can login to public app", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: publicEmail, password: "Test1234", appType: "public" },
    })
    expect(res.status).toBe(200)
  })

  test("admin user can login to admin app", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: adminEmail, password: "Test1234", appType: "admin" },
    })
    expect(res.status).toBe(200)
  })
})

describe("Auth Flow - Member Application", () => {
  let publicUserId: string
  let publicToken: string
  const applyEmail = `apply-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    const { hashPassword } = await import("../lib/password")
    const hashedPassword = await hashPassword("Test1234")

    const [user] = await db.insert(users).values({
      email: applyEmail,
      password: hashedPassword,
      name: "Apply Test",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "public",
    }).returning()
    publicUserId = user.id

    const { signToken } = await import("../lib/jwt")
    publicToken = await signToken({ sub: user.id, email: applyEmail, role: "public" })
  })

  afterAll(async () => {
    if (publicUserId) await db.delete(users).where(eq(users.id, publicUserId))
  })

  test("POST /api/auth/apply-member succeeds for public user", async () => {
    const res = await testRequest(app, "POST", "/api/auth/apply-member", {
      token: publicToken,
      body: {
        memberType: "supplier",
        organizationName: "Test Organization",
        organizationEmail: "org@test.com",
        organizationPhone: "08123456789",
        roleDescription: "This is my role description in the organization",
        mbgDescription: "This is how I relate to MBG program",
      },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain("Pendaftaran")
  })
})
