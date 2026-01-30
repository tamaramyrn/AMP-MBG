import { api } from "@/lib/api"
import type { Report, ReportDetail, ReportStatus, ReportCategory, PaginatedResponse } from "./reports"

// --- EXISTING INTERFACES ---
export interface DashboardStats {
  users: {
    total: number
    byRole: { role: string; count: number }[]
  }
  reports: {
    total: number
    pending: number
    uniqueCities: number
    byStatus: { status: string; count: number }[]
    byCategory: { category: string; count: number }[]
  }
  recentReports: {
    id: string
    title: string
    category: ReportCategory
    status: ReportStatus
    province: string
    city: string
    reporter: string
    createdAt: string
  }[]
}

export interface AdminReport extends Report {
  reporter?: string
  reporterEmail?: string
  reporterPhone?: string
  verifiedBy?: string
  verifiedAt?: string
  adminNotes?: string
}

export interface AdminReportDetail extends ReportDetail {
  reporter?: {
    id: string
    name: string
    email: string
    phone: string
  }
  statusHistory?: {
    id: string
    fromStatus: string | null
    toStatus: string
    notes: string | null
    changedBy: string
    createdAt: string
  }[]
}

export interface AdminReportsQuery {
  [key: string]: unknown
  page?: number
  limit?: number
  status?: ReportStatus
  category?: ReportCategory
  provinceId?: string
  cityId?: string
  startDate?: string
  endDate?: string
  search?: string
}

// Kitchen content interface
export interface KitchenNeedItem {
  id: string
  title: string
  description: string
  imageUrl?: string | null
}

// Kitchen request interface
export interface KitchenNeedRequest {
  kitchenNeedId: string
  sppgName: string
  contactPerson: string
  position: string
  phoneNumber: string
  details: string
}

export interface KitchenRequestHistory {
  id: string
  category: string
  sppgName: string
  status: string
  createdAt: string
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

export const adminService = {
  async getDashboard(): Promise<DashboardStats> {
    return api.get("/admin/dashboard")
  },

  async getReports(query: AdminReportsQuery = {}): Promise<PaginatedResponse<AdminReport>> {
    return api.get(`/admin/reports${buildQueryString(query)}`)
  },

  async getReport(id: string): Promise<{ data: AdminReportDetail }> {
    return api.get(`/admin/reports/${id}`)
  },

  async updateReportStatus(id: string, data: { status: ReportStatus; credibilityLevel?: string; notes?: string }): Promise<{ data: Report; message: string }> {
    return api.patch(`/admin/reports/${id}/status`, data)
  },

  async getReportHistory(id: string): Promise<{
    data: { id: string; fromStatus: string | null; toStatus: string; notes: string | null; changedBy: string; createdAt: string }[]
  }> {
    return api.get(`/admin/reports/${id}/history`)
  },

  async getReportScoring(id: string): Promise<{
    data: {
      scoreRelation: { value: number; max: number; label: string }
      scoreLocationTime: { value: number; max: number; label: string }
      scoreEvidence: { value: number; max: number; label: string }
      scoreNarrative: { value: number; max: number; label: string }
      scoreReporterHistory: { value: number; max: number; label: string }
      scoreSimilarity: { value: number; max: number; label: string }
      totalScore: number
      credibilityLevel: string
    }
  }> {
    return api.get(`/admin/reports/${id}/scoring`)
  },

  async bulkUpdateStatus(reportIds: string[], status: ReportStatus, notes?: string): Promise<{ message: string; updated: number }> {
    return api.patch("/admin/reports/bulk-status", { reportIds, status, notes })
  },

  async deleteReport(id: string): Promise<{ message: string }> {
    return api.delete(`/admin/reports/${id}`)
  },

  async getAnalytics(year?: number, month?: number): Promise<{
    overview: {
      totalReports: number
      last30Days: number
      last7Days: number
      totalUsers: number
      activeUsers: number
      highRiskReports: number
      mediumRiskReports: number
      lowRiskReports: number
    }
    trends: {
      data: { label: string; count: number }[]
      isMonthly: boolean
    }
    topProvinces: { provinceId: string; province: string; count: number }[]
    topCities: { cityId: string; city: string; province: string; count: number }[]
    topDistricts: { districtId: string; district: string; city: string; count: number }[]
  }> {
    const params = new URLSearchParams()
    if (year) params.append("year", String(year))
    if (month !== undefined) params.append("month", String(month))
    const query = params.toString() ? `?${params.toString()}` : ""
    return api.get(`/admin/analytics${query}`)
  },

  // Kitchen content (public access)
  kitchen: {
    getAll: async (): Promise<KitchenNeedItem[]> => {
      const response = await api.get<{ data: KitchenNeedItem[] }>("/kitchen-needs")
      return response.data
    },

    submitRequest: async (data: KitchenNeedRequest): Promise<{ message: string }> => {
      return api.post("/kitchen-needs/requests", data)
    },

    getMyRequests: async (): Promise<KitchenRequestHistory[]> => {
      const response = await api.get<{ data: KitchenRequestHistory[] }>("/kitchen-needs/requests/my")
      return response.data
    }
  }
}