import { describe, test, expect, beforeAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import profile from "../routes/profile"
import reports from "../routes/reports"
import kitchenNeeds from "../routes/kitchen-needs"
import admin from "../routes/admin"
import locations from "../routes/locations"
import { createTestApp, testRequest, generateTestToken } from "./setup"
import { db } from "../db"
import { users, reports as reportsTable, kitchenNeeds as kitchenNeedsTable, kitchenNeedsRequests } from "../db/schema"
import { eq, and } from "drizzle-orm"

// Create app with all routes
const createFullApp = () => {
  const app = new Hono()
  app.route("/auth", auth)
  app.route("/profile", profile)
  app.route("/reports", reports)
  app.route("/kitchen-needs", kitchenNeeds)
  app.route("/admin", admin)
  app.route("/locations", locations)
  return createTestApp(app)
}

const app = createFullApp()

// Test users from seed data
let publicUserId: string
let adminUserId: string
let publicToken: string
let adminToken: string
let testReportId: string
let testKitchenNeedId: string

beforeAll(async () => {
  // Get seeded public user
  const publicUser = await db.query.users.findFirst({
    where: and(eq(users.role, "public"), eq(users.email, "budi@example.com")),
  })
  if (publicUser) {
    publicUserId = publicUser.id
    publicToken = await generateTestToken(publicUser.id, publicUser.email, "public")
  }

  // Get seeded admin user
  const adminUser = await db.query.users.findFirst({
    where: and(eq(users.role, "admin"), eq(users.email, "admin@ampmbg.id")),
  })
  if (adminUser) {
    adminUserId = adminUser.id
    adminToken = await generateTestToken(adminUser.id, adminUser.email, "admin")
  }

  // Get test report
  const report = await db.query.reports.findFirst()
  if (report) testReportId = report.id

  // Get test kitchen need
  const kitchenNeed = await db.query.kitchenNeeds.findFirst()
  if (kitchenNeed) testKitchenNeedId = kitchenNeed.id
})

describe("Integration Tests - Authenticated Flows", () => {
  describe("Auth Routes with Valid Token", () => {
    test("GET /api/auth/me returns user profile", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/auth/me", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user).toBeDefined()
      expect(json.user.email).toBe("budi@example.com")
    })

    test("GET /api/auth/check returns authenticated status", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/auth/check", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.authenticated).toBe(true)
    })
  })

  describe("Profile Routes with Valid Token", () => {
    test("GET /api/profile returns user data", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user).toBeDefined()
    })

    test("GET /api/profile/reports returns user reports", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/profile/reports", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
    })

    test("PATCH /api/profile validates input", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PATCH", "/api/profile", {
        token: publicToken,
        body: { name: "" },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("Reports Routes with Valid Token", () => {
    test("GET /api/reports returns paginated list", async () => {
      const res = await testRequest(app, "GET", "/api/reports")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.length).toBeGreaterThan(0)
    })

    test("GET /api/reports/:id returns report detail", async () => {
      if (!testReportId) return
      const res = await testRequest(app, "GET", `/api/reports/${testReportId}`)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(json.data.id).toBe(testReportId)
    })

    test("GET /api/reports/my/reports requires auth", async () => {
      const res = await testRequest(app, "GET", "/api/reports/my/reports")
      expect(res.status).toBe(401)
    })

    test("GET /api/reports/my/reports returns user reports with auth", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/reports/my/reports", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("POST /api/reports validates category", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          category: "invalid_category",
          title: "Test",
          description: "Test description that is long enough for validation",
          location: "Test location",
          provinceId: "32",
          cityId: "3201",
          incidentDate: new Date().toISOString(),
          relation: "parent",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("Kitchen Needs Routes with Valid Token", () => {
    test("GET /api/kitchen-needs returns active items", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.length).toBeGreaterThan(0)
    })

    test("GET /api/kitchen-needs/:id returns item detail", async () => {
      if (!testKitchenNeedId) return
      const res = await testRequest(app, "GET", `/api/kitchen-needs/${testKitchenNeedId}`)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(json.data.id).toBe(testKitchenNeedId)
    })

    test("GET /api/kitchen-needs/requests/my returns user requests", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/kitchen-needs/requests/my", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("POST /api/kitchen-needs/requests validates input", async () => {
      if (!publicToken || !testKitchenNeedId) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: testKitchenNeedId,
          sppgName: "",
          contactPerson: "Test",
          position: "Test",
          phoneNumber: "08123456789",
          details: "Test details",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("Admin Routes with Valid Admin Token", () => {
    test("GET /api/admin/dashboard returns stats", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/dashboard", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.users).toBeDefined()
      expect(json.reports).toBeDefined()
    })

    test("GET /api/admin/users returns user list", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/users", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
    })

    test("GET /api/admin/reports returns reports list", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/reports", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("GET /api/admin/reports/:id returns report detail", async () => {
      if (!adminToken || !testReportId) return
      const res = await testRequest(app, "GET", `/api/admin/reports/${testReportId}`, { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("GET /api/admin/members returns members list", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/members", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("GET /api/admin/admins returns admin list", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/admins", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("GET /api/admin/mbg-schedules returns schedules", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/mbg-schedules", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("GET /api/admin/analytics returns analytics data", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/analytics", { token: adminToken })
      expect(res.status).toBe(200)
    })

    test("Admin cannot be accessed with public token", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/admin/dashboard", { token: publicToken })
      expect(res.status).toBe(403)
    })
  })

  describe("Role-Based Access Control", () => {
    test("Public user cannot access admin routes", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/admin/users", { token: publicToken })
      expect(res.status).toBe(403)
    })

    test("Admin can access admin routes", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/users", { token: adminToken })
      expect(res.status).toBe(200)
    })

    test("Admin can access public routes", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/reports")
      expect(res.status).toBe(200)
    })
  })
})

