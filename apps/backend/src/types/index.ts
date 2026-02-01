// ============================================
// AUTH TYPES
// ============================================

export type AccountType = "admin" | "user"

export interface JWTPayload {
  sub: string
  email: string
  type: AccountType // admin or user
  temp?: boolean // for incomplete Google signup
  iat: number
  exp: number
}

export interface AuthAdmin {
  id: string
  email: string
  type: "admin"
}

export interface AuthUser {
  id: string
  email: string
  type: "user"
}

// ============================================
// ADMIN TYPES
// ============================================

export interface Admin {
  id: string
  email: string
  name: string
  phone: string | null
  adminRole: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ============================================
// USER TYPES (Public users)
// ============================================

export type SignupMethod = "manual" | "google"

export interface User {
  id: string
  email: string
  phone: string | null
  name: string
  signupMethod: SignupMethod
  googleId: string | null
  googleEmail: string | null
  reportCount: number
  verifiedReportCount: number
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Computed
  hasPassword?: boolean
  isGoogleLinked?: boolean
  isMember?: boolean
}

// ============================================
// MEMBER TYPES (Extension of User)
// ============================================

export type MemberType = "supplier" | "caterer" | "school" | "government" | "foundation" | "ngo" | "farmer" | "other"

export interface Member {
  id: string
  publicId: string
  memberType: MemberType
  organizationName: string
  organizationEmail: string | null
  organizationPhone: string | null
  roleInOrganization: string | null
  organizationMbgRole: string | null
  isVerified: boolean
  verifiedAt: Date | null
  verifiedBy: string | null
  appliedAt: Date
  createdAt: Date
  updatedAt: Date
  // Relations
  public?: User
}

// ============================================
// REPORT TYPES
// ============================================

export type CredibilityLevel = "high" | "medium" | "low"
export type ReportStatus = "pending" | "analyzing" | "needs_evidence" | "invalid" | "in_progress" | "resolved"
export type ReportCategory = "poisoning" | "kitchen" | "quality" | "policy" | "implementation" | "social"
export type ReporterRelation = "parent" | "teacher" | "principal" | "supplier" | "student" | "community" | "other"

export interface ReportScoring {
  scoreRelation: number
  scoreLocationTime: number
  scoreEvidence: number
  scoreNarrative: number
  scoreReporterHistory: number
  scoreSimilarity: number
  totalScore: number
  credibilityLevel: CredibilityLevel
}

export interface Report {
  id: string
  publicId: string | null
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
  scoreRelation: number
  scoreLocationTime: number
  scoreEvidence: number
  scoreNarrative: number
  scoreReporterHistory: number
  scoreSimilarity: number
  totalScore: number
  credibilityLevel: CredibilityLevel
  adminNotes: string | null
  verifiedBy: string | null
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ReportFile {
  id: string
  reportId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: string
  createdAt: Date
}

// ============================================
// LOCATION TYPES
// ============================================

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

// ============================================
// SESSION TYPES
// ============================================

export interface Session {
  id: string
  publicId: string
  token: string
  userAgent: string | null
  ipAddress: string | null
  isRevoked: boolean
  expiresAt: Date
  createdAt: Date
}

export interface AdminSession {
  id: string
  adminId: string
  token: string
  userAgent: string | null
  ipAddress: string | null
  isRevoked: boolean
  expiresAt: Date
  createdAt: Date
}

// ============================================
// API RESPONSE TYPES
// ============================================

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

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  users: {
    total: number
    members: number
    bySignupMethod: { manual: number; google: number }
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

// ============================================
// ENV TYPES
// ============================================

export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  CORS_ORIGIN: string
  PORT: string
  NODE_ENV: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASS?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET?: string
  R2_ENDPOINT?: string
  R2_PUBLIC_URL?: string
}
