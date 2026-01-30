import { api, setToken, removeToken } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

export type UserRole = "admin" | "member" | "public"

export interface User {
  id: string
  email: string
  phone: string
  name: string
  role: UserRole
  isVerified?: boolean
  reportCount?: number
  verifiedReportCount?: number
  createdAt?: string
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  passwordConfirmation: string
  name: string
  phone: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface MeResponse {
  user: User
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Clear all cached data before login
    queryClient.clear()
    const response = await api.post<AuthResponse>("/auth/login", { ...data, appType: "public" })
    setToken(response.token)
    localStorage.setItem("currentUser", JSON.stringify(response.user))
    window.dispatchEvent(new Event("user-login"))
    return response
  },

  async signup(data: SignupRequest): Promise<{ message: string }> {
    // Registration only creates account, does NOT auto-login
    const response = await api.post<AuthResponse>("/auth/signup", data)
    return { message: response.message }
  },

  async getMe(): Promise<MeResponse> {
    return api.get<MeResponse>("/auth/me")
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout")
    } finally {
      removeToken()
      localStorage.removeItem("currentUser")
      queryClient.clear()
      window.dispatchEvent(new Event("user-login"))
    }
  },

  async updateProfile(data: { name?: string; phone?: string }): Promise<{ user: User; message: string }> {
    return api.put("/auth/profile", data)
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> {
    return api.put("/auth/change-password", data)
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post("/auth/forgot-password", { email })
  },

  async resetPassword(data: { token: string; password: string; passwordConfirmation: string }): Promise<{ message: string }> {
    return api.post("/auth/reset-password", data)
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem("currentUser")
    return stored ? JSON.parse(stored) : null
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem("token")
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "admin"
  },

  isMember(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "member"
  },

  canAccessDashboard(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "admin" || user?.role === "member"
  },
}
