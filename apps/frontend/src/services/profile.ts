import { api } from "@/lib/api"
import type { User } from "./auth"
import type { Report, PaginatedResponse, ReportStatus } from "./reports"

export interface ProfileResponse {
  user: User
  stats: {
    totalReports: number
    pendingReports: number
    resolvedReports: number
  }
}

export interface ProfileReportsQuery {
  [key: string]: unknown
  page?: number
  limit?: number
  status?: ReportStatus
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

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    return api.get("/profile")
  },

  async updateProfile(data: { name?: string; phone?: string; email?: string }): Promise<{ user: User; message: string }> {
    return api.patch("/profile", data)
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> {
    return api.put("/profile/password", data)
  },

  async getReports(query: ProfileReportsQuery = {}): Promise<PaginatedResponse<Report>> {
    return api.get(`/profile/reports${buildQueryString(query)}`)
  },

  async getReport(id: string): Promise<{ data: Report }> {
    return api.get(`/profile/reports/${id}`)
  },

  async deleteAccount(): Promise<{ message: string }> {
    return api.delete("/profile")
  },
}
