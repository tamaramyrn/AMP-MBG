import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics } from "../db/schema"
import { eq } from "drizzle-orm"
import { signToken } from "../lib/jwt"
import { randomBytes } from "crypto"

const app = createTestApp(new Hono().route("/auth", auth))

describe("Google OAuth", () => {
  let testUserId: string
  let googleUserId: string

  beforeAll(async () => {
    // Create a user without Google (for complete-phone test)
    const [credUser] = await db.insert(publics).values({
      email: `cred-${randomBytes(4).toString("hex")}@example.com`,
      password: "$argon2id$v=19$m=65536,t=2,p=1$test$test",
      name: "Credential User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    testUserId = credUser.id

    // Create a user with Google auth (googleId directly in publics)
    const [gUser] = await db.insert(publics).values({
      email: `google-${randomBytes(4).toString("hex")}@example.com`,
      password: null,
      name: "Google User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      signupMethod: "google",
      googleId: `google-${randomBytes(8).toString("hex")}`,
      googleEmail: `google-${randomBytes(4).toString("hex")}@example.com`,
    }).returning()
    googleUserId = gUser.id
  })

  afterAll(async () => {
    if (googleUserId) {
      await db.delete(publics).where(eq(publics.id, googleUserId)).catch(() => {})
    }
    if (testUserId) {
      await db.delete(publics).where(eq(publics.id, testUserId)).catch(() => {})
    }
  })

  describe("POST /api/auth/google/code", () => {
    test("returns 401 with invalid code", async () => {
      const res = await testRequest(app, "POST", "/api/auth/google/code", {
        body: { code: "invalid-code" },
      })
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toContain("Google")
    })

    test("returns 400 without code", async () => {
      const res = await testRequest(app, "POST", "/api/auth/google/code", {
        body: {},
      })
      expect(res.status).toBe(400)
    })
  })

  describe("POST /api/auth/google/complete-phone", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/auth/google/complete-phone", {
        body: { phone: "08123456789" },
      })
      expect(res.status).toBe(401)
    })

    test("returns 400 for non-Google user", async () => {
      const credUser = await db.query.publics.findFirst({
        where: eq(publics.id, testUserId),
      })
      if (!credUser) return

      const token = await signToken({ sub: credUser.id, email: credUser.email, type: "user" })
      const res = await testRequest(app, "POST", "/api/auth/google/complete-phone", {
        token,
        body: { phone: "08123456789" },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("POST /api/auth/login - Google user restriction", () => {
    test("prevents Google-only user from password login", async () => {
      const googleUser = await db.query.publics.findFirst({
        where: eq(publics.id, googleUserId),
      })

      if (!googleUser) return

      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: {
          identifier: googleUser.email,
          password: "Test1234",
        },
      })

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toContain("Google")
    })
  })
})
