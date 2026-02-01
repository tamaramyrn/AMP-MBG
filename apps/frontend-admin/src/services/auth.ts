import { api, setToken, removeToken } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

// App-specific storage key
const ADMIN_KEY = "admin_currentUser"

export interface Admin {
  id: string
  email: string
  name: string
  phone?: string
  adminRole?: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminAuthResponse {
  message: string
  admin: Admin
  token: string
}

export interface AdminMeResponse {
  admin: Admin
}

export const authService = {
  async login(data: AdminLoginRequest): Promise<AdminAuthResponse> {
    queryClient.clear()
    const response = await api.post<AdminAuthResponse>("/auth/admin/login", data)
    setToken(response.token)
    localStorage.setItem(ADMIN_KEY, JSON.stringify(response.admin))
    window.dispatchEvent(new Event("user-login"))
    return response
  },

  async getMe(): Promise<AdminMeResponse> {
    return api.get<AdminMeResponse>("/auth/admin/me")
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/admin/logout")
    } finally {
      removeToken()
      localStorage.removeItem(ADMIN_KEY)
      queryClient.clear()
      window.dispatchEvent(new Event("user-login"))
    }
  },

  getCurrentUser(): Admin | null {
    const stored = localStorage.getItem(ADMIN_KEY)
    return stored ? JSON.parse(stored) : null
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem("admin_token")
  },

  isAdmin(): boolean {
    return this.isLoggedIn() && !!this.getCurrentUser()
  },

  canAccessDashboard(): boolean {
    return this.isAdmin()
  },
}
