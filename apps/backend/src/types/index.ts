export interface JWTPayload {
  sub: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

// User roles (admin for dashboard, public for reporting)
export type UserRole = "admin" | "public"

// Credibility level for reports
export type CredibilityLevel = "high" | "medium" | "low"

// Report status workflow
export type ReportStatus = "pending" | "verified" | "in_progress" | "resolved" | "rejected"

// Report categories
export type ReportCategory = "poisoning" | "kitchen" | "quality" | "policy" | "implementation" | "social"

// Reporter relation to MBG
export type ReporterRelation = "parent" | "teacher" | "principal" | "supplier" | "student" | "community" | "other"

// User interface
export interface User {
  id: string
  nik: string
  email: string
  phone: string
  name: string
  role: UserRole
  isVerified: boolean
  isActive: boolean
  reportCount: number
  verifiedReportCount: number
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Report scoring components
export interface ReportScoring {
  scoreRelation: number        // 0-3: Relation to MBG
  scoreLocationTime: number    // 0-3: Location/time validity
  scoreEvidence: number        // 0-3: Supporting evidence
  scoreNarrative: number       // 0-3: Narrative consistency
  scoreReporterHistory: number // 0-3: Reporter history
  scoreSimilarity: number      // 0-3: Similarity with other reports
  totalScore: number           // 0-18: Sum of all scores
  credibilityLevel: CredibilityLevel // high/medium/low
}

// Report interface
export interface Report {
  id: string
  userId: string | null
  category: ReportCategory
  title: string
  description: string
  location: string
  provinceId: string
  cityId: string
  districtId: string | null
  incidentDate: Date
  status: ReportStatus
  relation: ReporterRelation
  relationDetail: string | null
  // Scoring
  scoreRelation: number
  scoreLocationTime: number
  scoreEvidence: number
  scoreNarrative: number
  scoreReporterHistory: number
  scoreSimilarity: number
  totalScore: number
  credibilityLevel: CredibilityLevel
  // Admin
  adminNotes: string | null
  verifiedBy: string | null
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Report file interface
export interface ReportFile {
  id: string
  reportId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: string
  createdAt: Date
}

// Session interface
export interface Session {
  id: string
  userId: string
  token: string
  userAgent: string | null
  ipAddress: string | null
  isRevoked: boolean
  expiresAt: Date
  createdAt: Date
}

// Location interfaces
export interface Province {
  id: string
  name: string
}

export interface City {
  id: string
  provinceId: string
  name: string
}

export interface District {
  id: string
  cityId: string
  name: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  message?: string
  error?: string
  code?: string
}

export interface PaginatedApiResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard stats
export interface DashboardStats {
  users: {
    total: number
    byRole: Array<{ role: UserRole; count: number }>
  }
  reports: {
    total: number
    pending: number
    uniqueCities: number
    byStatus: Array<{ status: ReportStatus; count: number }>
    byCategory: Array<{ category: ReportCategory; count: number }>
  }
  recentReports: Array<{
    id: string
    title: string
    category: ReportCategory
    status: ReportStatus
    province: string
    city: string
    reporter: string
    createdAt: Date
  }>
}

export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  CORS_ORIGIN: string
  PORT: string
  NODE_ENV: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET?: string
  R2_ENDPOINT?: string
  R2_PUBLIC_URL?: string
}
