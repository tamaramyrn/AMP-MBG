import { Hono } from "hono"
import { signToken } from "../lib/jwt"

// Test app instance
export function createTestApp(routes: Hono) {
  const app = new Hono()
  app.route("/api", routes)
  return app
}

// Generate test JWT token
export async function generateTestToken(userId: string, email: string, type: "admin" | "user") {
  return signToken({ sub: userId, email, type })
}

// Test request helper
export async function testRequest(
  app: Hono,
  method: string,
  path: string,
  options: { body?: unknown; token?: string; formData?: FormData } = {}
) {
  const headers: Record<string, string> = {}

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`
  }

  let requestBody: BodyInit | undefined
  if (options.formData) {
    requestBody = options.formData
  } else if (options.body) {
    headers["Content-Type"] = "application/json"
    requestBody = JSON.stringify(options.body)
  }

  const req = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: requestBody,
  })

  return app.fetch(req)
}

// Test data generators
export const testData = {
  validUser: {
    name: "Test User",
    email: "test@example.com",
    phone: "812345678901",
    password: "Test1234",
    passwordConfirmation: "Test1234",
  },

  validAdmin: {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin1234",
    adminRole: "Super Admin",
  },

  validMember: {
    name: "Member User",
    email: "member@example.com",
    phone: "08123456789",
    memberType: "foundation" as const,
  },

  validReport: {
    category: "poisoning" as const,
    title: "Test Report Title That Is Long Enough",
    description: "This is a test description that is long enough to pass validation. It needs to be at least 50 characters.",
    location: "Test Location Address",
    provinceId: "32",
    cityId: "3201",
    incidentDate: new Date().toISOString(),
    relation: "parent" as const,
  },

  validKitchenNeed: {
    title: "Test Kitchen Need",
    description: "This is a test kitchen need description",
    sortOrder: 1,
  },

  validKitchenRequest: {
    kitchenNeedId: "",
    sppgName: "Test SPPG Name",
    contactPerson: "Test Contact",
    position: "Manager",
    phoneNumber: "08123456789",
    details: "This is test details that is long enough",
  },

  validMbgSchedule: {
    schoolName: "SD Negeri Test",
    provinceId: "32",
    cityId: "3201",
    districtId: "3201010",
    address: "Jl. Test No. 123",
    scheduleDays: "12345",
    startTime: "07:00",
    endTime: "12:00",
  },
}

// Password validation tests
export const passwordTests = {
  valid: ["Test1234", "Password1", "MyPass123", "Abc12345"],
  invalid: {
    tooShort: "Test1",
    noUppercase: "test1234",
    noLowercase: "TEST1234",
    noNumber: "TestPassword",
  },
}

// Phone format tests
export const phoneTests = {
  valid: ["812345678901", "08123456789", "62812345678"],
  invalid: ["123", "abcdefghij", ""],
}
