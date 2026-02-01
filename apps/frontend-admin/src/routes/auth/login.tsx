// login admin
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff, Loader2, LogIn} from "lucide-react"
import { authService } from "@/services/auth"

export const Route = createFileRoute("/auth/login")({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // --- LOGIKA VALIDASI UI (Disamakan dengan Public) ---
  const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
  const isIdentifierValid = identifier.length === 0 || isEmailFormat
  const isPasswordFilled = password.length > 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validasi format email sebelum submit
    if (!isEmailFormat) {
      setError("Mohon masukkan format email yang valid")
      return
    }

    setIsLoading(true)

    try {
      await authService.login({ email: identifier, password })
      navigate({ to: "/dashboard" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* HEADER SECTION (Disamakan) */}
      <div className="mb-10 relative">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-100/10 rounded-full blur-2xl" />
        <h1 className="h3 font-heading font-bold text-general-100 mb-2 relative z-10">
          Selamat Datang, <span className="text-blue-100">Admin!</span>
        </h1>
        <p className="body-md text-general-60">Masuk untuk mengakses dashboard.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-center gap-3 animate-in fade-in">
            <div className="w-1.5 h-1.5 bg-red-100 rounded-full shrink-0" />
            {error}
          </div>
        )}

        {/* Email Field (Style Public) */}
        <div className="space-y-1">
          <div className={`group bg-white border rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:shadow-md ${
            identifier.length > 0 && !isIdentifierValid
              ? "border-red-100 ring-2 ring-red-100/5"
              : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10"
          }`}>
            <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
              Surel Admin
            </label>
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@domain.com"
              className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
              disabled={isLoading}
            />
          </div>
          {identifier.length > 0 && !isIdentifierValid && (
            <p className="text-[10px] text-red-100 font-medium px-1">* Format email tidak valid</p>
          )}
        </div>

        {/* Password Field (Style Public) */}
        <div className="space-y-1">
          <div className="group bg-white border border-general-30 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 focus-within:shadow-md">
            <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
              Kata Sandi
            </label>
            <div className="flex items-center gap-3">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-general-40 hover:text-blue-100 transition-colors p-1"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center px-1">
             {!isPasswordFilled && identifier.length > 0 && (
                <p className="text-[10px] text-general-50">Masukkan kata sandi Anda</p>
             )}
          </div>
        </div>

        {/* Submit Button (Style Public) */}
        <button
          type="submit"
          disabled={isLoading || !identifier || !password}
          className="w-full py-3.5 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white/90" />
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          {isLoading ? "Memproses..." : "Masuk Dashboard"}
        </button>
      </form>
    </AuthLayout>
  )
}