import { describe, test, expect } from "bun:test"
import { Hono } from "hono"
import locations from "../routes/locations"
import { createTestApp, testRequest } from "./setup"

const app = createTestApp(new Hono().route("/locations", locations))

describe("Locations Routes", () => {
  describe("GET /api/locations/provinces", () => {
    test("returns list of provinces", async () => {
      const res = await testRequest(app, "GET", "/api/locations/provinces")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })
  })

  describe("GET /api/locations/provinces/:provinceId/cities", () => {
    test("returns list of cities for province", async () => {
      const res = await testRequest(app, "GET", "/api/locations/provinces/32/cities")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })
  })

  describe("GET /api/locations/cities/:cityId/districts", () => {
    test("returns list of districts for city", async () => {
      const res = await testRequest(app, "GET", "/api/locations/cities/3201/districts")
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
      expect(Array.isArray(json.data)).toBe(true)
    })
  })
})
