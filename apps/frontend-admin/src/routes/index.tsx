import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { authService } from "@/services/auth"

export const Route = createFileRoute("/")({
  component: IndexPage,
})

function IndexPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const admin = authService.getCurrentUser()
    if (admin) {
      navigate({ to: "/dashboard" })
    } else {
      navigate({ to: "/auth/login" })
    }
  }, [navigate])

  return null
}
