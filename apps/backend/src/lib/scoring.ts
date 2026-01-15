import type { CredibilityLevel, ReporterRelation } from "../types"

export interface MbgScheduleMatch {
  exists: boolean           // MBG schedule exists in this location
  dayMatches: boolean       // Incident day matches MBG schedule days
  timeMatches: boolean      // Incident time within MBG hours
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
  mbgScheduleMatch?: MbgScheduleMatch // MBG schedule validation
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

// Score relation to MBG (0-3)
function scoreRelation(relation: ReporterRelation, detail?: string | null): number {
  // Score 3: Internal parties (student, parent, teacher, principal, supplier)
  const highRelations: ReporterRelation[] = ["student", "parent", "teacher", "principal", "supplier"]
  if (highRelations.includes(relation)) return 3

  // Score 2: Community members
  if (relation === "community") return 2

  // Score 1: Other with detail provided
  if (relation === "other" && detail && detail.trim().length > 0) return 1

  // Score 0: Other without detail or unspecified
  return 0
}

// Score location and time validity (0-3)
// Score 3: Location + day + time all match MBG schedule
// Score 2: Location + day match (time unclear)
// Score 1: Only location or only day matches
// Score 0: No match or incomplete data
function scoreLocationTime(
  incidentDate: Date,
  provinceId: string,
  cityId: string,
  districtId?: string | null,
  mbgMatch?: MbgScheduleMatch
): number {
  // If we have MBG schedule data, use it for accurate scoring
  if (mbgMatch) {
    if (mbgMatch.exists && mbgMatch.dayMatches && mbgMatch.timeMatches) {
      return 3 // Full match with MBG schedule
    }
    if (mbgMatch.exists && mbgMatch.dayMatches) {
      return 2 // Location and day match
    }
    if (mbgMatch.exists) {
      return 1 // Only location has MBG program
    }
    return 0 // No MBG program at this location
  }

  // Fallback: Basic validation if no MBG schedule data
  let score = 0

  // Check if location is complete
  if (provinceId && cityId && districtId) {
    score += 1.5 // Full location provided
  } else if (provinceId && cityId) {
    score += 1 // Partial location
  }

  // Check time validity (MBG typically runs Mon-Fri, morning)
  const dayOfWeek = incidentDate.getDay()
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  const hour = incidentDate.getHours()
  const isMorning = hour >= 6 && hour <= 14

  if (isWeekday && isMorning) {
    score += 1.5 // Matches typical MBG time
  } else if (isWeekday) {
    score += 1 // At least on school day
  }

  return Math.min(3, Math.round(score))
}

// Score supporting evidence (0-3)
function scoreEvidence(description: string, filesCount: number): number {
  const descLength = description.trim().length
  const hasDetailedNarrative = descLength >= 200

  // Score 3: Detailed narrative + multiple files
  if (hasDetailedNarrative && filesCount > 1) return 3

  // Score 2: Detailed narrative + 1 file OR moderate narrative + multiple files
  if ((hasDetailedNarrative && filesCount === 1) || (descLength >= 100 && filesCount > 1)) return 2

  // Score 1: Detailed narrative only OR moderate narrative with file
  if (hasDetailedNarrative || (descLength >= 100 && filesCount >= 1)) return 1

  // Score 0: Short narrative without evidence
  return 0
}

// Score narrative consistency (0-3)
function scoreNarrative(description: string): number {
  const text = description.toLowerCase()

  // Check for factual indicators
  const factualIndicators = [
    /\d{1,2}[:\-\/]\d{1,2}/, // Time pattern
    /tanggal|hari|jam|pukul/, // Date/time words
    /nama|lokasi|tempat|sekolah/, // Specific place references
    /siswa|murid|anak|guru|kepala/, // Person references
    /makanan|menu|nasi|lauk|sayur/, // Food references
  ]

  // Check for opinion/emotional indicators (reduce score)
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

  // Calculate score
  if (factualScore >= 3 && opinionPenalty === 0) return 3
  if (factualScore >= 2 && opinionPenalty <= 1) return 2
  if (factualScore >= 1) return 1
  return 0
}

// Score reporter history (0-3)
function scoreReporterHistory(reportCount: number, verifiedCount: number): number {
  // New reporter
  if (reportCount === 0) return 1

  const verifiedRatio = verifiedCount / reportCount

  // Score 3: Majority verified
  if (verifiedRatio >= 0.7 && reportCount >= 2) return 3

  // Score 2: Mixed history
  if (verifiedRatio >= 0.4) return 2

  // Score 1: New or few reports
  if (reportCount <= 2) return 1

  // Score 0: Majority not verified
  return 0
}

// Score similarity with other reports (0-3)
function scoreSimilarity(similarCount: number, locationHasHistory: boolean): number {
  // Score 3: Multiple similar reports
  if (similarCount >= 2) return 3

  // Score 2: One similar report
  if (similarCount === 1) return 2

  // Score 1: Location has history
  if (locationHasHistory) return 1

  // Score 0: No similar reports
  return 0
}

// Determine credibility level based on total score
function getCredibilityLevel(totalScore: number): CredibilityLevel {
  if (totalScore >= 12) return "high"
  if (totalScore >= 7) return "medium"
  return "low"
}

// Main scoring function
export function calculateReportScore(input: ScoringInput): ScoringResult {
  const scores = {
    scoreRelation: scoreRelation(input.relation, input.relationDetail),
    scoreLocationTime: scoreLocationTime(
      input.incidentDate,
      input.provinceId,
      input.cityId,
      input.districtId,
      input.mbgScheduleMatch
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

// Re-calculate score when files are added
export function recalculateEvidenceScore(description: string, newFilesCount: number): number {
  return scoreEvidence(description, newFilesCount)
}

// Update total score helper
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
