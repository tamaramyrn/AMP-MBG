import { describe, test, expect } from "bun:test"
import { Hono } from "hono"
import admin from "../routes/admin"
import { createTestApp, testRequest, testData } from "./setup"

const app = createTestApp(new Hono().route("/admin", admin))

describe("Admin Routes", () => {
  describe("GET /api/admin/users", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/users")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/users/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/users/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/admin/users/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/admin/users/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/dashboard", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/dashboard")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/reports", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/reports")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/reports/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/reports/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/reports/:id/history", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/reports/test-id/history")
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/admin/reports/:id/status", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/admin/reports/test-id/status", {
        body: { status: "analyzing" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/admin/reports/bulk-status", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/admin/reports/bulk-status", {
        body: { reportIds: ["id1"], status: "analyzing" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/admin/reports/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/admin/reports/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/analytics", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/analytics")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/sessions", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/sessions")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/admin/sessions/:userId/revoke-all", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/admin/sessions/test-id/revoke-all")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/mbg-schedules", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/mbg-schedules")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/admin/mbg-schedules", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/admin/mbg-schedules", {
        body: testData.validMbgSchedule,
      })
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/admin/mbg-schedules/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/admin/mbg-schedules/test-id", {
        body: { schoolName: "Updated School" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/admin/mbg-schedules/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/admin/mbg-schedules/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/reports/export", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/reports/export")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/reports/:id/scoring", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/reports/test-id/scoring")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/admins", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/admins")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/admin/admins", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/admin/admins", {
        body: testData.validAdmin,
      })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/admin/admins/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/admin/admins/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/members", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/members")
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/admin/members/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/admin/members/test-id")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/admin/members", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/admin/members", {
        body: testData.validMember,
      })
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/admin/members/:id/verify", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/admin/members/test-id/verify")
      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /api/admin/members/:id/status", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PATCH", "/api/admin/members/test-id/status", {
        body: { isVerified: true },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /api/admin/members/:id", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "DELETE", "/api/admin/members/test-id")
      expect(res.status).toBe(401)
    })
  })
})
