import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import admin from "../routes/admin"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, admins, members, reports, kitchenNeeds, kitchenNeedsRequests } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/admin", admin))

describe("Admin Extended - User Operations", () => {
  let adminToken: string
  let adminId: string
  let testUserId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
      adminId = adminUser.id
    }

    // Create a test user for delete operations
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `delete-test-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Delete Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    testUserId = user.id
  })

  afterAll(async () => {
    if (testUserId) {
      await db.delete(publics).where(eq(publics.id, testUserId)).catch(() => {})
    }
  })

  describe("DELETE /api/admin/users/:id", () => {
    test("returns 404 for non-existent user", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "DELETE", "/api/admin/users/00000000-0000-0000-0000-000000000000", {
        token: adminToken,
      })
      expect(res.status).toBe(404)
    })

    test("deletes user successfully", async () => {
      if (!adminToken || !testUserId) return
      const res = await testRequest(app, "DELETE", `/api/admin/users/${testUserId}`, {
        token: adminToken,
      })
      expect(res.status).toBe(200)
      testUserId = "" // Mark as deleted
    })
  })

})

describe("Admin Extended - Report Export", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  describe("GET /api/admin/reports/export", () => {
    test("exports as JSON by default", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/reports/export", { token: adminToken })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test("exports as CSV", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/reports/export?format=csv", { token: adminToken })
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toContain("ID,Judul,Kategori")
    })

    test("filters by status", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/reports/export?status=pending", { token: adminToken })
      expect(res.status).toBe(200)
    })

    test("filters by date range", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/reports/export?startDate=2024-01-01&endDate=2025-12-31", {
        token: adminToken,
      })
      expect(res.status).toBe(200)
    })

    test("exports CSV with status filter", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "GET", "/api/admin/reports/export?format=csv&status=pending", {
        token: adminToken,
      })
      expect(res.status).toBe(200)
    })
  })
})

describe("Admin Extended - Member Management", () => {
  let adminToken: string
  let memberId: string
  let memberUserId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  afterAll(async () => {
    if (memberId) {
      await db.delete(members).where(eq(members.id, memberId)).catch(() => {})
    }
    if (memberUserId) {
      await db.delete(publics).where(eq(publics.id, memberUserId)).catch(() => {})
    }
  })

  describe("POST /api/admin/members", () => {
    test("creates member with 08 phone format", async () => {
      if (!adminToken) return
      const uniquePhone = `08${randomBytes(5).toString("hex").slice(0, 10)}`
      const res = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "Test Member 08",
          email: `member-08-${randomBytes(4).toString("hex")}@example.com`,
          phone: uniquePhone,
          memberType: "foundation",
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) {
        memberId = json.data.id
        memberUserId = json.data.publicId
      }
    })

    test("creates member with +62 phone format", async () => {
      if (!adminToken) return
      const uniquePhone = `+628${randomBytes(5).toString("hex").slice(0, 10)}`
      const res = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "Test Member +62",
          email: `member-62-${randomBytes(4).toString("hex")}@example.com`,
          phone: uniquePhone,
          memberType: "supplier",
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) {
        // Cleanup
        await db.delete(members).where(eq(members.id, json.data.id)).catch(() => {})
        if (json.data.publicId) {
          await db.delete(publics).where(eq(publics.id, json.data.publicId)).catch(() => {})
        }
      }
    })

    test("creates member with plain phone format", async () => {
      if (!adminToken) return
      const uniquePhone = `8${randomBytes(5).toString("hex").slice(0, 10)}`
      const res = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "Test Member Plain",
          email: `member-plain-${randomBytes(4).toString("hex")}@example.com`,
          phone: uniquePhone,
          memberType: "caterer",
        },
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) {
        // Cleanup
        await db.delete(members).where(eq(members.id, json.data.id)).catch(() => {})
        if (json.data.publicId) {
          await db.delete(publics).where(eq(publics.id, json.data.publicId)).catch(() => {})
        }
      }
    })

    test("rejects duplicate email", async () => {
      if (!adminToken) return
      const email = `dup-${randomBytes(4).toString("hex")}@example.com`

      // Create first member
      const firstRes = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "First Member",
          email,
          phone: "081234500001",
          memberType: "school",
        },
      })
      const firstJson = await firstRes.json()

      // Try to create duplicate
      const res = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "Second Member",
          email,
          phone: "081234500002",
          memberType: "school",
        },
      })
      expect(res.status).toBe(400)

      // Cleanup
      if (firstJson.data?.id) {
        await db.delete(members).where(eq(members.id, firstJson.data.id)).catch(() => {})
        if (firstJson.data.publicId) {
          await db.delete(publics).where(eq(publics.id, firstJson.data.publicId)).catch(() => {})
        }
      }
    })

    test("rejects duplicate phone", async () => {
      if (!adminToken) return
      const phone = "081234599999"
      const email1 = `phone1-${randomBytes(4).toString("hex")}@example.com`
      const email2 = `phone2-${randomBytes(4).toString("hex")}@example.com`

      // Create first member
      const firstRes = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "First Member Phone",
          email: email1,
          phone,
          memberType: "government",
        },
      })
      const firstJson = await firstRes.json()

      // Try to create with duplicate phone
      const res = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "Second Member Phone",
          email: email2,
          phone,
          memberType: "government",
        },
      })
      expect(res.status).toBe(400)

      // Cleanup
      if (firstJson.data?.id) {
        await db.delete(members).where(eq(members.id, firstJson.data.id)).catch(() => {})
        if (firstJson.data.publicId) {
          await db.delete(publics).where(eq(publics.id, firstJson.data.publicId)).catch(() => {})
        }
      }
    })

    test("validates member type enum", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "POST", "/api/admin/members", {
        token: adminToken,
        body: {
          name: "Invalid Type",
          email: `invalid-${randomBytes(4).toString("hex")}@example.com`,
          phone: "081234500003",
          memberType: "invalid_type",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("DELETE /api/admin/members/:id", () => {
    let deleteTestMemberId: string
    let deleteTestUserId: string

    beforeAll(async () => {
      // Create a user first, then a member
      const [user] = await db.insert(publics).values({
        email: `delete-member-${randomBytes(4).toString("hex")}@example.com`,
        name: "Delete Test Member",
        phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      }).returning()
      deleteTestUserId = user.id

      const [member] = await db.insert(members).values({
        publicId: user.id,
        memberType: "ngo",
        organizationName: "Test Org",
      }).returning()
      deleteTestMemberId = member.id
    })

    afterAll(async () => {
      if (deleteTestMemberId) {
        await db.delete(members).where(eq(members.id, deleteTestMemberId)).catch(() => {})
      }
      if (deleteTestUserId) {
        await db.delete(publics).where(eq(publics.id, deleteTestUserId)).catch(() => {})
      }
    })

    test("returns 404 for non-existent member", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "DELETE", "/api/admin/members/00000000-0000-0000-0000-000000000000", {
        token: adminToken,
      })
      expect(res.status).toBe(404)
    })

    test("deletes member successfully", async () => {
      if (!adminToken || !deleteTestMemberId) return
      const res = await testRequest(app, "DELETE", `/api/admin/members/${deleteTestMemberId}`, {
        token: adminToken,
      })
      expect(res.status).toBe(200)
      deleteTestMemberId = "" // Mark as deleted
    })
  })
})

describe("Admin Extended - Admin Management", () => {
  let superAdminToken: string
  let superAdminId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      superAdminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
      superAdminId = adminUser.id
    }
  })

  describe("DELETE /api/admin/admins/:id", () => {
    test("returns 400 when deleting self", async () => {
      if (!superAdminToken || !superAdminId) return
      const res = await testRequest(app, "DELETE", `/api/admin/admins/${superAdminId}`, {
        token: superAdminToken,
      })
      expect(res.status).toBe(400)
    })

    test("returns 404 for non-existent admin", async () => {
      if (!superAdminToken) return
      const res = await testRequest(app, "DELETE", "/api/admin/admins/00000000-0000-0000-0000-000000000000", {
        token: superAdminToken,
      })
      expect(res.status).toBe(404)
    })
  })

  describe("POST /api/admin/admins - Validation", () => {
    test("rejects duplicate email", async () => {
      if (!superAdminToken) return
      const res = await testRequest(app, "POST", "/api/admin/admins", {
        token: superAdminToken,
        body: {
          name: "Duplicate Admin",
          email: "admin@ampmbg.id", // Already exists
          password: "Admin1234",
          adminRole: "Validator",
        },
      })
      expect(res.status).toBe(400)
    })

    test("validates password requirements", async () => {
      if (!superAdminToken) return
      const res = await testRequest(app, "POST", "/api/admin/admins", {
        token: superAdminToken,
        body: {
          name: "Weak Password Admin",
          email: `weak-${randomBytes(4).toString("hex")}@example.com`,
          password: "weak", // Too short
          adminRole: "Validator",
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/admin/admins - Filters", () => {
    test("filters by isActive status", async () => {
      if (!superAdminToken) return
      const res = await testRequest(app, "GET", "/api/admin/admins?isActive=true", {
        token: superAdminToken,
      })
      expect(res.status).toBe(200)
    })

    test("filters by search", async () => {
      if (!superAdminToken) return
      const res = await testRequest(app, "GET", "/api/admin/admins?search=admin", {
        token: superAdminToken,
      })
      expect(res.status).toBe(200)
    })
  })
})

describe("Admin Extended - Members Filters", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  test("filters members by verified status", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/members?status=verified", {
      token: adminToken,
    })
    expect(res.status).toBe(200)
  })

  test("filters members by pending status", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/members?status=pending", {
      token: adminToken,
    })
    expect(res.status).toBe(200)
  })

  test("filters members by member type", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/members?memberType=foundation", {
      token: adminToken,
    })
    expect(res.status).toBe(200)
  })
})

describe("Admin Extended - Analytics", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  test("returns analytics with monthly filter", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/analytics?months=6", {
      token: adminToken,
    })
    expect(res.status).toBe(200)
  })

  test("returns analytics with 12 months", async () => {
    if (!adminToken) return
    const res = await testRequest(app, "GET", "/api/admin/analytics?months=12", {
      token: adminToken,
    })
    expect(res.status).toBe(200)
  })
})

describe("Admin Extended - Bulk Operations", () => {
  let adminToken: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }
  })

  describe("PATCH /api/admin/reports/bulk-status", () => {
    test("validates empty report ids", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", "/api/admin/reports/bulk-status", {
        token: adminToken,
        body: { reportIds: [], status: "analyzing" },
      })
      expect(res.status).toBe(400)
    })

    test("validates status enum", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", "/api/admin/reports/bulk-status", {
        token: adminToken,
        body: { reportIds: ["some-id"], status: "invalid_status" },
      })
      expect(res.status).toBe(400)
    })
  })
})
