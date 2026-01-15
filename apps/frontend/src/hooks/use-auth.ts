import { useState, useEffect, useCallback } from "react"
import { authService, type User } from "@/services/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    if (!authService.isLoggedIn()) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await authService.getMe()
      setUser(response.user)
      localStorage.setItem("currentUser", JSON.stringify(response.user))
    } catch {
      setUser(null)
      localStorage.removeItem("currentUser")
      localStorage.removeItem("token")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handleLoginEvent = () => {
      setUser(authService.getCurrentUser())
    }
    window.addEventListener("user-login", handleLoginEvent)
    return () => window.removeEventListener("user-login", handleLoginEvent)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin: user?.role === "admin",
    logout,
    refresh: checkAuth,
  }
}
