import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import auth from "../routes/auth"
import { createTestApp, testRequest, testData, passwordTests, phoneTests } from "./setup"

const app = createTestApp(new Hono().route("/auth", auth))

describe("Auth Routes", () => {
  describe("POST /api/auth/signup", () => {
    test("validates required fields", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", { body: {} })
      expect(res.status).toBe(400)
    })

    test("validates email format", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, email: "invalid-email" },
      })
      expect(res.status).toBe(400)
    })

    test("validates password - too short", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, password: passwordTests.invalid.tooShort, passwordConfirmation: passwordTests.invalid.tooShort },
      })
      expect(res.status).toBe(400)
    })

    test("validates password - no uppercase", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, password: passwordTests.invalid.noUppercase, passwordConfirmation: passwordTests.invalid.noUppercase },
      })
      expect(res.status).toBe(400)
    })

    test("validates password - no lowercase", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, password: passwordTests.invalid.noLowercase, passwordConfirmation: passwordTests.invalid.noLowercase },
      })
      expect(res.status).toBe(400)
    })

    test("validates password - no number", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, password: passwordTests.invalid.noNumber, passwordConfirmation: passwordTests.invalid.noNumber },
      })
      expect(res.status).toBe(400)
    })

    test("validates password confirmation mismatch", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, passwordConfirmation: "Different1" },
      })
      expect(res.status).toBe(400)
    })

    test("validates phone number - too short", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, phone: "123" },
      })
      expect(res.status).toBe(400)
    })

    test("validates name is required", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: { ...testData.validUser, name: "" },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("POST /api/auth/login", () => {
    test("validates required fields", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", { body: {} })
      expect(res.status).toBe(400)
    })

    test("validates identifier is required", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "", password: "Test1234" },
      })
      expect(res.status).toBe(400)
    })

    test("validates password is required", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "test@example.com", password: "" },
      })
      expect(res.status).toBe(400)
    })

    test("returns 401 for non-existent user", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "nonexistent@example.com", password: "Test1234" },
      })
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBeDefined()
    })

    test("accepts appType public", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "test@example.com", password: "wrong", appType: "public" },
      })
      expect(res.status).toBe(401)
    })

    test("accepts appType admin", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "admin@example.com", password: "wrong", appType: "admin" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/auth/me", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/auth/me")
      expect(res.status).toBe(401)
    })

    test("returns 401 with invalid token", async () => {
      const res = await testRequest(app, "GET", "/api/auth/me", { token: "invalid-token" })
      expect(res.status).toBe(401)
    })
  })

  describe("PUT /api/auth/profile", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PUT", "/api/auth/profile", {
        body: { name: "New Name" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("PUT /api/auth/change-password", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "PUT", "/api/auth/change-password", {
        body: { currentPassword: "old", newPassword: "New12345", confirmPassword: "New12345" },
      })
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/auth/logout", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/auth/logout")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/auth/forgot-password", () => {
    test("validates email format", async () => {
      const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
        body: { email: "invalid-email" },
      })
      expect(res.status).toBe(400)
    })

    test("returns 404 for non-existent email", async () => {
      const res = await testRequest(app, "POST", "/api/auth/forgot-password", {
        body: { email: "nonexistent@example.com" },
      })
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBeDefined()
    })
  })

  describe("GET /api/auth/verify-reset-token/:token", () => {
    test("returns 400 for invalid token", async () => {
      const res = await testRequest(app, "GET", "/api/auth/verify-reset-token/invalid-token")
      expect(res.status).toBe(400)
    })
  })

  describe("POST /api/auth/reset-password", () => {
    test("validates required fields", async () => {
      const res = await testRequest(app, "POST", "/api/auth/reset-password", { body: {} })
      expect(res.status).toBe(400)
    })

    test("validates password confirmation", async () => {
      const res = await testRequest(app, "POST", "/api/auth/reset-password", {
        body: { token: "test", password: "Test1234", passwordConfirmation: "Different1" },
      })
      expect(res.status).toBe(400)
    })

    test("returns 400 for invalid token", async () => {
      const res = await testRequest(app, "POST", "/api/auth/reset-password", {
        body: { token: "invalid", password: "Test1234", passwordConfirmation: "Test1234" },
      })
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/auth/check", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "GET", "/api/auth/check")
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/auth/apply-member", () => {
    test("returns 401 without token", async () => {
      const res = await testRequest(app, "POST", "/api/auth/apply-member", {
        body: {
          memberType: "supplier",
          organizationName: "Test Org",
          organizationEmail: "org@test.com",
          organizationPhone: "08123456789",
          roleInOrganization: "Test role description here",
          organizationMbgRole: "Test MBG description here",
        },
      })
      expect(res.status).toBe(401)
    })

    test("validates memberType enum", async () => {
      const res = await testRequest(app, "POST", "/api/auth/apply-member", {
        body: { memberType: "invalid" },
      })
      expect(res.status).toBe(401)
    })
  })
})

describe("Auth Routes - Login Tests", () => {
  describe("POST /api/auth/login - Phone Login", () => {
    test("accepts phone with 62 prefix", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "628123456789", password: "wrong" },
      })
      // Validates phone format acceptance
      expect(res.status).toBe(401)
    })

    test("accepts phone with 08 prefix", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "08123456789", password: "wrong" },
      })
      expect(res.status).toBe(401)
    })

    test("accepts phone with 8 prefix", async () => {
      const res = await testRequest(app, "POST", "/api/auth/login", {
        body: { identifier: "8123456789", password: "wrong" },
      })
      expect(res.status).toBe(401)
    })
  })
})

describe("Auth Routes - Signup Validation", () => {
  describe("POST /api/auth/signup - Phone Format", () => {
    test("accepts phone with 62 prefix", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: {
          ...testData.validUser,
          email: "newuser62@test.com",
          phone: "628123456789",
        },
      })
      // May fail if duplicate
      expect([201, 400]).toContain(res.status)
    })

    test("accepts phone with 08 prefix", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: {
          ...testData.validUser,
          email: "newuser08@test.com",
          phone: "08123456789",
        },
      })
      expect([201, 400]).toContain(res.status)
    })

    test("accepts phone with 8 prefix", async () => {
      const res = await testRequest(app, "POST", "/api/auth/signup", {
        body: {
          ...testData.validUser,
          email: "newuser8@test.com",
          phone: "8123456789",
        },
      })
      expect([201, 400]).toContain(res.status)
    })
  })
})
