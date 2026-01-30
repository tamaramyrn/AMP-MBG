import { describe, test, expect, beforeAll } from "bun:test"
import { Hono } from "hono"
import reports from "../routes/reports"
import { createTestApp, testRequest, testData, generateTestToken } from "./setup"
import { db } from "../db"
import { users } from "../db/schema"
import { eq, and } from "drizzle-orm"

const app = createTestApp(new Hono().route("/reports", reports))

let publicToken: string
let adminToken: string

beforeAll(async () => {
  const publicUser = await db.query.users.findFirst({
    where: and(eq(users.role, "public"), eq(users.email, "budi@example.com")),
  })
  if (publicUser) {
    publicToken = await generateTestToken(publicUser.id, publicUser.email, "public")
  }

  const adminUser = await db.query.users.findFirst({
    where: and(eq(users.role, "admin"), eq(users.email, "admin@ampmbg.id")),
  })
  if (adminUser) {
    adminToken = await generateTestToken(adminUser.id, adminUser.email, "admin")
  }
})

describe("Reports Routes", () => {
  describe("GET /api/reports", () => {
    test("returns paginated list", async () => {
      const res = await testRequest(app, "GET", "/api/reports")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBeDefined()
      expect(json.pagination.limit).toBeDefined()
      expect(json.pagination.total).toBeDefined()
      expect(json.pagination.totalPages).toBeDefined()
    })

    test("accepts page parameter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?page=2")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.pagination.page).toBe(2)
    })

    test("accepts limit parameter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?limit=5")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.pagination.limit).toBe(5)
    })

    test("accepts category filter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?category=poisoning")
      expect(res.status).toBe(200)
    })

    test("accepts status filter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?status=analyzing")
      expect(res.status).toBe(200)
    })

    test("accepts credibilityLevel filter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?credibilityLevel=high")
      expect(res.status).toBe(200)
    })

    test("accepts provinceId filter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?provinceId=32")
      expect(res.status).toBe(200)
    })

    test("accepts cityId filter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?cityId=3201")
      expect(res.status).toBe(200)
    })

    test("accepts date range filter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?startDate=2024-01-01&endDate=2024-12-31")
      expect(res.status).toBe(200)
    })

    test("accepts search parameter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?search=test")
      expect(res.status).toBe(200)
    })

    test("accepts sortBy parameter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?sortBy=incidentDate")
      expect(res.status).toBe(200)
    })

    test("accepts sortOrder parameter", async () => {
      const res = await testRequest(app, "GET", "/api/reports?sortOrder=asc")
      expect(res.status).toBe(200)
    })

    test("rejects invalid category", async () => {
      const res = await testRequest(app, "GET", "/api/reports?category=invalid")
      expect(res.status).toBe(400)
    })

    test("rejects invalid status", async () => {
      const res = await testRequest(app, "GET", "/api/reports?status=nonexistent")
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/reports/stats", () => {
    test("returns statistics", async () => {
      const res = await testRequest(app, "GET", "/api/reports/stats")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.total).toBeDefined()
      expect(json.uniqueCities).toBeDefined()
      expect(json.highRisk).toBeDefined()
      expect(json.byStatus).toBeDefined()
      expect(json.byCategory).toBeDefined()
      expect(json.byProvince).toBeDefined()
    })
  })

  describe("GET /api/reports/summary", () => {
    test("returns summary with correct fields", async () => {
      const res = await testRequest(app, "GET", "/api/reports/summary")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.total).toBeDefined()
      expect(json.verified).toBeDefined()
      expect(json.uniqueCities).toBeDefined()
      expect(json.highRisk).toBeDefined()
      expect(json.mediumRisk).toBeDefined()
      expect(json.lowRisk).toBeDefined()
      expect(json.totalCommunityUsers).toBeDefined()
      expect(json.totalAmpMbgUsers).toBeDefined()
      expect(json.totalFoundations).toBeDefined()
    })
  })

  describe("GET /api/reports/recent", () => {
    test("returns recent reports", async () => {
      const res = await testRequest(app, "GET", "/api/reports/recent")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })
  })

  describe("GET /api/reports/:id", () => {
    test("returns 404 for non-existent report", async () => {
      const res = await testRequest(app, "GET", "/api/reports/00000000-0000-0000-0000-000000000000")
      expect(res.status).toBe(404)
    })
  })

  describe("POST /api/reports", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/reports", {
        body: testData.validReport,
      })
      expect(res.status).toBe(401)
    })

    test("validates required fields", async () => {
      const res = await testRequest(app, "POST", "/api/reports", { body: {} })
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/reports/my/reports", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/reports/my/reports")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/reports/:id/files", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/reports/test-id/files")
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/reports/:id/files/:fileId", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/reports/test-id/files/file-id")
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/reports/:id/status", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/reports/test-id/status", {
        body: { status: "analyzing" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/reports/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/reports/test-id")
      expect(res.status).toBe(401)
    })
  })
})

describe("Reports Routes - Authenticated", () => {
  describe("POST /api/reports - Create Report", () => {
    test("validates title length", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          title: "Short", // Too short
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates description length", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          description: "Too short", // Less than 50 chars
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates category enum", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          category: "invalid_category",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates relation enum", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          relation: "invalid_relation",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates provinceId required", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          provinceId: "",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates cityId required", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          cityId: "",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates incidentDate required", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: publicToken,
        body: {
          ...testData.validReport,
          incidentDate: "",
        },
      })
      expect(res.status).toBe(400)
    })

    test("admin cannot create report", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "POST", "/api/reports", {
        token: adminToken,
        body: testData.validReport,
      })
      expect(res.status).toBe(403)
    })
  })

  describe("GET /api/reports - Filters", () => {
    test("filters by districtId", async () => {
      const res = await testRequest(app, "GET", "/api/reports?districtId=3201010")
      expect(res.status).toBe(200)
    })

    test("filters by credibilityLevel high", async () => {
      const res = await testRequest(app, "GET", "/api/reports?credibilityLevel=high")
      expect(res.status).toBe(200)
    })

    test("filters by credibilityLevel medium", async () => {
      const res = await testRequest(app, "GET", "/api/reports?credibilityLevel=medium")
      expect(res.status).toBe(200)
    })

    test("filters by credibilityLevel low", async () => {
      const res = await testRequest(app, "GET", "/api/reports?credibilityLevel=low")
      expect(res.status).toBe(200)
    })

    test("sorts by totalScore", async () => {
      const res = await testRequest(app, "GET", "/api/reports?sortBy=totalScore&sortOrder=desc")
      expect(res.status).toBe(200)
    })

    test("rejects invalid credibilityLevel", async () => {
      const res = await testRequest(app, "GET", "/api/reports?credibilityLevel=invalid")
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/reports/my/reports - User Reports", () => {
    test("returns user reports with pagination", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/reports/my/reports?page=1&limit=5", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.pagination).toBeDefined()
    })

    test("filters user reports by status", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/reports/my/reports?status=pending", { token: publicToken })
      expect(res.status).toBe(200)
    })
  })
})
