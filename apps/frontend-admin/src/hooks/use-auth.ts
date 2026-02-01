import { useState, useEffect, useCallback } from "react"
import { authService, type Admin } from "@/services/auth"

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(authService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    if (!authService.isLoggedIn()) {
      setAdmin(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await authService.getMe()
      setAdmin(response.admin)
      localStorage.setItem("admin_currentUser", JSON.stringify(response.admin))
    } catch {
      setAdmin(null)
      localStorage.removeItem("admin_currentUser")
      localStorage.removeItem("admin_token")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handleLoginEvent = () => {
      setAdmin(authService.getCurrentUser())
    }
    window.addEventListener("user-login", handleLoginEvent)
    return () => window.removeEventListener("user-login", handleLoginEvent)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setAdmin(null)
  }, [])

  return {
    admin,
    isLoading,
    isLoggedIn: !!admin,
    isAdmin: !!admin,
    logout,
    refresh: checkAuth,
  }
}
