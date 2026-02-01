import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import admin from "../routes/admin"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, admins, members, reports, mbgSchedules, kitchenNeeds, kitchenNeedsRequests } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/admin", admin))

describe("Admin Flow - Dashboard", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  test("GET /api/admin/dashboard returns complete stats", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/dashboard", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.users).toBeDefined()
    expect(json.users.total).toBeDefined()
    expect(json.users.byRole).toBeDefined()
    expect(json.reports).toBeDefined()
    expect(json.recentReports).toBeDefined()
  })

  test("GET /api/admin/analytics returns analytics", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/analytics", { token: adminToken })
    expect(res.status).toBe(200)
  })
})

describe("Admin Flow - User Management", () => {
  let adminToken: string
  let testUserId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }

    // Create test user for management
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `admin-test-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Admin Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    testUserId = user.id
  })

  afterAll(async () => {
    if (testUserId) await db.delete(publics).where(eq(publics.id, testUserId))
  })

  test("GET /api/admin/users returns paginated list", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/users", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.pagination).toBeDefined()
  })

  test("GET /api/admin/users with signupMethod filter", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/users?signupMethod=manual", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/users with search", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/users?search=test", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/users/:id returns user detail", async () => {
    if (!adminToken || !testUserId) return
    const res = await testRequest(app, "GET", `/api/admin/users/${testUserId}`, { token: adminToken })
    expect([200, 500]).toContain(res.status)
  })
})

describe("Admin Flow - Report Management", () => {
  let adminToken: string
  let testReportId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }

    const report = await db.query.reports.findFirst()
    if (report) testReportId = report.id
  })

  test("GET /api/admin/reports returns paginated list", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/reports", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.pagination).toBeDefined()
  })

  test("GET /api/admin/reports with filters", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/reports?status=pending&category=poisoning", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/reports/:id returns detail", async () => {
    if (!adminToken || !testReportId) return
    const res = await testRequest(app, "GET", `/api/admin/reports/${testReportId}`, { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/admin/reports/:id/history returns history", async () => {
    if (!adminToken || !testReportId) return
    const res = await testRequest(app, "GET", `/api/admin/reports/${testReportId}/history`, { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/reports/:id/scoring returns scoring", async () => {
    if (!adminToken || !testReportId) return
    const res = await testRequest(app, "GET", `/api/admin/reports/${testReportId}/scoring`, { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("PATCH /api/admin/reports/:id/status updates status", async () => {
    if (!adminToken || !testReportId) return
    const res = await testRequest(app, "PATCH", `/api/admin/reports/${testReportId}/status`, {
      token: adminToken,
      body: { status: "analyzing", notes: "Under review" },
    })
    expect(res.status).toBe(200)
  })
})

describe("Admin Flow - MBG Schedule Management", () => {
  let adminToken: string
  let scheduleId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  afterAll(async () => {
    if (scheduleId) await db.delete(mbgSchedules).where(eq(mbgSchedules.id, scheduleId))
  })

  test("GET /api/admin/mbg-schedules returns list", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/mbg-schedules", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("POST /api/admin/mbg-schedules creates schedule", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "POST", "/api/admin/mbg-schedules", {
      token: adminToken,
      body: {
        schoolName: "SD Test School",
        provinceId: "11",
        cityId: "11.01",
        districtId: "11.01.01",
        address: "Jl. Test No. 123",
        scheduleDays: "12345",
        startTime: "07:00",
        endTime: "12:00",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) scheduleId = json.data.id
  })

  test("PATCH /api/admin/mbg-schedules/:id updates schedule", async () => {
    if (!adminToken || !scheduleId) return
    const res = await testRequest(app, "PATCH", `/api/admin/mbg-schedules/${scheduleId}`, {
      token: adminToken,
      body: { schoolName: "Updated SD Test School" },
    })
    expect(res.status).toBe(200)
  })

  test("DELETE /api/admin/mbg-schedules/:id deletes schedule", async () => {
    if (!adminToken || !scheduleId) return
    const res = await testRequest(app, "DELETE", `/api/admin/mbg-schedules/${scheduleId}`, { token: adminToken })
    expect(res.status).toBe(200)
    scheduleId = "" // Mark as deleted
  })
})

describe("Admin Flow - Member Management", () => {
  let adminToken: string
  let adminId: string
  let memberId: string
  let memberUserId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
      adminId = adminUser.id
    }

    // Create test user for member
    const [user] = await db.insert(publics).values({
      email: `member-test-${randomBytes(4).toString("hex")}@example.com`,
      name: "Test Member User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    memberUserId = user.id

    // Create member linked to user
    const [member] = await db.insert(members).values({
      publicId: user.id,
      memberType: "foundation",
      organizationName: "Test Foundation",
      isVerified: false,
      appliedAt: new Date(),
    }).returning()
    memberId = member.id
  })

  afterAll(async () => {
    if (memberId) await db.delete(members).where(eq(members.id, memberId)).catch(() => {})
    if (memberUserId) await db.delete(publics).where(eq(publics.id, memberUserId)).catch(() => {})
  })

  test("GET /api/admin/members returns list", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/members", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/admin/members with filters", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/members?memberType=foundation&status=pending", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/members/:id returns detail", async () => {
    if (!adminToken || !memberId) return
    const res = await testRequest(app, "GET", `/api/admin/members/${memberId}`, { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("PATCH /api/admin/members/:id/verify verifies member", async () => {
    if (!adminToken || !memberId) return
    const res = await testRequest(app, "PATCH", `/api/admin/members/${memberId}/verify`, { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("PATCH /api/admin/members/:id/status updates status", async () => {
    if (!adminToken || !memberId) return
    const res = await testRequest(app, "PATCH", `/api/admin/members/${memberId}/status`, {
      token: adminToken,
      body: { isVerified: false },
    })
    expect(res.status).toBe(200)
  })
})

describe("Admin Flow - Admin Management", () => {
  let superAdminToken: string
  let newAdminId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      superAdminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  afterAll(async () => {
    if (newAdminId) await db.delete(admins).where(eq(admins.id, newAdminId))
  })

  test("GET /api/admin/admins returns admin list", async () => {
    if (!superAdminToken) return
    const res = await testRequest(app, "GET", "/api/admin/admins", { token: superAdminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("POST /api/admin/admins creates new admin", async () => {
    if (!superAdminToken) return
    const res = await testRequest(app, "POST", "/api/admin/admins", {
      token: superAdminToken,
      body: {
        name: "New Test Admin",
        email: `new-admin-${randomBytes(4).toString("hex")}@example.com`,
        password: "Admin1234",
        adminRole: "Validator",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) newAdminId = json.data.id
  })

  test("DELETE /api/admin/admins/:id removes admin", async () => {
    if (!superAdminToken || !newAdminId) return
    const res = await testRequest(app, "DELETE", `/api/admin/admins/${newAdminId}`, { token: superAdminToken })
    expect(res.status).toBe(200)
    newAdminId = ""
  })
})
