import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, passwordResetTokens, admins } from "../db/schema"
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
      await db.delete(publics).where(eq(publics.id, userId))
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
    const [user] = await db.insert(publics).values({
      email: resetTestEmail,
      password: "$argon2id$v=19$m=65536,t=2,p=1$test$test", // Dummy hash
      name: "Reset Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    testUserId = user.id
  })

  afterAll(async () => {
    if (testUserId) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.publicId, testUserId))
      await db.delete(publics).where(eq(publics.id, testUserId))
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

describe("Auth Flow - Login Restrictions", () => {
  let googleUserId: string
  const googleOnlyEmail = `googleonly-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    // Create user without password (Google-only user)
    const [googleUser] = await db.insert(publics).values({
      email: googleOnlyEmail,
      password: null,
      name: "Google Only User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      signupMethod: "google",
      googleId: `google-${randomBytes(8).toString("hex")}`,
      googleEmail: googleOnlyEmail,
    }).returning()
    googleUserId = googleUser.id
  })

  afterAll(async () => {
    if (googleUserId) await db.delete(publics).where(eq(publics.id, googleUserId))
  })

  test("POST /api/auth/login fails for Google-only user without password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/login", {
      body: { identifier: googleOnlyEmail, password: "Test1234" },
    })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain("Google")
  })
})

describe("Auth Flow - Admin Login", () => {
  let adminId: string
  let adminToken: string
  const adminEmail = `admin-test-${randomBytes(4).toString("hex")}@example.com`

  beforeAll(async () => {
    const { hashPassword } = await import("../lib/password")
    const hashedPassword = await hashPassword("Admin1234")

    const [admin] = await db.insert(admins).values({
      email: adminEmail,
      password: hashedPassword,
      name: "Test Admin",
      adminRole: "validator",
    }).returning()
    adminId = admin.id
  })

  afterAll(async () => {
    if (adminId) await db.delete(admins).where(eq(admins.id, adminId))
  })

  test("POST /api/auth/admin/login succeeds with correct credentials", async () => {
    const res = await testRequest(app, "POST", "/api/auth/admin/login", {
      body: { email: adminEmail, password: "Admin1234" },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.admin).toBeDefined()
    expect(json.admin.email).toBe(adminEmail)
    expect(json.token).toBeDefined()
    adminToken = json.token
  })

  test("POST /api/auth/admin/login fails with wrong password", async () => {
    const res = await testRequest(app, "POST", "/api/auth/admin/login", {
      body: { email: adminEmail, password: "WrongPass1" },
    })
    expect(res.status).toBe(401)
  })

  test("GET /api/auth/admin/me returns admin data", async () => {
    const res = await testRequest(app, "GET", "/api/auth/admin/me", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.admin.email).toBe(adminEmail)
  })

  test("POST /api/auth/admin/logout succeeds", async () => {
    const res = await testRequest(app, "POST", "/api/auth/admin/logout", { token: adminToken })
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

    const [user] = await db.insert(publics).values({
      email: applyEmail,
      password: hashedPassword,
      name: "Apply Test",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    publicUserId = user.id

    const { signToken } = await import("../lib/jwt")
    publicToken = await signToken({ sub: user.id, email: applyEmail, type: "user" })
  })

  afterAll(async () => {
    if (publicUserId) await db.delete(publics).where(eq(publics.id, publicUserId))
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
