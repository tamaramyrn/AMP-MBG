import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import kitchenNeeds from "../routes/kitchen-needs"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, admins, kitchenNeeds as kitchenNeedsTable, kitchenNeedsRequests } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/kitchen-needs", kitchenNeeds))

describe("Kitchen Needs - Admin Upload", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  describe("POST /api/kitchen-needs/admin/upload", () => {
    test("returns 401 without token", async () => {
      const formData = new FormData()
      formData.append("file", new File(["test"], "test.jpg", { type: "image/jpeg" }))

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", { formData })
      expect(res.status).toBe(401)
    })

    test("returns 400 without file", async () => {
      if (!adminToken) return
      const formData = new FormData()

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", {
        token: adminToken,
        formData,
      })
      expect(res.status).toBe(400)
    })

    test("rejects invalid file type", async () => {
      if (!adminToken) return
      const formData = new FormData()
      formData.append("file", new File(["test"], "test.txt", { type: "text/plain" }))

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", {
        token: adminToken,
        formData,
      })
      expect(res.status).toBe(400)
    })

    test("accepts valid JPEG file", async () => {
      if (!adminToken) return
      const formData = new FormData()
      formData.append("file", new File(["test content"], "test.jpg", { type: "image/jpeg" }))

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", {
        token: adminToken,
        formData,
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data?.imageUrl).toBeDefined()
    })

    test("accepts valid PNG file", async () => {
      if (!adminToken) return
      const formData = new FormData()
      formData.append("file", new File(["test content"], "test.png", { type: "image/png" }))

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", {
        token: adminToken,
        formData,
      })
      expect(res.status).toBe(200)
    })

    test("accepts valid GIF file", async () => {
      if (!adminToken) return
      const formData = new FormData()
      formData.append("file", new File(["test content"], "test.gif", { type: "image/gif" }))

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", {
        token: adminToken,
        formData,
      })
      expect(res.status).toBe(200)
    })

    test("accepts valid WebP file", async () => {
      if (!adminToken) return
      const formData = new FormData()
      formData.append("file", new File(["test content"], "test.webp", { type: "image/webp" }))

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin/upload", {
        token: adminToken,
        formData,
      })
      expect(res.status).toBe(200)
    })
  })
})

