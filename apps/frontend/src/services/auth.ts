import { api, setToken, removeToken } from "@/lib/api"

export type UserRole = "admin" | "associate" | "public"

export interface User {
  id: string
  nik: string
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
  nik: string
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
    const response = await api.post<AuthResponse>("/auth/login", data)
    setToken(response.token)
    localStorage.setItem("currentUser", JSON.stringify(response.user))
    window.dispatchEvent(new Event("user-login"))
    return response
  },

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/signup", data)
    setToken(response.token)
    localStorage.setItem("currentUser", JSON.stringify(response.user))
    window.dispatchEvent(new Event("user-login"))
    return response
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

  isAssociate(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "associate"
  },

  canAccessDashboard(): boolean {
    const user = this.getCurrentUser()
    return user?.role === "admin" || user?.role === "associate"
  },
}