describe("Integration Tests - Data Validation", () => {
  describe("Report Creation Validation", () => {
    test("rejects title too short", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          category: "poisoning",
          title: "Short",
          description: "Test description that is definitely long enough for validation purposes",
          location: "Test location",
          provinceId: "32",
          cityId: "3201",
          incidentDate: new Date().toISOString(),
          relation: "parent",
        },
      })
      expect(res.status).toBe(400)
    })

    test("rejects description too short", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          category: "poisoning",
          title: "Valid Title That Is Long Enough",
          description: "Short",
          location: "Test location",
          provinceId: "32",
          cityId: "3201",
          incidentDate: new Date().toISOString(),
          relation: "parent",
        },
      })
      expect(res.status).toBe(400)
    })

    test("rejects invalid relation", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          category: "poisoning",
          title: "Valid Title That Is Long Enough",
          description: "Test description that is definitely long enough for validation",
          location: "Test location",
          provinceId: "32",
          cityId: "3201",
          incidentDate: new Date().toISOString(),
          relation: "invalid_relation",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("Password Validation", () => {
    test("rejects password without uppercase", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PUT", "/api/profile/password", {
        token: publicToken,
        body: {
          currentPassword: "Test1234",
          newPassword: "test1234",
          confirmPassword: "test1234",
        },
      })
      expect(res.status).toBe(400)
    })

    test("rejects password without number", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "PUT", "/api/profile/password", {
        token: publicToken,
        body: {
          currentPassword: "Test1234",
          newPassword: "TestPassword",
          confirmPassword: "TestPassword",
        },
      })
      expect(res.status).toBe(400)
    })

    test("rejects password mismatch", async () => {
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
  })
})

describe("Integration Tests - Pagination", () => {
  test("reports pagination defaults", async () => {
    const res = await testRequest(app, "GET", "/api/reports")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pagination.page).toBe(1)
    expect(json.pagination.limit).toBe(10)
  })

  test("reports pagination custom values", async () => {
    const res = await testRequest(app, "GET", "/api/reports?page=2&limit=5")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pagination.page).toBe(2)
    expect(json.pagination.limit).toBe(5)
  })

  test("admin users pagination", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/users?page=1&limit=5", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pagination.page).toBe(1)
    expect(json.pagination.limit).toBe(5)
  })
})

