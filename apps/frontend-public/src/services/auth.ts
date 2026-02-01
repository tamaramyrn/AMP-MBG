import { api, setToken, removeToken } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

// App-specific storage key
const USER_KEY = "public_currentUser"

export interface User {
  id: string
  email: string
  phone: string | null
  name: string
  signupMethod?: "manual" | "google"
  hasPassword?: boolean
  isGoogleLinked?: boolean
  googleEmail?: string | null
  isMember?: boolean
  memberStatus?: "verified" | "pending" | null
  reportCount?: number
  verifiedReportCount?: number
  createdAt?: string
}

export interface GoogleAuthResponse {
  message: string
  user?: User
  token?: string
  requiresPhone?: boolean
  tempToken?: string
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
    queryClient.clear()
    const response = await api.post<AuthResponse>("/auth/login", data)
    setToken(response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    window.dispatchEvent(new Event("user-login"))
    return response
  },

  async signup(data: SignupRequest): Promise<{ message: string }> {
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
      localStorage.removeItem(USER_KEY)
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
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem("public_token")
  },

  isMember(): boolean {
    const user = this.getCurrentUser()
    return !!user?.isMember && user?.memberStatus === "verified"
  },

  isPendingMember(): boolean {
    const user = this.getCurrentUser()
    return !!user?.isMember && user?.memberStatus === "pending"
  },

  async googleAuth(credential: string): Promise<GoogleAuthResponse> {
    queryClient.clear()
    const response = await api.post<GoogleAuthResponse>("/auth/google", { credential })
    if (response.token && response.user) {
      setToken(response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      window.dispatchEvent(new Event("user-login"))
    } else if (response.tempToken) {
      setToken(response.tempToken)
    }
    return response
  },

  async googleAuthCode(code: string): Promise<GoogleAuthResponse> {
    queryClient.clear()
    const response = await api.post<GoogleAuthResponse>("/auth/google/code", { code })
    if (response.token && response.user) {
      setToken(response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      window.dispatchEvent(new Event("user-login"))
    } else if (response.tempToken) {
      setToken(response.tempToken)
    }
    return response
  },

  async completeGooglePhone(phone: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/google/complete-phone", { phone })
    setToken(response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    window.dispatchEvent(new Event("user-login"))
    return response
  },

  isGoogleUser(): boolean {
    const user = this.getCurrentUser()
    return !!user?.isGoogleLinked
  },

  hasPassword(): boolean {
    const user = this.getCurrentUser()
    return !!user?.hasPassword
  },

  async createPassword(data: { password: string; confirmPassword: string }): Promise<{ message: string }> {
    return api.post("/auth/create-password", data)
  },
}
