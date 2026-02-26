import { api } from "@/lib/api"

export interface Admin {
  id: string
  name: string
  email: string
  phone: string | null
  adminRole: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface OrganizationInfo {
  name: string
  email: string
  phone: string
  roleInOrganization: string
  organizationMbgRole: string
}

export interface Member {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  memberType: string
  organizationName: string
  organizationEmail: string | null
  organizationPhone: string | null
  roleInOrganization: string | null
  organizationMbgRole: string | null
  appliedAt: string
  verifiedAt: string | null
  verifiedBy: string | null
  organizationInfo: OrganizationInfo | null
  isVerified: boolean
  createdAt: string
}

export interface CreateAdminData {
  name: string
  email: string
  password: string
  adminRole: string
}

export interface CreateMemberData {
  name: string
  email: string
  phone: string
  memberType: "supplier" | "caterer" | "school" | "government" | "foundation" | "ngo" | "farmer" | "other"
}

export const adminAccountService = {
  getAdmins: async (params?: { search?: string; isActive?: boolean }): Promise<{ data: Admin[] }> => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append("search", params.search)
    if (params?.isActive !== undefined) searchParams.append("isActive", String(params.isActive))
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    return api.get(`/admin/admins${query}`)
  },

  createAdmin: async (data: CreateAdminData): Promise<{ data: Admin; message: string }> => {
    return api.post("/admin/admins", data)
  },

  updateAdmin: async (id: string, data: { name?: string; adminRole?: string; isActive?: boolean }): Promise<{ data: Admin; message: string }> => {
    return api.patch(`/admin/admins/${id}`, data)
  },

  deleteAdmin: async (id: string): Promise<{ message: string }> => {
    return api.delete(`/admin/admins/${id}`)
  },
}

export const memberService = {
  getMembers: async (params?: { status?: "verified" | "pending" | "all"; memberType?: string; search?: string }): Promise<{ data: Member[] }> => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append("status", params.status)
    if (params?.memberType) searchParams.append("memberType", params.memberType)
    if (params?.search) searchParams.append("search", params.search)
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    return api.get(`/admin/members${query}`)
  },

  getMember: async (id: string): Promise<{ data: Member }> => {
    return api.get(`/admin/members/${id}`)
  },

  createMember: async (data: CreateMemberData): Promise<{ data: Member; message: string }> => {
    return api.post("/admin/members", data)
  },

  verifyMember: async (id: string): Promise<{ message: string }> => {
    return api.patch(`/admin/members/${id}/verify`)
  },

  updateMemberStatus: async (id: string, data: { isVerified?: boolean }): Promise<{ message: string }> => {
    return api.patch(`/admin/members/${id}/status`, data)
  },

  deleteMember: async (id: string): Promise<{ message: string }> => {
    return api.delete(`/admin/members/${id}`)
  },
}
