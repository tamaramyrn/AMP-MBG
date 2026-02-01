import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import reports from "../routes/reports"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, admins, reports as reportsTable, reportFiles } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/reports", reports))

describe("Reports File Operations", () => {
  let userId: string
  let userToken: string
  let adminToken: string
  let reportId: string

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `files-test-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Files Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })

    // Get admin token
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }

    // Create test report
    const [report] = await db.insert(reportsTable).values({
      category: "poisoning",
      title: "Test Report For File Operations",
      description: "This is a test report for testing file upload and delete operations.",
      location: "Test Location",
      provinceId: "11",
      cityId: "11.01",
      incidentDate: new Date(),
      relation: "parent",
      publicId: user.id,
    }).returning()
    reportId = report.id
  })

  afterAll(async () => {
    if (reportId) {
      await db.delete(reportFiles).where(eq(reportFiles.reportId, reportId))
      await db.delete(reportsTable).where(eq(reportsTable.id, reportId))
    }
    if (userId) await db.delete(publics).where(eq(publics.id, userId))
  })

  describe("POST /api/reports/:id/files", () => {
    test("returns 404 for non-existent report", async () => {
      const formData = new FormData()
      formData.append("files", new File(["test"], "test.jpg", { type: "image/jpeg" }))

      const res = await testRequest(app, "POST", "/api/reports/00000000-0000-0000-0000-000000000000/files", {
        token: userToken,
        formData,
      })
      expect(res.status).toBe(404)
    })

    test("returns 403 when non-owner uploads", async () => {
      // Create another user
      const hashedPassword = await hashPassword("Test1234")
      const [otherUser] = await db.insert(publics).values({
        email: `other-${randomBytes(4).toString("hex")}@example.com`,
        password: hashedPassword,
        name: "Other User",
        phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      }).returning()
      const otherToken = await signToken({ sub: otherUser.id, email: otherUser.email, type: "user" })

      const formData = new FormData()
      formData.append("files", new File(["test"], "test.jpg", { type: "image/jpeg" }))

      const res = await testRequest(app, "POST", `/api/reports/${reportId}/files`, {
        token: otherToken,
        formData,
      })
      expect(res.status).toBe(403)

      // Cleanup
      await db.delete(publics).where(eq(publics.id, otherUser.id))
    })

    test("returns 400 when no files provided", async () => {
      const formData = new FormData()

      const res = await testRequest(app, "POST", `/api/reports/${reportId}/files`, {
        token: userToken,
        formData,
      })
      expect(res.status).toBe(400)
    })

    test("returns 400 when too many files", async () => {
      const formData = new FormData()
      for (let i = 0; i < 6; i++) {
        formData.append("files", new File(["test"], `test${i}.jpg`, { type: "image/jpeg" }))
      }

      const res = await testRequest(app, "POST", `/api/reports/${reportId}/files`, {
        token: userToken,
        formData,
      })
      expect(res.status).toBe(400)
    })

    test("returns 400 for invalid file type", async () => {
      const formData = new FormData()
      formData.append("files", new File(["test"], "test.exe", { type: "application/x-executable" }))

      const res = await testRequest(app, "POST", `/api/reports/${reportId}/files`, {
        token: userToken,
        formData,
      })
      expect(res.status).toBe(400)
    })

    test("uploads valid file successfully", async () => {
      const formData = new FormData()
      formData.append("files", new File(["test content"], "test.jpg", { type: "image/jpeg" }))

      const res = await testRequest(app, "POST", `/api/reports/${reportId}/files`, {
        token: userToken,
        formData,
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })

  })

  describe("DELETE /api/reports/:id/files/:fileId", () => {
    let fileId: string

    beforeAll(async () => {
      const [file] = await db.insert(reportFiles).values({
        reportId,
        fileName: "test-delete.jpg",
        fileUrl: "/uploads/reports/test-delete.jpg",
        fileType: "image/jpeg",
        fileSize: "1024",
      }).returning()
      fileId = file.id
    })

    test("returns 404 for non-existent report", async () => {
      const res = await testRequest(app, "DELETE", `/api/reports/00000000-0000-0000-0000-000000000000/files/${fileId}`, {
        token: userToken,
      })
      expect(res.status).toBe(404)
    })

    test("returns 403 when non-owner deletes", async () => {
      const hashedPassword = await hashPassword("Test1234")
      const [otherUser] = await db.insert(publics).values({
        email: `delete-${randomBytes(4).toString("hex")}@example.com`,
        password: hashedPassword,
        name: "Delete Test User",
        phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
      }).returning()
      const otherToken = await signToken({ sub: otherUser.id, email: otherUser.email, type: "user" })

      const res = await testRequest(app, "DELETE", `/api/reports/${reportId}/files/${fileId}`, {
        token: otherToken,
      })
      expect(res.status).toBe(403)

      await db.delete(publics).where(eq(publics.id, otherUser.id))
    })

    test("returns 404 for non-existent file", async () => {
      const res = await testRequest(app, "DELETE", `/api/reports/${reportId}/files/00000000-0000-0000-0000-000000000000`, {
        token: userToken,
      })
      expect(res.status).toBe(404)
    })

    test("owner can delete their file", async () => {
      // Create a new file for this test
      const [newFile] = await db.insert(reportFiles).values({
        reportId,
        fileName: "owner-delete.jpg",
        fileUrl: "/uploads/reports/owner-delete.jpg",
        fileType: "image/jpeg",
        fileSize: "1024",
      }).returning()

      const res = await testRequest(app, "DELETE", `/api/reports/${reportId}/files/${newFile.id}`, {
        token: userToken,
      })
      expect(res.status).toBe(200)
    })

  })
})

describe("Reports Status Operations", () => {
  let adminToken: string
  let reportId: string

  beforeAll(async () => {
    const adminUser = await db.query.admins.findFirst({
      where: eq(admins.email, "admin@ampmbg.id"),
    })
    if (adminUser) {
      adminToken = await signToken({ sub: adminUser.id, email: adminUser.email, type: "admin" })
    }

    // Create test report
    const [report] = await db.insert(reportsTable).values({
      category: "quality",
      title: "Test Report For Status Updates",
      description: "This is a test report for testing status update operations.",
      location: "Test Location",
      provinceId: "11",
      cityId: "11.01",
      incidentDate: new Date(),
      relation: "teacher",
    }).returning()
    reportId = report.id
  })

  afterAll(async () => {
    if (reportId) {
      await db.delete(reportsTable).where(eq(reportsTable.id, reportId))
    }
  })

  describe("PATCH /api/reports/:id/status", () => {
    test("returns 404 for non-existent report", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", "/api/reports/00000000-0000-0000-0000-000000000000/status", {
        token: adminToken,
        body: { status: "analyzing" },
      })
      expect(res.status).toBe(404)
    })

    test("validates status enum", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", `/api/reports/${reportId}/status`, {
        token: adminToken,
        body: { status: "invalid_status" },
      })
      expect(res.status).toBe(400)
    })

    test("updates status to analyzing", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", `/api/reports/${reportId}/status`, {
        token: adminToken,
        body: { status: "analyzing" },
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.status).toBe("analyzing")
    })

    test("updates status with notes", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", `/api/reports/${reportId}/status`, {
        token: adminToken,
        body: { status: "needs_evidence", notes: "Need more evidence" },
      })
      expect(res.status).toBe(200)
    })

    test("updates to in_progress", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", `/api/reports/${reportId}/status`, {
        token: adminToken,
        body: { status: "in_progress" },
      })
      expect(res.status).toBe(200)
    })

    test("updates to resolved", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", `/api/reports/${reportId}/status`, {
        token: adminToken,
        body: { status: "resolved" },
      })
      expect(res.status).toBe(200)
    })

    test("updates to invalid", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "PATCH", `/api/reports/${reportId}/status`, {
        token: adminToken,
        body: { status: "invalid", notes: "Report is invalid" },
      })
      expect(res.status).toBe(200)
    })
  })

  describe("DELETE /api/reports/:id", () => {
    let deleteReportId: string

    beforeAll(async () => {
      const [report] = await db.insert(reportsTable).values({
        category: "kitchen",
        title: "Test Report For Delete",
        description: "This is a test report for testing delete operations.",
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date(),
        relation: "community",
      }).returning()
      deleteReportId = report.id
    })

    test("returns 404 for non-existent report", async () => {
      if (!adminToken) return
      const res = await testRequest(app, "DELETE", "/api/reports/00000000-0000-0000-0000-000000000000", {
        token: adminToken,
      })
      expect(res.status).toBe(404)
    })

    test("admin can delete report", async () => {
      if (!adminToken || !deleteReportId) return
      const res = await testRequest(app, "DELETE", `/api/reports/${deleteReportId}`, {
        token: adminToken,
      })
      expect(res.status).toBe(200)
      deleteReportId = ""
    })
  })
})