describe("Integration Tests - Admin Operations", () => {
  test("GET /api/admin/users with filters", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/users?role=public&isActive=true", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/admin/users with search", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/users?search=budi", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/reports with filters", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/reports?status=pending&category=poisoning", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/reports/:id/history returns history", async () => {
    if (!adminToken || !testReportId) return
    const res = await testRequest(app, "GET", `/api/admin/reports/${testReportId}/history`, { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/admin/reports/:id/scoring returns scores", async () => {
    if (!adminToken || !testReportId) return
    const res = await testRequest(app, "GET", `/api/admin/reports/${testReportId}/scoring`, { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/kitchen-needs returns all needs", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/all", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/admin/kitchen-needs/requests returns requests", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests", { token: adminToken })
    expect(res.status).toBe(200)
  })
})

describe("Integration Tests - Profile Operations", () => {
  test("GET /api/profile returns user with stats", async () => {
    if (!publicToken) return
    const res = await testRequest(app, "GET", "/api/profile", { token: publicToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user).toBeDefined()
    expect(json.stats).toBeDefined()
    expect(json.stats.totalReports).toBeDefined()
  })

  test("GET /api/profile/reports with pagination", async () => {
    if (!publicToken) return
    const res = await testRequest(app, "GET", "/api/profile/reports?page=1&limit=5", { token: publicToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pagination).toBeDefined()
  })

  test("GET /api/profile/reports with status filter", async () => {
    if (!publicToken) return
    const res = await testRequest(app, "GET", "/api/profile/reports?status=pending", { token: publicToken })
    expect(res.status).toBe(200)
  })
})

describe("Integration Tests - Auth Operations", () => {
  test("POST /api/auth/logout revokes session", async () => {
    if (!publicToken) return
    const res = await testRequest(app, "POST", "/api/auth/logout", { token: publicToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBeDefined()
  })

  test("PUT /api/auth/profile validates phone format", async () => {
    if (!publicToken) return
    const res = await testRequest(app, "PUT", "/api/auth/profile", {
      token: publicToken,
      body: { phone: "abc" },
    })
    expect(res.status).toBe(400)
  })
})

describe("Integration Tests - Locations Search", () => {
  test("GET /api/locations/search returns empty for short query", async () => {
    const res = await testRequest(app, "GET", "/api/locations/search?q=a")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([])
  })

  test("GET /api/locations/search searches provinces", async () => {
    const res = await testRequest(app, "GET", "/api/locations/search?q=jakarta&type=province")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/locations/search searches cities", async () => {
    const res = await testRequest(app, "GET", "/api/locations/search?q=bandung&type=city")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/locations/search searches districts", async () => {
    const res = await testRequest(app, "GET", "/api/locations/search?q=menteng&type=district")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("GET /api/locations/search searches all types", async () => {
    const res = await testRequest(app, "GET", "/api/locations/search?q=jawa&type=all")
    expect(res.status).toBe(200)
  })
})

describe("Integration Tests - Kitchen Needs Validation", () => {
  test("POST /api/kitchen-needs/requests validates sppgName", async () => {
    if (!publicToken || !testKitchenNeedId) return
    const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
      token: publicToken,
      body: {
        kitchenNeedId: testKitchenNeedId,
        sppgName: "ab", // Too short
        contactPerson: "Test Person",
        position: "Manager",
        phoneNumber: "08123456789",
        details: "This is a test detail that should be long enough",
      },
    })
    expect(res.status).toBe(400)
  })

  test("POST /api/kitchen-needs/requests validates details length", async () => {
    if (!publicToken || !testKitchenNeedId) return
    const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
      token: publicToken,
      body: {
        kitchenNeedId: testKitchenNeedId,
        sppgName: "Test SPPG",
        contactPerson: "Test Person",
        position: "Manager",
        phoneNumber: "08123456789",
        details: "Short", // Too short
      },
    })
    expect(res.status).toBe(400)
  })

  test("POST /api/kitchen-needs/requests validates non-existent kitchen need", async () => {
    if (!publicToken) return
    const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
      token: publicToken,
      body: {
        kitchenNeedId: "00000000-0000-0000-0000-000000000000",
        sppgName: "Test SPPG Name",
        contactPerson: "Test Person",
        position: "Manager",
        phoneNumber: "08123456789",
        details: "This is a test detail that should be long enough for validation",
      },
    })
    expect(res.status).toBe(404)
  })
})
