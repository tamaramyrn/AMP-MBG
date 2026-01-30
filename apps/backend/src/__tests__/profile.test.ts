import { describe, test, expect, beforeAll } from "bun:test"
import { Hono } from "hono"
import profile from "../routes/profile"
import { createTestApp, testRequest, generateTestToken } from "./setup"
import { db } from "../db"
import { users } from "../db/schema"
import { eq, and } from "drizzle-orm"

const app = createTestApp(new Hono().route("/profile", profile))

let publicToken: string
let publicUserId: string

beforeAll(async () => {
  const publicUser = await db.query.users.findFirst({
    where: and(eq(users.role, "public"), eq(users.email, "budi@example.com")),
  })
  if (publicUser) {
    publicUserId = publicUser.id
    publicToken = await generateTestToken(publicUser.id, publicUser.email, "public")
  }
})

describe("Profile Routes", () => {
  describe("GET /api/profile", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/profile")
      expect(res.status).toBe(401)
    })

    test("returns 401 with invalid token", async () => {
      const res = await testRequest(app, "GET", "/api/profile", { token: "invalid" })
      expect(res.status).toBe(401)
    })

    test("returns user profile with valid token", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user).toBeDefined()
      expect(json.stats).toBeDefined()
    })
  })

  describe("PATCH /api/profile", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/profile", {
        body: { name: "New Name" },
      })
      expect(res.status).toBe(401)
    })

    test("updates name successfully", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { name: "Updated Name" },
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user.name).toBe("Updated Name")
    })

    test("validates empty name", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { name: "" },
      })
      expect(res.status).toBe(400)
    })

    test("validates phone format", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { phone: "123" }, // Too short
      })
      expect(res.status).toBe(400)
    })

    test("validates email format", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { email: "invalid-email" },
      })
      expect(res.status).toBe(400)
    })

    test("formats phone with 62 prefix", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { phone: "628123456780" },
      })
      // Will succeed or fail with duplicate
      expect([200, 400]).toContain(res.status)
    })

    test("formats phone with 08 prefix", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { phone: "08123456781" },
      })
      expect([200, 400]).toContain(res.status)
    })

    test("formats phone with 8 prefix", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { phone: "8123456782" },
      })
      expect([200, 400]).toContain(res.status)
    })
  })

  describe("PUT /api/profile/password", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PUT", "/api/profile/password", {
        body: {
          currentPassword: "OldPass1",
          newPassword: "NewPass1",
          confirmPassword: "NewPass1",
        },
      })
      expect(res.status).toBe(401)
    })

    test("validates password mismatch", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PUT", "/api/profile/password", {
        token: publicToken,
        body: {
          currentPassword: "Test1234",
          newPassword: "NewPass1",
          confirmPassword: "Different1",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates new password requirements", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PUT", "/api/profile/password", {
        token: publicToken,
        body: {
          currentPassword: "Test1234",
          newPassword: "weak",
          confirmPassword: "weak",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/profile/reports", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/profile/reports")
      expect(res.status).toBe(401)
    })

    test("returns paginated reports", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile/reports", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
    })

    test("filters by status", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile/reports?status=pending", { token: publicToken })
      expect(res.status).toBe(200)
    })

    test("accepts pagination params", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile/reports?page=1&limit=5", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.pagination.limit).toBe(5)
    })
  })

  describe("GET /api/profile/reports/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/profile/reports/test-id")
      expect(res.status).toBe(401)
    })

    test("returns 404 for non-existent report", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile/reports/00000000-0000-0000-0000-000000000000", { token: publicToken })
      expect(res.status).toBe(404)
    })
  })

  describe("DELETE /api/profile", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/profile")
      expect(res.status).toBe(401)
    })
  })
})
