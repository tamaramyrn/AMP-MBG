import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import reports from "../routes/reports"
import { createTestApp, testRequest, testData } from "./setup"
import { db } from "../db"
import { publics, reports as reportsTable, reportFiles } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/reports", reports))

describe("Reports Flow - Create Report", () => {
  let userId: string
  let userToken: string
  let reportId: string

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `report-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Report Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    if (reportId) {
      await db.delete(reportFiles).where(eq(reportFiles.reportId, reportId))
      await db.delete(reportsTable).where(eq(reportsTable.id, reportId))
    }
    if (userId) await db.delete(publics).where(eq(publics.id, userId))
  })

  test("POST /api/reports creates report successfully", async () => {
    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "poisoning",
        title: "Test Report Title That Is Long Enough For Validation",
        description: "This is a test description that is definitely long enough to pass the validation requirements. It needs to be at least 50 characters.",
        location: "Jl. Test No. 123",
        provinceId: "11",
        cityId: "11.01",
        districtId: "11.01.01",
        incidentDate: new Date().toISOString(),
        relation: "parent",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.data.id).toBeDefined()
    reportId = json.data.id
  })

  test("GET /api/reports/:id returns created report", async () => {
    if (!reportId) return
    const res = await testRequest(app, "GET", `/api/reports/${reportId}`)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.id).toBe(reportId)
  })

  test("GET /api/reports/my/reports includes created report", async () => {
    const res = await testRequest(app, "GET", "/api/reports/my/reports", { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.length).toBeGreaterThan(0)
  })

  test("POST /api/reports with other relation and detail", async () => {
    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "quality",
        title: "Another Test Report Title Long Enough",
        description: "This is another test description that should be long enough for validation.",
        location: "Jl. Another Test No. 456",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date().toISOString(),
        relation: "other",
        relationDetail: "Volunteer Organization",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    // Cleanup
    if (json.data?.id) {
      await db.delete(reportsTable).where(eq(reportsTable.id, json.data.id))
    }
  })

  test("POST /api/reports with different categories", async () => {
    const categories = ["kitchen", "policy", "implementation", "social"]
    for (const category of categories) {
      const res = await testRequest(app, "POST", "/api/reports", {
        token: userToken,
        body: {
          category,
          title: `Test ${category} Report Title Long Enough`,
          description: "Test description for category validation that is long enough for the requirements.",
          location: "Test Location",
          provinceId: "11",
          cityId: "11.01",
          incidentDate: new Date().toISOString(),
          relation: "teacher",
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) {
        await db.delete(reportsTable).where(eq(reportsTable.id, json.data.id))
      }
    }
  })

  test("POST /api/reports with different relations", async () => {
    const relations = ["student", "principal", "supplier", "community"]
    for (const relation of relations) {
      const res = await testRequest(app, "POST", "/api/reports", {
        token: userToken,
        body: {
          category: "poisoning",
          title: `Test ${relation} Report Title Long Enough`,
          description: "Test description for relation validation that is long enough.",
          location: "Test Location",
          provinceId: "11",
          cityId: "11.01",
          incidentDate: new Date().toISOString(),
          relation,
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) {
        await db.delete(reportsTable).where(eq(reportsTable.id, json.data.id))
      }
    }
  })
})

describe("Reports Flow - Filtering", () => {
  test("GET /api/reports with multiple filters", async () => {
    const res = await testRequest(app, "GET", "/api/reports?category=poisoning&status=pending&credibilityLevel=low")
    expect(res.status).toBe(200)
  })

  test("GET /api/reports with date range", async () => {
    const startDate = "2024-01-01"
    const endDate = "2025-12-31"
    const res = await testRequest(app, "GET", `/api/reports?startDate=${startDate}&endDate=${endDate}`)
    expect(res.status).toBe(200)
  })

  test("GET /api/reports with sorting", async () => {
    const res = await testRequest(app, "GET", "/api/reports?sortBy=createdAt&sortOrder=asc")
    expect(res.status).toBe(200)
  })

  test("GET /api/reports with search", async () => {
    const res = await testRequest(app, "GET", "/api/reports?search=keracunan")
    expect(res.status).toBe(200)
  })
})

describe("Reports Flow - Statistics", () => {
  test("GET /api/reports/stats returns all stat fields", async () => {
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

  test("GET /api/reports/summary returns summary fields", async () => {
    const res = await testRequest(app, "GET", "/api/reports/summary")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBeDefined()
    expect(json.verified).toBeDefined()
    expect(json.uniqueCities).toBeDefined()
    expect(json.highRisk).toBeDefined()
    expect(json.mediumRisk).toBeDefined()
    expect(json.lowRisk).toBeDefined()
  })

  test("GET /api/reports/recent returns recent reports", async () => {
    const res = await testRequest(app, "GET", "/api/reports/recent")
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(Array.isArray(json.data)).toBe(true)
  })
})
