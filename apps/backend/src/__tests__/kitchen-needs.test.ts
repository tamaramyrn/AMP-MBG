import { describe, test, expect, beforeAll } from "bun:test"
import { Hono } from "hono"
import kitchenNeeds from "../routes/kitchen-needs"
import { createTestApp, testRequest, testData, generateTestToken } from "./setup"
import { db } from "../db"
import { publics, admins, kitchenNeeds as kitchenNeedsTable } from "../db/schema"
import { eq } from "drizzle-orm"

const app = createTestApp(new Hono().route("/kitchen-needs", kitchenNeeds))

let publicToken: string
let adminToken: string
let testKitchenNeedId: string

beforeAll(async () => {
  // Get seeded public user
  const publicUser = await db.query.publics.findFirst({
    where: eq(publics.email, "budi@example.com"),
  })
  if (publicUser) {
    publicToken = await generateTestToken(publicUser.id, publicUser.email, "user")
  }

  // Get seeded admin from admins table
  const adminUser = await db.query.admins.findFirst({
    where: eq(admins.email, "admin@ampmbg.id"),
  })
  if (adminUser) {
    adminToken = await generateTestToken(adminUser.id, adminUser.email, "admin")
  }

  const kitchenNeed = await db.query.kitchenNeeds.findFirst()
  if (kitchenNeed) {
    testKitchenNeedId = kitchenNeed.id
  }
})

describe("Kitchen Needs Routes", () => {
  describe("GET /api/kitchen-needs", () => {
    test("returns list of active kitchen needs", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })
  })

  describe("GET /api/kitchen-needs/:id", () => {
    test("returns 404 for non-existent item", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs/00000000-0000-0000-0000-000000000000")
      expect(res.status).toBe(404)
    })
  })

  describe("POST /api/kitchen-needs/requests", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        body: testData.validKitchenRequest,
      })
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/kitchen-needs/requests/my", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs/requests/my")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/kitchen-needs/admin/all", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/all")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/kitchen-needs/admin/upload", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/kitchen-needs/admin", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin", {
        body: testData.validKitchenNeed,
      })
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/kitchen-needs/admin/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/kitchen-needs/admin/test-id", {
        body: { title: "Updated Title" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/kitchen-needs/admin/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/kitchen-needs/admin/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/kitchen-needs/admin/requests", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests")
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/kitchen-needs/admin/requests/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/kitchen-needs/admin/requests/test-id", {
        body: { status: "processed" },
      })
      expect(res.status).toBe(401)
    })
  })
})

describe("Kitchen Needs Routes - Authenticated", () => {
  describe("POST /api/kitchen-needs/requests - Submit Request", () => {
    test("validates sppgName minimum length", async () => {
      if (!publicToken || !testKitchenNeedId) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: testKitchenNeedId,
          sppgName: "ab", // Too short (min 3)
          contactPerson: "Test Person",
          position: "Manager",
          phoneNumber: "08123456789",
          details: "This is a test detail that should be long enough",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates contactPerson minimum length", async () => {
      if (!publicToken || !testKitchenNeedId) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: testKitchenNeedId,
          sppgName: "Test SPPG",
          contactPerson: "ab", // Too short (min 3)
          position: "Manager",
          phoneNumber: "08123456789",
          details: "This is a test detail that should be long enough",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates position minimum length", async () => {
      if (!publicToken || !testKitchenNeedId) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: testKitchenNeedId,
          sppgName: "Test SPPG",
          contactPerson: "Test Person",
          position: "M", // Too short (min 2)
          phoneNumber: "08123456789",
          details: "This is a test detail that should be long enough",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates phoneNumber minimum length", async () => {
      if (!publicToken || !testKitchenNeedId) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: testKitchenNeedId,
          sppgName: "Test SPPG",
          contactPerson: "Test Person",
          position: "Manager",
          phoneNumber: "123", // Too short (min 10)
          details: "This is a test detail that should be long enough",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates details minimum length", async () => {
      if (!publicToken || !testKitchenNeedId) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: testKitchenNeedId,
          sppgName: "Test SPPG",
          contactPerson: "Test Person",
          position: "Manager",
          phoneNumber: "08123456789",
          details: "Short", // Too short (min 20)
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates non-existent kitchenNeedId", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: "00000000-0000-0000-0000-000000000000",
          sppgName: "Test SPPG Name",
          contactPerson: "Test Person Name",
          position: "Manager",
          phoneNumber: "08123456789",
          details: "This is a test detail that should be long enough for validation",
        },
      })
      expect(res.status).toBe(404)
    })
  })

  describe("GET /api/kitchen-needs/requests/my - User Requests", () => {
    test("returns user requests with auth", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/kitchen-needs/requests/my", { token: publicToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })
  })

  describe("Admin Routes", () => {
    test("GET /api/kitchen-needs/admin/all returns all needs", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/all", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("GET /api/kitchen-needs/admin/requests returns requests", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests", { token: adminToken })
      expect(res.status).toBe(200)
    })

    test("GET /api/kitchen-needs/admin/requests with status filter", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests?status=pending", { token: adminToken })
      expect(res.status).toBe(200)
    })

    test("public user cannot access admin routes", async () => {
      if (!publicToken) return
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/all", { token: publicToken })
      expect(res.status).toBe(403)
    })
  })
})
