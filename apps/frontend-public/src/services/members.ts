import { api } from "@/lib/api"

export interface Admin {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  adminRole: string | null
  isVerified: boolean
  createdAt: string
}

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  role: string
  memberType: string | null
  isVerified: boolean
  isActive: boolean
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
  password: string
  memberType: "supplier" | "caterer" | "school" | "government" | "foundation" | "ngo" | "farmer" | "other"
}

export const adminAccountService = {
  getAdmins: async (status: "verified" | "pending" | "all" = "all"): Promise<{ data: Admin[] }> => {
    return api.get(`/admin/admins?status=${status}`)
  },

  createAdmin: async (data: CreateAdminData): Promise<{ data: Admin; message: string }> => {
    return api.post("/admin/admins", data)
  },

  deleteAdmin: async (id: string): Promise<{ message: string }> => {
    return api.delete(`/admin/admins/${id}`)
  },
}

export const memberService = {
  getMembers: async (status: "verified" | "pending" | "all" = "all"): Promise<{ data: Member[] }> => {
    return api.get(`/admin/members?status=${status}`)
  },

  createMember: async (data: CreateMemberData): Promise<{ data: Member; message: string }> => {
    return api.post("/admin/members", data)
  },

  verifyMember: async (id: string): Promise<{ message: string }> => {
    return api.patch(`/admin/members/${id}/verify`)
  },

  deleteMember: async (id: string): Promise<{ message: string }> => {
    return api.delete(`/admin/members/${id}`)
  },
}
