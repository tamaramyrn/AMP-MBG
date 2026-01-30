import { describe, test, expect } from "bun:test"
import { Hono } from "hono"
import categories from "../routes/categories"
import { createTestApp, testRequest } from "./setup"

const app = createTestApp(new Hono().route("/categories", categories))

describe("Categories Routes", () => {
  describe("GET /api/categories", () => {
    test("returns list of report categories", async () => {
      const res = await testRequest(app, "GET", "/api/categories")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })

    test("returns correct category structure", async () => {
      const res = await testRequest(app, "GET", "/api/categories")
      const json = await res.json()
      expect(json.data.length).toBeGreaterThan(0)
      expect(json.data[0].value).toBeDefined()
      expect(json.data[0].label).toBeDefined()
    })

    test("contains expected categories", async () => {
      const res = await testRequest(app, "GET", "/api/categories")
      const json = await res.json()
      const values = json.data.map((c: { value: string }) => c.value)
      expect(values).toContain("poisoning")
      expect(values).toContain("kitchen")
      expect(values).toContain("quality")
    })
  })

  describe("GET /api/categories/statuses", () => {
    test("returns list of report statuses", async () => {
      const res = await testRequest(app, "GET", "/api/categories/statuses")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })

    test("contains all 6 statuses", async () => {
      const res = await testRequest(app, "GET", "/api/categories/statuses")
      const json = await res.json()
      expect(json.data.length).toBe(6)
      const values = json.data.map((s: { value: string }) => s.value)
      expect(values).toContain("pending")
      expect(values).toContain("analyzing")
      expect(values).toContain("needs_evidence")
      expect(values).toContain("invalid")
      expect(values).toContain("in_progress")
      expect(values).toContain("resolved")
    })
  })

  describe("GET /api/categories/relations", () => {
    test("returns list of reporter relations", async () => {
      const res = await testRequest(app, "GET", "/api/categories/relations")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })

    test("contains expected relations", async () => {
      const res = await testRequest(app, "GET", "/api/categories/relations")
      const json = await res.json()
      const values = json.data.map((r: { value: string }) => r.value)
      expect(values).toContain("parent")
      expect(values).toContain("teacher")
      expect(values).toContain("student")
    })
  })

  describe("GET /api/categories/credibility-levels", () => {
    test("returns list of credibility levels", async () => {
      const res = await testRequest(app, "GET", "/api/categories/credibility-levels")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })

    test("contains high, medium, low levels", async () => {
      const res = await testRequest(app, "GET", "/api/categories/credibility-levels")
      const json = await res.json()
      const values = json.data.map((l: { value: string }) => l.value)
      expect(values).toContain("high")
      expect(values).toContain("medium")
      expect(values).toContain("low")
    })
  })

  describe("GET /api/categories/roles", () => {
    test("returns list of user roles", async () => {
      const res = await testRequest(app, "GET", "/api/categories/roles")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })

    test("contains admin and public roles", async () => {
      const res = await testRequest(app, "GET", "/api/categories/roles")
      const json = await res.json()
      const values = json.data.map((r: { value: string }) => r.value)
      expect(values).toContain("admin")
      expect(values).toContain("public")
    })
  })
})
