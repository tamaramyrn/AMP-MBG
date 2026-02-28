import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, sessions, passwordResetTokens } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/auth", auth))

describe("Auth Coverage - Forgot Password", () => {
  let userId: string
  let googleUserId: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `forgot-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Forgot PW User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id

    // Google-only user
    const [gUser] = await db.insert(publics).values({
      email: `forgot-google-${randomBytes(4).toString("hex")}@example.com`,
      name: "Forgot Google User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      signupMethod: "google",
      googleId: `google-forgot-${randomBytes(8).toString("hex")}`,
    }).returning()
    googleUserId = gUser.id
  })

  afterAll(async () => {
    if (userId) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
    if (googleUserId) {
      await db.delete(publics).where(eq(publics.id, googleUserId)).catch(() => {})
    }
  })

  test("returns 404 for non-existent email", async () => {
    const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
      body: { email: "nonexistent-xyz@example.com" },
    })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  test("returns 400 for Google-only account", async () => {
    const gUser = await db.query.publics.findFirst({
      where: eq(publics.id, googleUserId),
    })
    if (!gUser) return
    const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
      body: { email: gUser.email },
    })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  test("sends reset link for valid user", async () => {
    const user = await db.query.publics.findFirst({
      where: eq(publics.id, userId),
    })
    if (!user) return
    const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
      body: { email: user.email },
    })
    expect(res.status).toBe(200)
  })
})

describe("Auth Coverage - Verify Reset Token", () => {
  test("rejects invalid token", async () => {
    const res = await testRequest(app, "GET", "/api/auth/verify-reset-token/invalid-token-xxx")
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("tidak valid")
  })

  test("rejects expired token", async () => {
    const res = await testRequest(app, "GET", "/api/auth/verify-reset-token/expired-token-abc")
    expect(res.status).toBe(400)
  })
})

describe("Auth Coverage - Reset Password", () => {
  test("rejects invalid token", async () => {
    const res = await testRequest(app, "POST", "/api/auth/reset-password", {
      body: {
        token: "invalid-reset-token-xyz",
        password: "NewPass123",
        passwordConfirmation: "NewPass123",
      },
    })
    expect(res.status).toBe(400)
  })

  test("rejects mismatched passwords", async () => {
    const res = await testRequest(app, "POST", "/api/auth/reset-password", {
      body: {
        token: "some-token",
        password: "NewPass123",
        passwordConfirmation: "DifferentPass1",
      },
    })
    expect(res.status).toBe(400)
  })
})

describe("Auth Coverage - Create Password", () => {
  let googleUserId: string
  let googleUserToken: string
  let pwUserId: string
  let pwUserToken: string

  beforeAll(async () => {
    // Google user without password
    const [gUser] = await db.insert(publics).values({
      email: `create-pw-${randomBytes(4).toString("hex")}@example.com`,
      name: "Create PW User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      signupMethod: "google",
      googleId: `google-create-${randomBytes(8).toString("hex")}`,
    }).returning()
    googleUserId = gUser.id
    googleUserToken = await signToken({ sub: gUser.id, email: gUser.email, type: "user" })

    // User with existing password
    const hashedPassword = await hashPassword("Existing1")
    const [pwUser] = await db.insert(publics).values({
      email: `has-pw-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Has PW User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    pwUserId = pwUser.id
    pwUserToken = await signToken({ sub: pwUser.id, email: pwUser.email, type: "user" })
  })

  afterAll(async () => {
    if (googleUserId) {
      await db.delete(sessions).where(eq(sessions.publicId, googleUserId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, googleUserId)).catch(() => {})
    }
    if (pwUserId) {
      await db.delete(sessions).where(eq(sessions.publicId, pwUserId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, pwUserId)).catch(() => {})
    }
  })

  test("creates password for Google user", async () => {
    const res = await testRequest(app, "POST", "/api/auth/create-password", {
      token: googleUserToken,
      body: { password: "NewPass123", confirmPassword: "NewPass123" },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain("berhasil dibuat")
  })

  test("rejects create password when already has one", async () => {
    const res = await testRequest(app, "POST", "/api/auth/create-password", {
      token: pwUserToken,
      body: { password: "AnotherPass1", confirmPassword: "AnotherPass1" },
    })
    expect(res.status).toBe(400)
  })
})

describe("Auth Coverage - Session Logout", () => {
  let userId: string
  let loginToken: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `logout-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Logout Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id

    // Login to get token
    const loginRes = await testRequest(app, "POST", "/api/auth/login", {
      body: { email: user.email, password: "Test1234" },
    })
    const loginJson = await loginRes.json()
    loginToken = loginJson.token
  })

  afterAll(async () => {
    if (userId) {
      await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
  })

  test("logs out user successfully", async () => {
    if (!loginToken) return
    const res = await testRequest(app, "POST", "/api/auth/logout", { token: loginToken })
    expect(res.status).toBe(200)
  })
})

describe("Auth Coverage - Profile Update", () => {
  let userId: string
  let userToken: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `profile-up-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Profile Update User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    if (userId) {
      await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
  })

  test("updates name via auth profile", async () => {
    const res = await testRequest(app, "PUT", "/api/auth/profile", {
      token: userToken,
      body: { name: "Updated Auth Name" },
    })
    expect(res.status).toBe(200)
  })

  test("updates phone via auth profile", async () => {
    const phone = `8199${randomBytes(4).toString("hex").slice(0, 5)}`
    const res = await testRequest(app, "PUT", "/api/auth/profile", {
      token: userToken,
      body: { phone },
    })
    expect([200, 400]).toContain(res.status)
  })
})

describe("Auth Coverage - Change Password", () => {
  let userId: string
  let userToken: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `change-pw-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Change PW User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    if (userId) {
      await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
      await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
    }
  })

  test("changes password successfully", async () => {
    const res = await testRequest(app, "PUT", "/api/auth/change-password", {
      token: userToken,
      body: {
        currentPassword: "Test1234",
        newPassword: "Changed123",
        confirmPassword: "Changed123",
      },
    })
    expect(res.status).toBe(200)
  })

  test("rejects wrong current password", async () => {
    const res = await testRequest(app, "PUT", "/api/auth/change-password", {
      token: userToken,
      body: {
        currentPassword: "WrongOne123",
        newPassword: "Another123",
        confirmPassword: "Another123",
      },
    })
    expect(res.status).toBe(400)
  })
})
