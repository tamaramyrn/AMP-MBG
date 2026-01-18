// src/services/members.ts
import { api } from "@/lib/api"

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  nik: string
  role: string
  isVerified: boolean
  createdAt: string
}

export const memberService = {
  // Ambil semua member (bisa difilter status verifikasinya)
  getMembers: async (status: 'verified' | 'pending' | 'all' = 'all') => {
    // Anggap backend menerima query param ?status=pending
    return api.get(`/admin/members?status=${status}`)
  },

  // Verifikasi member
  verifyMember: async (id: string) => {
    return api.patch(`/admin/members/${id}/verify`)
  },

  // Tolak/Hapus member (jika data palsu)
  rejectMember: async (id: string) => {
    return api.delete(`/admin/members/${id}`)
  }
}