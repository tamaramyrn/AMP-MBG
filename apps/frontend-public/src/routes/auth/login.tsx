import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState, useEffect, useCallback } from "react"
import { Eye, EyeOff, Loader2, ArrowLeft, LogIn } from "lucide-react"
import { authService } from "@/services/auth"

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string
            scope: string
            ux_mode: "popup" | "redirect"
            callback: (response: { code: string; error?: string }) => void
          }) => { requestCode: () => void }
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [requiresPhone, setRequiresPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleGoogleCallback = useCallback(async (response: { code: string; error?: string }) => {
    if (response.error) {
      setError("Login Google dibatalkan")
      setIsGoogleLoading(false)
      return
    }
    setError("")
    setIsGoogleLoading(true)
    try {
      const result = await authService.googleAuthCode(response.code)
      if (result.requiresPhone) {
        setRequiresPhone(true)
      } else {
        navigate({ to: "/" })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login Google gagal")
    } finally {
      setIsGoogleLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [])

  const handleGoogleClick = () => {
    if (!window.google) return
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
      ux_mode: "popup",
      callback: handleGoogleCallback,
    })
    client.requestCode()
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await authService.completeGooglePhone(phoneNumber)
      navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan nomor telepon")
    } finally {
      setIsLoading(false)
    }
  }

  // --- LOGIKA ASLI (TETAP) ---
  const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
  const isIdentifierValid = identifier.length === 0 || isEmailFormat
  const isPasswordFilled = password.length > 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!isEmailFormat) {
      setError("Mohon masukkan format email yang valid")
      return
    }

    setIsLoading(true)

    try {
      await authService.login({ identifier, password })
      navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* HEADER SECTION */}
      <div className="mb-10 relative">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-100/10 rounded-full blur-2xl" />
        <h1 className="h3 font-heading font-bold text-general-100 mb-2 relative z-10">
          Selamat Datang, <span className="text-blue-100">Masyarakat!</span>
        </h1>
        <p className="body-md text-general-60">Masuk untuk mulai berkontribusi.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-center gap-3 animate-in fade-in">
            <div className="w-1.5 h-1.5 bg-red-100 rounded-full shrink-0" />
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1">
          <div className={`group bg-white border rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:shadow-md ${
            identifier.length > 0 && !isIdentifierValid
              ? "border-red-100 ring-2 ring-red-100/5"
              : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10"
          }`}>
            <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
              Surel
            </label>
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nama@domain.com"
              className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
              disabled={isLoading}
            />
          </div>
          {identifier.length > 0 && !isIdentifierValid && (
            <p className="text-[10px] text-red-100 font-medium px-1">* Format email tidak valid</p>
          )}
        </div>

        {/* Password Field */}
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
             <div className="flex-1 text-right">
                <Link 
                    to="/auth/forgot-password" 
                    className="text-[11px] font-semibold text-orange-100 hover:text-orange-90 hover:underline transition-colors"
                >
                    Lupa kata sandi?
                </Link>
             </div>
          </div>
        </div>

        {/* Submit Button */}
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
          {isLoading ? "Memproses..." : "Masuk Sekarang"}
        </button>

        {/* Google Login */}
        {GOOGLE_CLIENT_ID && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-general-30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-general-50">atau</span>
            </div>
          </div>
        )}

        {GOOGLE_CLIENT_ID && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading}
              className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-general-30 bg-white hover:border-blue-100 hover:shadow-md transition-all disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-100" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Phone Completion Modal */}
      {requiresPhone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="h4 font-heading font-bold text-general-100 mb-2">Lengkapi Data</h2>
            <p className="body-sm text-general-60 mb-6">Masukkan nomor telepon untuk melanjutkan</p>

            {error && (
              <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="group bg-white border border-general-30 rounded-xl px-4 py-2.5 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10">
                <label className="block body-xs font-semibold text-general-60 mb-0.5">Nomor Telepon</label>
                <div className="flex items-center gap-2">
                  <span className="text-general-60 body-sm font-medium">+62</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="812xxxxxxxx"
                    className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                    disabled={isLoading}
                    maxLength={12}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length < 9}
                className="w-full py-3 bg-blue-100 hover:bg-blue-90 text-white font-heading font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isLoading ? "Menyimpan..." : "Lanjutkan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-general-30 text-center space-y-4">
        <p className="body-sm text-general-60">
          Belum memiliki akun?{" "}
          <Link 
            to="/auth/register" 
            className="text-blue-100 font-bold hover:text-orange-100 transition-colors duration-300 decoration-2 hover:underline underline-offset-4"
          >
            Daftar disini
          </Link>
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-general-60 hover:text-blue-100 hover:bg-blue-20/50 transition-all duration-300 body-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda
        </Link>
      </div>
    </AuthLayout>
  )
}