describe("Kitchen Needs - Public Requests", () => {
  let publicToken: string
  let publicUserId: string
  let kitchenNeedId: string
  let requestId: string

  beforeAll(async () => {
    // Create public user
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `kitchen-public-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Kitchen Public Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    publicUserId = user.id
    publicToken = await signToken({ sub: user.id, email: user.email, type: "user" })

    // Get a kitchen need for testing
    const kitchenNeed = await db.query.kitchenNeeds.findFirst()
    if (kitchenNeed) {
      kitchenNeedId = kitchenNeed.id
    }
  })

  afterAll(async () => {
    if (requestId) {
      await db.delete(kitchenNeedsRequests).where(eq(kitchenNeedsRequests.id, requestId)).catch(() => {})
    }
    if (publicUserId) {
      await db.delete(publics).where(eq(publics.id, publicUserId)).catch(() => {})
    }
  })

  describe("POST /api/kitchen-needs/requests", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        body: {
          kitchenNeedId: "test-id",
          sppgName: "Test SPPG",
          contactPerson: "Test Contact",
          position: "Manager",
          phoneNumber: "08123456789",
          details: "Test details for the request",
        },
      })
      expect(res.status).toBe(401)
    })

    test("creates request successfully", async () => {
      if (!publicToken || !kitchenNeedId) return

      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId,
          sppgName: "Test SPPG Organization",
          contactPerson: "Test Contact Person",
          position: "Manager",
          phoneNumber: "08123456789",
          details: "This is a test request for kitchen needs.",
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) requestId = json.data.id
    })

    test("validates required fields", async () => {
      if (!publicToken) return

      const res = await testRequest(app, "POST", "/api/kitchen-needs/requests", {
        token: publicToken,
        body: {
          kitchenNeedId: "",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/kitchen-needs/requests/my", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs/requests/my")
      expect(res.status).toBe(401)
    })

    test("returns user requests", async () => {
      if (!publicToken) return

      const res = await testRequest(app, "GET", "/api/kitchen-needs/requests/my", {
        token: publicToken,
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })
  })
})

describe("Kitchen Needs - Admin Operations", () => {
  let adminToken: string
  let kitchenNeedId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  afterAll(async () => {
    if (kitchenNeedId) {
      await db.delete(kitchenNeedsTable).where(eq(kitchenNeedsTable.id, kitchenNeedId)).catch(() => {})
    }
  })

  describe("POST /api/kitchen-needs/admin", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin", {
        body: {
          title: "Test Kitchen Need",
          description: "Test description for kitchen need",
        },
      })
      expect(res.status).toBe(401)
    })

    test("creates kitchen need successfully", async () => {
      if (!adminToken) return

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin", {
        token: adminToken,
        body: {
          title: "Test Kitchen Need Item",
          description: "This is a test description for kitchen need item.",
          sortOrder: 999,
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) kitchenNeedId = json.data.id
    })

    test("validates title length", async () => {
      if (!adminToken) return

      const res = await testRequest(app, "POST", "/api/kitchen-needs/admin", {
        token: adminToken,
        body: {
          title: "AB", // Too short
          description: "Test description for kitchen need",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("PATCH /api/kitchen-needs/admin/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/kitchen-needs/admin/test-id", {
        body: { title: "Updated Title" },
      })
      expect(res.status).toBe(401)
    })

    test("returns 404 for non-existent item", async () => {
      if (!adminToken) return

      const res = await testRequest(app, "PATCH", "/api/kitchen-needs/admin/00000000-0000-0000-0000-000000000000", {
        token: adminToken,
        body: { title: "Updated Title" },
      })
      expect(res.status).toBe(404)
    })

    test("updates item successfully", async () => {
      if (!adminToken || !kitchenNeedId) return

      const res = await testRequest(app, "PATCH", `/api/kitchen-needs/admin/${kitchenNeedId}`, {
        token: adminToken,
        body: { title: "Updated Kitchen Need Title" },
      })
      expect(res.status).toBe(200)
    })
  })

  describe("DELETE /api/kitchen-needs/admin/:id", () => {
    let deleteItemId: string

    beforeAll(async () => {
      if (!adminToken) return
      const [item] = await db.insert(kitchenNeedsTable).values({
        title: "Delete Test Item",
        description: "Test description for deletion",
      }).returning()
      deleteItemId = item.id
    })

    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/kitchen-needs/admin/test-id")
      expect(res.status).toBe(401)
    })

    test("returns 404 for non-existent item", async () => {
      if (!adminToken) return

      const res = await testRequest(app, "DELETE", "/api/kitchen-needs/admin/00000000-0000-0000-0000-000000000000", {
        token: adminToken,
      })
      expect(res.status).toBe(404)
    })

    test("deletes item successfully", async () => {
      if (!adminToken || !deleteItemId) return

      const res = await testRequest(app, "DELETE", `/api/kitchen-needs/admin/${deleteItemId}`, {
        token: adminToken,
      })
      expect(res.status).toBe(200)
    })
  })
})

describe("Kitchen Needs - Admin Requests Management", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  describe("GET /api/kitchen-needs/admin/requests", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests")
      expect(res.status).toBe(401)
    })

    test("returns requests list", async () => {
      if (!adminToken) return

      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests", {
        token: adminToken,
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("filters by status", async () => {
      if (!adminToken) return

      const res = await testRequest(app, "GET", "/api/kitchen-needs/admin/requests?status=pending", {
        token: adminToken,
      })
      expect(res.status).toBe(200)
    })
  })
})
