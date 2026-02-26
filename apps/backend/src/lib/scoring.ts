import type { CredibilityLevel, ReporterRelation } from "../types"

export interface MbgScheduleMatch {
  exists: boolean
  dayMatches: boolean
  timeMatches: boolean
}

export interface ScoringInput {
  relation: ReporterRelation
  relationDetail?: string | null
  description: string
  filesCount: number
  incidentDate: Date
  provinceId: string
  cityId: string
  districtId?: string | null
  reporterReportCount: number
  reporterVerifiedCount: number
  similarReportsCount: number
  locationHasHistory: boolean
  mbgScheduleMatch?: MbgScheduleMatch
}

export interface ScoringResult {
  scoreRelation: number
  scoreLocationTime: number
  scoreEvidence: number
  scoreNarrative: number
  scoreReporterHistory: number
  scoreSimilarity: number
  totalScore: number
  credibilityLevel: CredibilityLevel
}

// MBG operation time windows
interface TimeWindow {
  start: number
  end: number
  crossesMidnight: boolean
}

const MBG_TIME_WINDOWS: Record<string, TimeWindow> = {
  prepare: { start: 20, end: 3, crossesMidnight: true },
  cooking: { start: 23, end: 8, crossesMidnight: true },
  packing: { start: 3, end: 10, crossesMidnight: false },
  delivery: { start: 6, end: 9, crossesMidnight: false },
  consumption: { start: 7, end: 12, crossesMidnight: false },
  containerPickup: { start: 12, end: 13, crossesMidnight: false },
  washing: { start: 12, end: 20, crossesMidnight: false },
}

// Relation time windows
const RELATION_TIME_WINDOWS: Record<ReporterRelation, string[]> = {
  supplier: ["prepare", "cooking", "packing", "delivery"],
  student: ["consumption", "delivery"],
  parent: ["delivery", "consumption", "containerPickup"],
  teacher: ["delivery", "consumption", "containerPickup"],
  principal: ["delivery", "consumption", "containerPickup"],
  community: ["delivery", "consumption", "containerPickup", "washing"],
  other: ["prepare", "cooking", "packing", "delivery", "consumption", "containerPickup", "washing"],
}

function isWithinTimeWindow(hour: number, window: TimeWindow): boolean {
  if (window.crossesMidnight) {
    return hour >= window.start || hour < window.end
  }
  return hour >= window.start && hour < window.end
}

// Check time-relation match
function checkTimeMatchesRelation(hour: number, relation: ReporterRelation): { matches: boolean; relevance: number } {
  const relevantWindows = RELATION_TIME_WINDOWS[relation]
  let bestRelevance = 0

  for (const windowName of relevantWindows) {
    const window = MBG_TIME_WINDOWS[windowName]
    if (isWithinTimeWindow(hour, window)) {
      const relevance = relevantWindows.indexOf(windowName) === 0 ? 1.0 : 0.7
      bestRelevance = Math.max(bestRelevance, relevance)
    }
  }

  const isWithinAnyWindow = Object.values(MBG_TIME_WINDOWS).some(w => isWithinTimeWindow(hour, w))
  if (isWithinAnyWindow && bestRelevance === 0) {
    bestRelevance = 0.3
  }

  return { matches: bestRelevance > 0, relevance: bestRelevance }
}

// Score relation (0-3)
function scoreRelation(relation: ReporterRelation, detail?: string | null): number {
  const highRelations: ReporterRelation[] = ["student", "parent", "teacher", "principal", "supplier"]
  if (highRelations.includes(relation)) return 3
  if (relation === "community") return 2
  if (relation === "other" && detail && detail.trim().length > 0) return 1
  return 0
}

// Score location/time (0-3)
function scoreLocationTime(
  incidentDate: Date,
  provinceId: string,
  cityId: string,
  districtId?: string | null,
  mbgMatch?: MbgScheduleMatch,
  relation?: ReporterRelation
): number {
  if (mbgMatch) {
    if (mbgMatch.exists && mbgMatch.dayMatches && mbgMatch.timeMatches) return 3
    if (mbgMatch.exists && mbgMatch.dayMatches) return 2
    if (mbgMatch.exists) return 1
    return 0
  }

  let score = 0

  if (provinceId && cityId && districtId) {
    score += 1.5
  } else if (provinceId && cityId) {
    score += 1
  }

  const dayOfWeek = incidentDate.getDay()
  const isSchoolDay = dayOfWeek >= 1 && dayOfWeek <= 5
  const isSaturday = dayOfWeek === 6
  const hour = incidentDate.getHours()

  if (!isSchoolDay && !isSaturday) {
    return Math.min(1, score)
  }

  if (relation) {
    const timeCheck = checkTimeMatchesRelation(hour, relation)
    if (timeCheck.matches) {
      score += 1.5 * timeCheck.relevance
    } else {
      const isWithinGeneralMbgHours =
        (hour >= 6 && hour <= 14) || (hour >= 20 || hour < 10)
      if (isWithinGeneralMbgHours) {
        score += 0.5
      }
    }
  } else {
    const isConsumptionTime = hour >= 7 && hour <= 12
    const isDeliveryTime = hour >= 6 && hour < 9
    const isPreparationTime = hour >= 20 || hour < 4
    const isCookingTime = hour >= 23 || hour < 8

    if (isDeliveryTime || isConsumptionTime) {
      score += 1.5
    } else if (isPreparationTime || isCookingTime) {
      score += 1.0
    } else {
      score += 0.5
    }
  }

  return Math.min(3, Math.ceil(score))
}

