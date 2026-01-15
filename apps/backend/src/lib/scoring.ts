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

/**
 * MBG Schedule Time Windows (WIB - Western Indonesia Time):
 * - 20:00 – 03:00: Tim Prepare (preparation team)
 * - 23:00 – 08:00: Tim Cooking (cooking team)
 * - 03:00 – 10:00: Tim Packing/Pemorsian (packing/portioning team)
 * - 06:30: Tim Pengantaran - Kirim Makanan (delivery - send food)
 * - 12:00: Tim Pengantaran - Jemput Wadah (delivery - pickup containers)
 * - 12:00 – 20:00: Tim Cuci/Steward (washing/steward team)
 * 
 * Key consumption windows:
 * - 06:30 – 08:00: Food delivery to schools
 * - 07:00 – 12:00: Student consumption time (breakfast/snack at school)
 */

// MBG operation time windows based on actual schedule
interface TimeWindow {
  start: number  // Hour in 24h format
  end: number    // Hour in 24h format
  crossesMidnight: boolean
}

const MBG_TIME_WINDOWS: Record<string, TimeWindow> = {
  // Preparation phase
  prepare: { start: 20, end: 3, crossesMidnight: true },
  // Cooking phase  
  cooking: { start: 23, end: 8, crossesMidnight: true },
  // Packing phase
  packing: { start: 3, end: 10, crossesMidnight: false },
  // Food delivery to schools (with 30min buffer)
  delivery: { start: 6, end: 8, crossesMidnight: false },
  // Student consumption time at school
  consumption: { start: 7, end: 12, crossesMidnight: false },
  // Container pickup
  containerPickup: { start: 11, end: 13, crossesMidnight: false },
  // Washing/steward phase
  washing: { start: 12, end: 20, crossesMidnight: false },
}

// Map relations to relevant MBG time windows
const RELATION_TIME_WINDOWS: Record<ReporterRelation, string[]> = {
  // Supplier would be involved in prepare, cooking, packing phases
  supplier: ["prepare", "cooking", "packing", "delivery"],
  // Students primarily during consumption time
  student: ["consumption", "delivery"],
  // Parents when dropping off children or picking up, also consumption reports
  parent: ["delivery", "consumption", "containerPickup"],
  // Teachers throughout school hours
  teacher: ["delivery", "consumption", "containerPickup"],
  // Principal same as teacher
  principal: ["delivery", "consumption", "containerPickup"],
  // Community could observe any phase, but primarily delivery/visible phases
  community: ["delivery", "consumption", "containerPickup", "washing"],
  // Other - could be any time
  other: ["prepare", "cooking", "packing", "delivery", "consumption", "containerPickup", "washing"],
}

/**
 * Check if a given hour falls within a time window
 */
function isWithinTimeWindow(hour: number, window: TimeWindow): boolean {
  if (window.crossesMidnight) {
    // For windows that cross midnight (e.g., 20:00-03:00)
    return hour >= window.start || hour < window.end
  }
  return hour >= window.start && hour < window.end
}

/**
 * Check if incident time matches appropriate MBG schedule for the reporter's relation
 */
function checkTimeMatchesRelation(hour: number, relation: ReporterRelation): { matches: boolean; relevance: number } {
  const relevantWindows = RELATION_TIME_WINDOWS[relation]
  let bestRelevance = 0
  
  for (const windowName of relevantWindows) {
    const window = MBG_TIME_WINDOWS[windowName]
    if (isWithinTimeWindow(hour, window)) {
      // Primary window match (first in list) gets higher relevance
      const relevance = relevantWindows.indexOf(windowName) === 0 ? 1.0 : 0.7
      bestRelevance = Math.max(bestRelevance, relevance)
    }
  }
  
  // Also check if time is within any MBG operation window (general match)
  const isWithinAnyWindow = Object.values(MBG_TIME_WINDOWS).some(w => isWithinTimeWindow(hour, w))
  if (isWithinAnyWindow && bestRelevance === 0) {
    bestRelevance = 0.3 // Partial match - within MBG ops but not relation-specific
  }
  
  return { matches: bestRelevance > 0, relevance: bestRelevance }
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
// Now integrates with MBG schedule and relation-based time validation
function scoreLocationTime(
  incidentDate: Date,
  provinceId: string,
  cityId: string,
  districtId?: string | null,
  mbgMatch?: MbgScheduleMatch,
  relation?: ReporterRelation
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

  // Enhanced fallback: Validate against MBG schedule times
  let score = 0

  // Check if location is complete (max 1.5 points)
  if (provinceId && cityId && districtId) {
    score += 1.5 // Full location provided
  } else if (provinceId && cityId) {
    score += 1 // Partial location
  }

  // Check time validity against MBG schedule
  const dayOfWeek = incidentDate.getDay()
  const isSchoolDay = dayOfWeek >= 1 && dayOfWeek <= 5 // Mon-Fri (school days)
  const isSaturday = dayOfWeek === 6 // Some areas have Saturday school
  const hour = incidentDate.getHours()

  // MBG operates Mon-Fri typically, some areas on Saturday
  if (!isSchoolDay && !isSaturday) {
    // Sunday - MBG doesn't operate
    return Math.min(1, score) // Cap at 1 for Sunday reports
  }

  // Validate time against relation-specific MBG windows
  if (relation) {
    const timeCheck = checkTimeMatchesRelation(hour, relation)
    if (timeCheck.matches) {
      // Time matches relation's expected MBG window
      score += 1.5 * timeCheck.relevance
    } else {
      // Time doesn't match - still give partial credit if within general MBG hours
      const isWithinGeneralMbgHours = 
        (hour >= 6 && hour <= 14) || // Primary school hours
        (hour >= 20 || hour < 10)    // Preparation/cooking hours
      
      if (isWithinGeneralMbgHours) {
        score += 0.5
      }
    }
  } else {
    // No relation provided - use general MBG time validation
    // Key times: 06:30-08:00 delivery, 07:00-12:00 consumption
    const isConsumptionTime = hour >= 7 && hour <= 12
    const isDeliveryTime = hour >= 6 && hour < 9
    const isPreparationTime = hour >= 20 || hour < 4
    const isCookingTime = hour >= 23 || hour < 8

    if (isDeliveryTime || isConsumptionTime) {
      score += 1.5 // Primary incident report times
    } else if (isPreparationTime || isCookingTime) {
      score += 1.0 // Supplier/internal report times
    } else {
      score += 0.5 // Within general work hours
    }
  }

  return Math.min(3, Math.round(score * 10) / 10)
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
      input.mbgScheduleMatch,
      input.relation // Pass relation for time-based validation
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
