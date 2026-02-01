import { api } from "@/lib/api"

export type ReportCategory = "poisoning" | "kitchen" | "quality" | "policy" | "implementation" | "social"
export type ReportStatus = "pending" | "analyzing" | "needs_evidence" | "invalid" | "in_progress" | "resolved"
export type CredibilityLevel = "high" | "medium" | "low"
export type ReporterRelation = "parent" | "teacher" | "principal" | "supplier" | "student" | "community" | "other"

export interface Report {
  id: string
  category: ReportCategory
  title: string
  description: string
  location: string
  provinceId: string
  province: string
  cityId: string
  city: string
  districtId?: string
  district?: string
  incidentDate: string
  status: ReportStatus
  relation: ReporterRelation
  relationDetail?: string
  totalScore: number
  credibilityLevel: CredibilityLevel
  createdAt: string
  updatedAt: string
  files?: ReportFile[]
}

export interface ReportFile {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: string
}

export interface ReportDetail extends Report {
  reporterName?: string
  reporterEmail?: string
  adminNotes?: string
  verifiedAt?: string
  verifiedBy?: string
}

export interface CreateReportRequest {
  category: ReportCategory
  title: string
  description: string
  location: string
  provinceId: string
  cityId: string
  districtId?: string
  incidentDate: string
  relation: ReporterRelation
  relationDetail?: string
}

export interface ReportsQuery {
  [key: string]: unknown
  page?: number
  limit?: number
  category?: ReportCategory
  status?: ReportStatus
  credibilityLevel?: CredibilityLevel
  provinceId?: string
  cityId?: string
  districtId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReportStats {
  total: number
  verified: number
  uniqueCities: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  topCategory: { category: ReportCategory; count: number } | null
  totalCommunityUsers: number
  totalAmpMbgUsers: number
  byStatus?: { status: ReportStatus; count: number }[]
  byCategory?: { category: ReportCategory; count: number }[]
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export const reportsService = {
  async getReports(query: ReportsQuery = {}): Promise<PaginatedResponse<Report>> {
    return api.get(`/reports${buildQueryString(query)}`)
  },

  async getReport(id: string): Promise<{ data: ReportDetail }> {
    return api.get(`/reports/${id}`)
  },

  async createReport(data: CreateReportRequest): Promise<{ data: Report; message: string }> {
    return api.post("/reports", data)
  },

  async getMyReports(query: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Report>> {
    return api.get(`/reports/my/reports${buildQueryString(query)}`)
  },

  async getStats(): Promise<ReportStats> {
    return api.get("/reports/stats")
  },

  async getSummary(): Promise<ReportStats> {
    return api.get("/reports/summary")
  },

  async getRecent(): Promise<{ data: Report[] }> {
    return api.get("/reports/recent")
  },

  async uploadFiles(reportId: string, files: File[]): Promise<{ data: ReportFile[]; message: string }> {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))

    const token = localStorage.getItem("admin_token")
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/reports/${reportId}/files`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Upload failed")
    return data
  },
}
