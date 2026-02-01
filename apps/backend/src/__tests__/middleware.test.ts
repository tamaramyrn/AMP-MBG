import { describe, test, expect } from "bun:test"
import { Hono } from "hono"
import { authMiddleware, adminMiddleware, reporterMiddleware, optionalAuthMiddleware } from "../middleware/auth"
import { signToken } from "../lib/jwt"

describe("Auth Middleware", () => {
  describe("authMiddleware", () => {
    const app = new Hono()
    app.use("/protected", authMiddleware)
    app.get("/protected", (c) => c.json({ user: c.get("user") }))

    test("returns 401 without Authorization header", async () => {
      const res = await app.fetch(new Request("http://localhost/protected"))
      expect(res.status).toBe(401)
    })

    test("returns 401 with invalid Authorization format", async () => {
      const res = await app.fetch(
        new Request("http://localhost/protected", {
          headers: { Authorization: "InvalidFormat token" },
        })
      )
      expect(res.status).toBe(401)
    })

    test("returns 401 with invalid token", async () => {
      const res = await app.fetch(
        new Request("http://localhost/protected", {
          headers: { Authorization: "Bearer invalid-token" },
        })
      )
      expect(res.status).toBe(401)
    })

    test("passes with valid user token", async () => {
      const token = await signToken({ sub: "user-123", email: "test@example.com", type: "user" })
      const res = await app.fetch(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user.id).toBe("user-123")
      expect(json.user.email).toBe("test@example.com")
      expect(json.user.type).toBe("user")
    })

    test("returns 401 with admin token on user middleware", async () => {
      const token = await signToken({ sub: "admin-123", email: "admin@example.com", type: "admin" })
      const res = await app.fetch(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(401)
    })
  })

  describe("optionalAuthMiddleware", () => {
    const app = new Hono()
    app.use("/optional", optionalAuthMiddleware)
    app.get("/optional", (c) => {
      const user = c.get("user")
      return c.json({ user: user || null })
    })

    test("allows request without token", async () => {
      const res = await app.fetch(new Request("http://localhost/optional"))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user).toBeNull()
    })

    test("sets user with valid token", async () => {
      const token = await signToken({ sub: "user-123", email: "test@example.com", type: "user" })
      const res = await app.fetch(
        new Request("http://localhost/optional", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user.id).toBe("user-123")
    })

    test("allows request with invalid token (optional)", async () => {
      const res = await app.fetch(
        new Request("http://localhost/optional", {
          headers: { Authorization: "Bearer invalid-token" },
        })
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user).toBeNull()
    })
  })

  describe("adminMiddleware", () => {
    const app = new Hono()
    app.use("/admin", adminMiddleware)
    app.get("/admin", (c) => c.json({ admin: c.get("admin") }))

    test("returns 401 without token", async () => {
      const res = await app.fetch(new Request("http://localhost/admin"))
      expect(res.status).toBe(401)
    })

    test("returns 401 with invalid token", async () => {
      const res = await app.fetch(
        new Request("http://localhost/admin", {
          headers: { Authorization: "Bearer invalid" },
        })
      )
      expect(res.status).toBe(401)
    })

    test("returns 403 for user token on admin endpoint", async () => {
      const token = await signToken({ sub: "user-123", email: "test@example.com", type: "user" })
      const res = await app.fetch(
        new Request("http://localhost/admin", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(403)
    })

    test("passes for admin token", async () => {
      const token = await signToken({ sub: "admin-123", email: "admin@example.com", type: "admin" })
      const res = await app.fetch(
        new Request("http://localhost/admin", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.admin.type).toBe("admin")
    })
  })

  describe("reporterMiddleware", () => {
    const app = new Hono()
    app.use("/report", reporterMiddleware)
    app.post("/report", (c) => c.json({ user: c.get("user") }))

    test("returns 401 without token", async () => {
      const res = await app.fetch(
        new Request("http://localhost/report", { method: "POST" })
      )
      expect(res.status).toBe(401)
    })

    test("returns 401 with invalid token", async () => {
      const res = await app.fetch(
        new Request("http://localhost/report", {
          method: "POST",
          headers: { Authorization: "Bearer invalid" },
        })
      )
      expect(res.status).toBe(401)
    })

    test("returns 403 for admin trying to submit report", async () => {
      const token = await signToken({ sub: "admin-123", email: "admin@example.com", type: "admin" })
      const res = await app.fetch(
        new Request("http://localhost/report", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toContain("Admin tidak dapat")
    })

    test("passes for user token", async () => {
      const token = await signToken({ sub: "user-123", email: "user@example.com", type: "user" })
      const res = await app.fetch(
        new Request("http://localhost/report", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.user.type).toBe("user")
    })
  })
})
