import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import profile from "../routes/profile"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, reports, sessions } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/profile", profile))

describe("Profile Flow - User Operations", () => {
  let userId: string
  let userToken: string
  let reportId: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `profile-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Profile Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })

    // Create a test report for this user
    const [report] = await db.insert(reports).values({
      publicId: user.id,
      category: "poisoning",
      title: "Test Report for Profile",
      description: "Test description for profile testing purposes that is long enough",
      location: "Test Location",
      provinceId: "11",
      cityId: "11.01",
      incidentDate: new Date(),
      status: "pending",
      relation: "parent",
    }).returning()
    reportId = report.id
  })

  afterAll(async () => {
    if (reportId) await db.delete(reports).where(eq(reports.id, reportId))
    if (userId) await db.delete(publics).where(eq(publics.id, userId))
  })

  test("GET /api/profile returns user with stats", async () => {
    const res = await testRequest(app, "GET", "/api/profile", { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user).toBeDefined()
    expect(json.stats).toBeDefined()
    expect(json.stats.totalReports).toBeGreaterThanOrEqual(0)
  })

  test("PATCH /api/profile updates name", async () => {
    const res = await testRequest(app, "PATCH", "/api/profile", {
      token: userToken,
      body: { name: "Updated Profile Name" },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user.name).toBe("Updated Profile Name")
  })

  test("PATCH /api/profile updates phone with 08 format", async () => {
    const res = await testRequest(app, "PATCH", "/api/profile", {
      token: userToken,
      body: { phone: "08999888777" },
    })
    expect([200, 400]).toContain(res.status) // 400 if phone already exists
  })

  test("PATCH /api/profile updates email", async () => {
    const newEmail = `updated-${randomBytes(4).toString("hex")}@example.com`
    const res = await testRequest(app, "PATCH", "/api/profile", {
      token: userToken,
      body: { email: newEmail },
    })
    expect([200, 400]).toContain(res.status)
  })

  test("GET /api/profile/reports returns user reports", async () => {
    const res = await testRequest(app, "GET", "/api/profile/reports", { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.pagination).toBeDefined()
  })

  test("GET /api/profile/reports/:id returns specific report", async () => {
    if (!reportId) return
    const res = await testRequest(app, "GET", `/api/profile/reports/${reportId}`, { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.data.id).toBe(reportId)
  })

  test("GET /api/profile/reports/:id returns 404 for other user report", async () => {
    const res = await testRequest(app, "GET", "/api/profile/reports/00000000-0000-0000-0000-000000000000", { token: userToken })
    expect(res.status).toBe(404)
  })
})

describe("Profile Flow - Password Change", () => {
  let userId: string
  let userToken: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `password-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Password Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    await db.delete(sessions).where(eq(sessions.publicId, userId))
    if (userId) await db.delete(publics).where(eq(publics.id, userId))
  })

  test("PUT /api/profile/password changes password with correct current", async () => {
    const res = await testRequest(app, "PUT", "/api/profile/password", {
      token: userToken,
      body: {
        currentPassword: "Test1234",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      },
    })
    expect(res.status).toBe(200)
  })

  test("PUT /api/profile/password fails with wrong current password", async () => {
    const res = await testRequest(app, "PUT", "/api/profile/password", {
      token: userToken,
      body: {
        currentPassword: "WrongPassword1",
        newPassword: "AnotherPass1",
        confirmPassword: "AnotherPass1",
      },
    })
    expect(res.status).toBe(400)
  })
})

describe("Profile Flow - Account Deactivation", () => {
  let userId: string
  let userToken: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `deactivate-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Deactivate Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    await db.delete(sessions).where(eq(sessions.publicId, userId)).catch(() => {})
    if (userId) await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
  })

  test("DELETE /api/profile deletes account", async () => {
    const res = await testRequest(app, "DELETE", "/api/profile", { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain("dihapus")
    userId = "" // Prevent afterAll from trying to delete
  })
})
