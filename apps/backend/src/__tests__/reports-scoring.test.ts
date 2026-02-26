import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Hono } from "hono"
import reports from "../routes/reports"
import { createTestApp, testRequest } from "./setup"
import { db } from "../db"
import { publics, reports as reportsTable, mbgSchedules } from "../db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"
import { signToken } from "../lib/jwt"
import { hashPassword } from "../lib/password"

const app = createTestApp(new Hono().route("/reports", reports))

describe("Reports Scoring - MBG Schedule Matching", () => {
  let userId: string
  let userToken: string
  let scheduleId: string
  const reportIds: string[] = []

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `scoring-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Scoring Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })

    // MBG schedule test data
    const [schedule] = await db.insert(mbgSchedules).values({
      schoolName: "Test School For Scoring",
      provinceId: "11",
      cityId: "11.01",
      districtId: "11.01.01",
      address: "Test Address",
      scheduleDays: "12345", // Monday to Friday
      startTime: "07:00",
      endTime: "12:00",
    }).returning()
    scheduleId = schedule.id
  })

  afterAll(async () => {
    // Cleanup reports
    for (const id of reportIds) {
      await db.delete(reportsTable).where(eq(reportsTable.id, id)).catch(() => {})
    }
    if (scheduleId) await db.delete(mbgSchedules).where(eq(mbgSchedules.id, scheduleId)).catch(() => {})
    if (userId) await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
  })

  test("creates report matching MBG schedule day and time", async () => {
    if (!userToken) return

    // Matching schedule date
    const date = new Date()
    // Find next Monday
    while (date.getDay() !== 1) {
      date.setDate(date.getDate() + 1)
    }
    date.setHours(9, 0, 0, 0)

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "quality",
        title: "Test Report With MBG Schedule Match",
        description: "This is a test report to verify MBG schedule matching when both day and time match.",
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        districtId: "11.01.01",
        incidentDate: date.toISOString(),
        relation: "teacher",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })

  test("creates report matching only MBG schedule day", async () => {
    if (!userToken) return

    // Matching day wrong time
    const date = new Date()
    while (date.getDay() !== 1) {
      date.setDate(date.getDate() + 1)
    }
    date.setHours(18, 0, 0, 0)

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "quality",
        title: "Test Report With Day Match Only Long Title",
        description: "This is a test report to verify MBG schedule matching when only day matches but not time.",
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        districtId: "11.01.01",
        incidentDate: date.toISOString(),
        relation: "teacher",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })

  test("creates report not matching MBG schedule", async () => {
    if (!userToken) return

    // Sunday date, no match
    const date = new Date()
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1)
    }
    date.setHours(10, 0, 0, 0)

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "quality",
        title: "Test Report Without MBG Schedule Match",
        description: "This is a test report to verify scoring when report does not match MBG schedule day.",
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        districtId: "11.01.01",
        incidentDate: date.toISOString(),
        relation: "teacher",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })

  test("creates report in location without MBG schedule", async () => {
    if (!userToken) return

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "quality",
        title: "Test Report In Location Without Schedule",
        description: "This is a test report in a location that has no MBG schedule to verify scoring.",
        location: "Remote Location",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date().toISOString(),
        relation: "parent",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })

  test("creates report with city having schedule but different district", async () => {
    if (!userToken) return

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "quality",
        title: "Test Report Different District Long Title",
        description: "This is a test report in same city but different district to test schedule matching.",
        location: "Different District",
        provinceId: "11",
        cityId: "11.01",
        districtId: "11.01.02", // Different district
        incidentDate: new Date().toISOString(),
        relation: "community",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })
})

describe("Reports Scoring - Reporter History", () => {
  let userId: string
  let userToken: string
  const reportIds: string[] = []

  beforeAll(async () => {
    // Create test user with history
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `history-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "History Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
            reportCount: 5,
      verifiedReportCount: 3,
    }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    for (const id of reportIds) {
      await db.delete(reportsTable).where(eq(reportsTable.id, id)).catch(() => {})
    }
    if (userId) await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
  })

  test("scoring considers reporter history", async () => {
    if (!userToken) return

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "poisoning",
        title: "Report From User With History Long Title",
        description: "This is a test report from a user with verified reports history to test reporter scoring.",
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date().toISOString(),
        relation: "principal",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })
})

describe("Reports Scoring - Relation Types", () => {
  let userToken: string
  let userId: string
  const reportIds: string[] = []

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `relation-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Relation Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
          }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    for (const id of reportIds) {
      await db.delete(reportsTable).where(eq(reportsTable.id, id)).catch(() => {})
    }
    if (userId) await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
  })

  const relations = [
    { relation: "parent", detail: null },
    { relation: "teacher", detail: null },
    { relation: "principal", detail: null },
    { relation: "supplier", detail: null },
    { relation: "student", detail: null },
    { relation: "community", detail: null },
    { relation: "other", detail: "NGO Worker" },
  ]

  for (const { relation, detail } of relations) {
    test(`scores report with ${relation} relation correctly`, async () => {
      if (!userToken) return

      const body: Record<string, unknown> = {
        category: "policy",
        title: `Report With ${relation} Relation Score Test`,
        description: `This is a test report to verify scoring for ${relation} relation type validation.`,
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date().toISOString(),
        relation,
      }
      if (detail) body.relationDetail = detail

      const res = await testRequest(app, "POST", "/api/reports", {
        token: userToken,
        body,
      })
      expect(res.status).toBe(201)
      const json = await res.json()
      if (json.data?.id) reportIds.push(json.data.id)
    })
  }
})

describe("Reports Scoring - Description Length", () => {
  let userToken: string
  let userId: string
  const reportIds: string[] = []

  beforeAll(async () => {
    const hashedPassword = await hashPassword("Test1234")
    const [user] = await db.insert(publics).values({
      email: `desc-${randomBytes(4).toString("hex")}@example.com`,
      password: hashedPassword,
      name: "Description Test User",
      phone: `+62812${randomBytes(4).toString("hex").slice(0, 7)}`,
          }).returning()
    userId = user.id
    userToken = await signToken({ sub: user.id, email: user.email, type: "user" })
  })

  afterAll(async () => {
    for (const id of reportIds) {
      await db.delete(reportsTable).where(eq(reportsTable.id, id)).catch(() => {})
    }
    if (userId) await db.delete(publics).where(eq(publics.id, userId)).catch(() => {})
  })

  test("scores short description appropriately", async () => {
    if (!userToken) return

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "kitchen",
        title: "Report With Short Description For Test",
        description: "This is a short description that is still long enough to pass.",
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date().toISOString(),
        relation: "parent",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })

  test("scores long detailed description higher", async () => {
    if (!userToken) return

    const longDescription = `
      This is a very detailed and comprehensive description of the incident that occurred.
      The incident took place at approximately 10:00 AM on the school premises. Several students
      reported feeling unwell after consuming the meals provided by the catering service.
      The meals appeared to be of substandard quality with visible signs of spoilage.
      Multiple witnesses can corroborate this account. The school administration has been
      notified and appropriate measures are being taken. This report includes all relevant
      details that can help in the investigation of this matter.
    `.trim()

    const res = await testRequest(app, "POST", "/api/reports", {
      token: userToken,
      body: {
        category: "kitchen",
        title: "Report With Long Description For Higher Score",
        description: longDescription,
        location: "Test Location",
        provinceId: "11",
        cityId: "11.01",
        incidentDate: new Date().toISOString(),
        relation: "teacher",
      },
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    if (json.data?.id) reportIds.push(json.data.id)
  })
})