// Score evidence quality (0-3)
function scoreEvidence(description: string, filesCount: number): number {
  const descLength = description.trim().length
  const hasDetailedNarrative = descLength >= 200

  if (hasDetailedNarrative && filesCount > 1) return 3
  if (hasDetailedNarrative && filesCount >= 1) return 2
  if (hasDetailedNarrative || (descLength >= 100 && filesCount >= 1)) return 1
  return 0
}

// Score narrative (0-3)
function scoreNarrative(description: string): number {
  const text = description.toLowerCase()

  const factualIndicators = [
    /\d{1,2}[:\-\/]\d{1,2}/, // Time pattern
    /tanggal|hari|jam|pukul/, // Date/time words
    /nama|lokasi|tempat|sekolah/, // Specific place references
    /siswa|murid|anak|guru|kepala/, // Person references
    /makanan|menu|nasi|lauk|sayur/, // Food references
  ]

  const opinionIndicators = [
    /sangat buruk|parah sekali|tidak becus/,
    /korupsi|curiga|mencurigakan/,
    /pasti|yakin|jelas sekali/,
    /!!!|\.\.\.|\?\?\?/, // Excessive punctuation
  ]

  let factualScore = 0
  let opinionPenalty = 0

  for (const pattern of factualIndicators) {
    if (pattern.test(text)) factualScore++
  }

  for (const pattern of opinionIndicators) {
    if (pattern.test(text)) opinionPenalty++
  }

  if (factualScore >= 3 && opinionPenalty === 0) return 3
  if (factualScore >= 2 && opinionPenalty <= 1) return 2
  if (factualScore >= 1) return 1
  return 0
}

// Score reporter history (0-3)
function scoreReporterHistory(reportCount: number, verifiedCount: number): number {
  if (reportCount === 0) return 1
  const verifiedRatio = verifiedCount / reportCount
  if (verifiedRatio >= 0.5 && reportCount >= 2) return 3
  if (verifiedRatio >= 0.3) return 2
  if (reportCount <= 2) return 1
  return 0
}

// Score report similarity (0-3)
function scoreSimilarity(similarCount: number, locationHasHistory: boolean): number {
  if (similarCount >= 2) return 3
  if (similarCount === 1) return 2
  if (locationHasHistory) return 1
  return 0
}

// Credibility level thresholds
function getCredibilityLevel(totalScore: number): CredibilityLevel {
  if (totalScore >= 12) return "high"
  if (totalScore >= 7) return "medium"
  return "low"
}

export function calculateReportScore(input: ScoringInput): ScoringResult {
  const scores = {
    scoreRelation: scoreRelation(input.relation, input.relationDetail),
    scoreLocationTime: scoreLocationTime(
      input.incidentDate,
      input.provinceId,
      input.cityId,
      input.districtId,
      input.mbgScheduleMatch,
      input.relation
    ),
    scoreEvidence: scoreEvidence(input.description, input.filesCount),
    scoreNarrative: scoreNarrative(input.description),
    scoreReporterHistory: scoreReporterHistory(
      input.reporterReportCount,
      input.reporterVerifiedCount
    ),
    scoreSimilarity: scoreSimilarity(input.similarReportsCount, input.locationHasHistory),
  }

  const totalScore =
    scores.scoreRelation +
    scores.scoreLocationTime +
    scores.scoreEvidence +
    scores.scoreNarrative +
    scores.scoreReporterHistory +
    scores.scoreSimilarity

  return {
    ...scores,
    totalScore,
    credibilityLevel: getCredibilityLevel(totalScore),
  }
}

// Recalculate on file upload
export function recalculateEvidenceScore(description: string, newFilesCount: number): number {
  return scoreEvidence(description, newFilesCount)
}

export function updateTotalScore(scores: Omit<ScoringResult, "totalScore" | "credibilityLevel">): {
  totalScore: number
  credibilityLevel: CredibilityLevel
} {
  const totalScore =
    scores.scoreRelation +
    scores.scoreLocationTime +
    scores.scoreEvidence +
    scores.scoreNarrative +
    scores.scoreReporterHistory +
    scores.scoreSimilarity

  return {
    totalScore,
    credibilityLevel: getCredibilityLevel(totalScore),
  }
}
