import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import kitchenNeeds from "../routes/kitchen-needs"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { users, kitchenNeeds as kitchenNeedsTable, kitchenNeedsRequests } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/kitchen-needs", kitchenNeeds))

describe("Kitchen Needs Flow - Public User Requests", () => {
  let userId: string
  let userToken: string
  let kitchenNeedId: string
  let requestId: string

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(users).values({
      email: `kitchen-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Kitchen Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      role: "public",
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, role: "public" })

    // Get existing kitchen need
    const kn = await db.query.kitchenNeeds.findFirst()
    if (kn) kitchenNeedId = kn.id
  })

  afterAll(async () => {
    if (requestId) {
      await db.delete(kitchenNeedsRequests).where(eq(kitchenNeedsRequests.id, requestId))
    }
    if (userId) await db.delete(users).where(eq(users.id, userId))
  })

  test("POST /api/kitchen-needs/requests creates request", async () => {
    if (!userToken || !kitchenNeedId) return
    const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
      token: userToken,
      body: {
        kitchenNeedId: kitchenNeedId,
        sppgName: "Test SPPG Organization",
        contactPerson: "Test Contact Person",
        position: "Manager",
        phoneNumber: "08123456789",
        details: "This is a detailed description of our kitchen needs request that should be long enough.",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data).toBeDefined()
    if (json.data?.id) requestId = json.data.id
  })

  test("GET /api/kitchen-needs/requests/my returns user requests", async () => {
    if (!userToken) return
    const res = await testRequest(app, "GET", "/api/kitchen-needs/requests/my", { token: userToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(Array.isArray(json.data)).toBe(true)
  })
})

describe("Kitchen Needs Flow - Admin Operations", () => {
  let adminToken: string
  let newKitchenNeedId: string
  let testRequestId: string

  beforeAll(async () => {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, role: "admin" })
    }

    // Get existing request for status update
    const request = await db.query.kitchenNeedsRequests.findFirst()
    if (request) testRequestId = request.id
  })

  afterAll(async () => {
    if (newKitchenNeedId) {
      await db.delete(kitchenNeedsTable).where(eq(kitchenNeedsTable.id, newKitchenNeedId))
    }
  })

  test("GET /api/kitchen-needs/admin/all returns all items", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/all", { token: adminToken })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
  })

  test("POST /api/kitchen-needs/admin creates new item", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "POST", "/api/kitchen-needs/admin", {
      token: adminToken,
      body: {
        title: "Test Kitchen Need Item",
        description: "Test description for kitchen need item",
        sortOrder: 99,
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) newKitchenNeedId = json.data.id
  })

  test("PATCH /api/kitchen-needs/admin/:id updates item", async () => {
    if (!adminToken || !newKitchenNeedId) return
    const res = await testRequest(app, "PATCH", `/api/kitchen-needs/admin/${newKitchenNeedId}`, {
      token: adminToken,
      body: { title: "Updated Kitchen Need Title", isActive: false },
    })
    expect(res.status).toBe(200)
  })

  test("GET /api/kitchen-needs/admin/requests returns all requests", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("GET /api/kitchen-needs/admin/requests with status filter", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests?status=pending", { token: adminToken })
    expect(res.status).toBe(200)
  })

  test("PATCH /api/kitchen-needs/admin/requests/:id updates request status", async () => {
    if (!adminToken || !testRequestId) return
    const res = await testRequest(app, "PATCH", `/api/kitchen-needs/admin/requests/${testRequestId}`, {
      token: adminToken,
      body: { status: "processed", adminNotes: "Being processed" },
    })
    expect(res.status).toBe(200)
  })

  test("DELETE /api/kitchen-needs/admin/:id deletes item", async () => {
    if (!adminToken || !newKitchenNeedId) return
    const res = await testRequest(app, "DELETE", `/api/kitchen-needs/admin/${newKitchenNeedId}`, { token: adminToken })
    expect(res.status).toBe(200)
    newKitchenNeedId = "" // Mark as deleted
  })
})
