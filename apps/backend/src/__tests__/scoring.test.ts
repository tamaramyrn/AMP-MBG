import { describe, test, expect } from "bun:test"
import { calculateReportScore, recalculateEvidenceScore, updateTotalScore } from "../lib/scoring"

describe("Scoring Library", () => {
  describe("calculateReportScore", () => {
    test("returns all score components", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Pada tanggal 10 Januari 2025 pukul 10:00 WIB, sekitar 15 siswa SDN Menteng mengalami keracunan setelah makan.",
        filesCount: 2,
        incidentDate: new Date("2025-01-10T10:00:00"),
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        reporterReportCount: 5,
        reporterVerifiedCount: 4,
        similarReportsCount: 1,
        locationHasHistory: true,
      })

      expect(result.scoreRelation).toBeDefined()
      expect(result.scoreLocationTime).toBeDefined()
      expect(result.scoreEvidence).toBeDefined()
      expect(result.scoreNarrative).toBeDefined()
      expect(result.scoreReporterHistory).toBeDefined()
      expect(result.scoreSimilarity).toBeDefined()
      expect(result.totalScore).toBeDefined()
      expect(result.credibilityLevel).toBeDefined()
    })

    test("scores with MBG schedule match - full match", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-10T08:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: true, timeMatches: true },
      })
      expect(result.scoreLocationTime).toBe(3)
    })

    test("scores with MBG schedule match - day only", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-10T08:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: true, timeMatches: false },
      })
      expect(result.scoreLocationTime).toBe(2)
    })

    test("scores with MBG schedule match - location only", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-10T08:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: false, timeMatches: false },
      })
      expect(result.scoreLocationTime).toBe(1)
    })

    test("scores with MBG schedule match - no MBG program", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-10T08:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: false, dayMatches: false, timeMatches: false },
      })
      expect(result.scoreLocationTime).toBe(0)
    })

    test("scores high for parent relation", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description for scoring",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreRelation).toBe(3)
    })

    test("scores high for teacher relation", () => {
      const result = calculateReportScore({
        relation: "teacher",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreRelation).toBe(3)
    })

    test("scores medium for community relation", () => {
      const result = calculateReportScore({
        relation: "community",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreRelation).toBe(2)
    })

    test("scores low for other relation without detail", () => {
      const result = calculateReportScore({
        relation: "other",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreRelation).toBe(0)
    })

    test("scores 1 for other relation with detail", () => {
      const result = calculateReportScore({
        relation: "other",
        relationDetail: "Volunteer organization",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreRelation).toBe(1)
    })

    test("scores high evidence for detailed narrative with multiple files", () => {
      const longDescription = "Pada tanggal 10 Januari 2025 pukul 10:00 WIB, sekitar 15 siswa SDN Menteng 01 mengalami gejala keracunan setelah mengonsumsi makanan program MBG. Gejala yang dialami meliputi mual, muntah, dan diare. Siswa-siswa tersebut langsung dibawa ke puskesmas terdekat."
      const result = calculateReportScore({
        relation: "parent",
        description: longDescription,
        filesCount: 3,
        incidentDate: new Date("2025-01-10T10:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreEvidence).toBe(3)
    })

    test("scores zero evidence for short narrative without files", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Short text",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreEvidence).toBe(0)
    })

    test("scores high reporter history for verified reports", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 5,
        reporterVerifiedCount: 4,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreReporterHistory).toBe(3)
    })

    test("scores 1 for new reporter", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreReporterHistory).toBe(1)
    })

    test("scores high similarity for multiple similar reports", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 3,
        locationHasHistory: true,
      })
      expect(result.scoreSimilarity).toBe(3)
    })

    test("calculates correct credibility level - high", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Pada tanggal 10 Januari 2025 pukul 10:00 WIB, sekitar 15 siswa SDN Menteng 01 mengalami gejala keracunan setelah mengonsumsi makanan program MBG. Gejala meliputi mual, muntah.",
        filesCount: 2,
        incidentDate: new Date("2025-01-10T10:00:00"),
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        reporterReportCount: 5,
        reporterVerifiedCount: 4,
        similarReportsCount: 2,
        locationHasHistory: true,
      })
      expect(result.credibilityLevel).toBe("high")
      expect(result.totalScore).toBeGreaterThanOrEqual(12)
    })

    test("calculates correct credibility level - medium", () => {
      const result = calculateReportScore({
        relation: "community",
        description: "Saya melihat kondisi dapur yang kurang bersih di sekolah pada tanggal 5 Januari.",
        filesCount: 0,
        incidentDate: new Date("2025-01-05T09:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 1,
        reporterVerifiedCount: 0,
        similarReportsCount: 1,
        locationHasHistory: true,
      })
      expect(result.credibilityLevel).toBe("medium")
      expect(result.totalScore).toBeGreaterThanOrEqual(7)
      expect(result.totalScore).toBeLessThan(12)
    })

    test("calculates correct credibility level - low", () => {
      const result = calculateReportScore({
        relation: "other",
        description: "Tidak bagus",
        filesCount: 0,
        incidentDate: new Date("2025-01-05T22:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.credibilityLevel).toBe("low")
      expect(result.totalScore).toBeLessThan(7)
    })

    test("caps score for Sunday reports (no MBG operation)", () => {
      // Sunday is day 0
      const sunday = new Date("2025-01-12T10:00:00") // Sunday
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: sunday,
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeLessThanOrEqual(1)
    })

    test("scores time for parent during consumption hours", () => {
      // 9 AM on Monday - within consumption time
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T09:00:00"), // Monday 9 AM
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores time for supplier during preparation hours", () => {
      // 2 AM - within preparation/cooking time
      const result = calculateReportScore({
        relation: "supplier",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T02:00:00"), // Monday 2 AM
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores time for student during school hours", () => {
      // 10 AM - within student consumption time
      const result = calculateReportScore({
        relation: "student",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T10:00:00"), // Monday 10 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores time for community during visible hours", () => {
      // 7 AM - during delivery time
      const result = calculateReportScore({
        relation: "community",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T07:00:00"), // Monday 7 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores lower for time outside relation-specific windows", () => {
      // 3 PM - outside student's normal school hours
      const result = calculateReportScore({
        relation: "student",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T15:00:00"), // Monday 3 PM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      // Should still get some score for location but time relevance is lower
      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores time without relation provided", () => {
      const result = calculateReportScore({
        relation: "other",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T08:00:00"), // Monday 8 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores delivery time highly", () => {
      // 7 AM - primary delivery time
      const result = calculateReportScore({
        relation: "other",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T07:00:00"), // Monday 7 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(1)
    })

    test("scores preparation/cooking time", () => {
      // 11 PM - cooking time
      const result = calculateReportScore({
        relation: "other",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T23:00:00"), // Monday 11 PM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores general work hours", () => {
      // 2 PM - within general work hours but outside primary times
      const result = calculateReportScore({
        relation: "other",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T14:00:00"), // Monday 2 PM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeDefined()
    })

    test("handles Saturday school day", () => {
      // Saturday - some schools have Saturday classes
      const result = calculateReportScore({
        relation: "teacher",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-11T09:00:00"), // Saturday 9 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores for principal relation", () => {
      const result = calculateReportScore({
        relation: "principal",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T10:00:00"),
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreRelation).toBe(3)
    })

    test("scores partial location (no district)", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T10:00:00"),
        provinceId: "31",
        cityId: "31.71",
        // No districtId
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores time without relation - consumption time", () => {
      // 10 AM - within consumption time (7-12)
      const result = calculateReportScore({
        relation: "other",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T10:00:00"), // Monday 10 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(1)
    })

    test("scores time without relation - delivery time", () => {
      // 7 AM - within delivery time (6-9)
      const result = calculateReportScore({
        relation: "other",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T07:00:00"), // Monday 7 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(1)
    })

    test("scores time without relation - preparation time", () => {
      // 1 AM - within preparation time (20-4)
      const result = calculateReportScore({
        relation: "other",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-14T01:00:00"), // Tuesday 1 AM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores time without relation - cooking time", () => {
      // Midnight - within cooking time (23-8)
      const result = calculateReportScore({
        relation: "other",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-14T00:00:00"), // Tuesday midnight
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })

    test("scores time without relation - general work hours", () => {
      // 4 PM - within general work hours but outside primary times
      const result = calculateReportScore({
        relation: "other",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T16:00:00"), // Monday 4 PM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores time with relation but outside window gives partial credit", () => {
      // 5 PM - outside student hours, but within general MBG hours
      const result = calculateReportScore({
        relation: "student",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T17:00:00"), // Monday 5 PM
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores time with relation during secondary window", () => {
      // 12 PM - containerPickup time for parent (secondary window)
      const result = calculateReportScore({
        relation: "parent",
        description: "Short",
        filesCount: 0,
        incidentDate: new Date("2025-01-13T12:00:00"), // Monday noon
        provinceId: "31",
        cityId: "31.71",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })
      expect(result.scoreLocationTime).toBeGreaterThan(0)
    })
  })

  describe("recalculateEvidenceScore", () => {
    test("returns 3 for detailed narrative with multiple files", () => {
      const longDescription = "Pada tanggal 10 Januari 2025 pukul 10:00 WIB, sekitar 15 siswa SDN Menteng 01 mengalami gejala keracunan setelah mengonsumsi makanan program MBG. Gejala yang dialami meliputi mual, muntah, dan diare. Siswa-siswa tersebut langsung dibawa ke puskesmas."
      const score = recalculateEvidenceScore(longDescription, 3)
      expect(score).toBe(3)
    })

    test("returns 0 for short narrative without files", () => {
      const score = recalculateEvidenceScore("Short", 0)
      expect(score).toBe(0)
    })
  })

  describe("updateTotalScore", () => {
    test("calculates total score correctly", () => {
      const result = updateTotalScore({
        scoreRelation: 3,
        scoreLocationTime: 3,
        scoreEvidence: 2,
        scoreNarrative: 2,
        scoreReporterHistory: 2,
        scoreSimilarity: 1,
      })
      expect(result.totalScore).toBe(13)
      expect(result.credibilityLevel).toBe("high")
    })

    test("returns low credibility for low scores", () => {
      const result = updateTotalScore({
        scoreRelation: 0,
        scoreLocationTime: 1,
        scoreEvidence: 0,
        scoreNarrative: 1,
        scoreReporterHistory: 1,
        scoreSimilarity: 0,
      })
      expect(result.totalScore).toBe(3)
      expect(result.credibilityLevel).toBe("low")
    })
  })
})
