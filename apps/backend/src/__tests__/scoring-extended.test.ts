import { describe, test, expect } from "bun:test"
import { calculateReportScore, recalculateEvidenceScore, updateTotalScore } from "../lib/scoring"

describe("Scoring Library - Extended Tests", () => {
  describe("calculateReportScore - Time Validation", () => {
    test("scores early morning reports (delivery time)", () => {
      const date = new Date()
      date.setHours(6, 30, 0, 0) // 6:30 AM - delivery time

      const result = calculateReportScore({
        relation: "supplier",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: date,
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores late night reports (preparation time)", () => {
      const date = new Date()
      date.setHours(22, 0, 0, 0) // 10 PM - preparation time

      const result = calculateReportScore({
        relation: "supplier",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: date,
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores early morning cooking time", () => {
      const date = new Date()
      date.setHours(3, 0, 0, 0) // 3 AM - cooking time

      const result = calculateReportScore({
        relation: "supplier",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: date,
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores midnight reports", () => {
      const date = new Date()
      date.setHours(0, 30, 0, 0) // 12:30 AM

      const result = calculateReportScore({
        relation: undefined,
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: date,
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores afternoon reports (non-primary)", () => {
      const date = new Date()
      date.setHours(15, 0, 0, 0) // 3 PM

      const result = calculateReportScore({
        relation: undefined,
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: date,
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreLocationTime).toBeGreaterThanOrEqual(0)
    })

    test("scores evening reports (after MBG hours)", () => {
      const date = new Date()
      date.setHours(18, 0, 0, 0) // 6 PM

      const result = calculateReportScore({
        relation: "parent",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: date,
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreLocationTime).toBeDefined()
    })
  })

  describe("calculateReportScore - Reporter History", () => {
    test("scores reporter with high verification rate", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 10,
        reporterVerifiedCount: 9,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreReporterHistory).toBeGreaterThanOrEqual(2)
    })

    test("scores reporter with no history", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreReporterHistory).toBe(1)
    })

    test("scores reporter with low verification rate", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 10,
        reporterVerifiedCount: 1,
        similarReportsCount: 0,
        locationHasHistory: false,
      })

      expect(result.scoreReporterHistory).toBeDefined()
    })
  })

  describe("calculateReportScore - MBG Schedule Match", () => {
    test("scores with schedule day and time match", () => {
      const result = calculateReportScore({
        relation: "teacher",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: true, timeMatches: true },
      })

      expect(result.scoreLocationTime).toBeGreaterThanOrEqual(2)
    })

    test("scores with schedule day match only", () => {
      const result = calculateReportScore({
        relation: "teacher",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: true, timeMatches: false },
      })

      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores with schedule time match only", () => {
      const result = calculateReportScore({
        relation: "teacher",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: false, timeMatches: true },
      })

      expect(result.scoreLocationTime).toBeDefined()
    })

    test("scores with no schedule match", () => {
      const result = calculateReportScore({
        relation: "teacher",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: false,
        mbgScheduleMatch: { exists: true, dayMatches: false, timeMatches: false },
      })

      expect(result.scoreLocationTime).toBeDefined()
    })
  })

  describe("calculateReportScore - Similarity", () => {
    test("scores with high similar reports count", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 10,
        locationHasHistory: true,
      })

      expect(result.scoreSimilarity).toBeGreaterThanOrEqual(2)
    })

    test("scores with location history but no similar reports", () => {
      const result = calculateReportScore({
        relation: "parent",
        description: "Test description that is long enough for the minimum requirement.",
        filesCount: 0,
        incidentDate: new Date(),
        provinceId: "11",
        cityId: "11.01",
        reporterReportCount: 0,
        reporterVerifiedCount: 0,
        similarReportsCount: 0,
        locationHasHistory: true,
      })

      expect(result.scoreSimilarity).toBeGreaterThanOrEqual(1)
    })
  })

  describe("recalculateEvidenceScore", () => {
    test("recalculates with detailed description and files", () => {
      const longDescription = "A".repeat(300)
      const score = recalculateEvidenceScore(longDescription, 3)
      expect(score).toBeGreaterThanOrEqual(2)
    })

    test("recalculates with short description and no files", () => {
      const score = recalculateEvidenceScore("Short", 0)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    test("recalculates with medium description", () => {
      const mediumDescription = "A".repeat(100)
      const score = recalculateEvidenceScore(mediumDescription, 1)
      expect(score).toBeGreaterThanOrEqual(1)
    })
  })

  describe("updateTotalScore", () => {
    test("calculates high credibility correctly", () => {
      const result = updateTotalScore({
        scoreRelation: 3,
        scoreLocationTime: 3,
        scoreEvidence: 3,
        scoreNarrative: 3,
        scoreReporterHistory: 3,
        scoreSimilarity: 3,
      })

      expect(result.totalScore).toBe(18)
      expect(result.credibilityLevel).toBe("high")
    })

    test("calculates medium credibility correctly", () => {
      const result = updateTotalScore({
        scoreRelation: 2,
        scoreLocationTime: 2,
        scoreEvidence: 2,
        scoreNarrative: 1,
        scoreReporterHistory: 1,
        scoreSimilarity: 1,
      })

      expect(result.credibilityLevel).toBe("medium")
    })

    test("calculates low credibility correctly", () => {
      const result = updateTotalScore({
        scoreRelation: 1,
        scoreLocationTime: 0,
        scoreEvidence: 0,
        scoreNarrative: 0,
        scoreReporterHistory: 0,
        scoreSimilarity: 0,
      })

      expect(result.credibilityLevel).toBe("low")
    })
  })
})
