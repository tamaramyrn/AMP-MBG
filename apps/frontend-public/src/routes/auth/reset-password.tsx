import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { authService } from "@/services/auth"

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  const isPasswordValid = passwordRegex.test(password)
  const isMatch = password === confirmPassword && confirmPassword !== ""
  const isFormValid = isPasswordValid && isMatch

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
      verifyToken(tokenParam)
    } else {
      setIsVerifying(false)
      setIsTokenValid(false)
    }
  }, [])

  const verifyToken = async (tokenValue: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token/${tokenValue}`)
      const data = await response.json()
      setIsTokenValid(data.valid === true)
    } catch {
      setIsTokenValid(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !token) return

    setError("")
    setIsLoading(true)

    try {
      await authService.resetPassword({
        token,
        password,
        passwordConfirmation: confirmPassword,
      })
      setIsSuccess(true)
      setTimeout(() => {
        navigate({ to: "/auth/login" })
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengatur ulang kata sandi")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-100 mb-4" />
          <p className="text-general-60 body-md">Memverifikasi tautan...</p>
        </div>
      </AuthLayout>
    )
  }

  // Invalid token
  if (!isTokenValid) {
    return (
      <AuthLayout>
        <div className="text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-red-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-100" />
          </div>
          <h1 className="h3 text-general-100 mb-2">Tautan Tidak Valid</h1>
          <p className="body-md text-general-60 mb-8">
            Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.
            Silakan minta tautan baru.
          </p>

          <Link
            to="/auth/forgot-password"
            className="block w-full py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg transition-colors shadow-sm body-sm text-center"
          >
            Minta Tautan Baru
          </Link>

          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 mt-6 text-general-60 hover:text-blue-100 transition-colors body-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Masuk
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-green-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-100" />
          </div>
          <h1 className="h3 text-general-100 mb-2">Kata Sandi Berhasil Diubah</h1>
          <p className="body-md text-general-60 mb-8">
            Kata sandi Anda telah berhasil diatur ulang.
            Anda akan dialihkan ke halaman masuk...
          </p>

          <Link
            to="/auth/login"
            className="block w-full py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg transition-colors shadow-sm body-sm text-center"
          >
            Masuk Sekarang
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Reset form
  return (
    <AuthLayout>
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-general-60 hover:text-blue-100 transition-colors body-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Masuk
        </Link>
      </div>

      <div className="animate-in fade-in duration-300">
        <div className="mb-8">
          <h1 className="h3 text-general-100 mb-2">Atur Ulang Kata Sandi</h1>
          <p className="body-md text-general-60">
            Masukkan kata sandi baru untuk akun Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-center gap-3 animate-in fade-in">
              <div className="w-1.5 h-1.5 bg-red-100 rounded-full shrink-0" />
              {error}
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1">
            <div className={`group bg-white border rounded-xl px-4 py-2.5 transition-all duration-300 ${
              password.length > 0 && !isPasswordValid
                ? "border-red-100 ring-2 ring-red-100/5"
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10"
            }`}>
              <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                Kata Sandi Baru
              </label>
              <div className="flex items-center gap-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
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
          </div>

          {/* Password Requirements */}
          {password.length > 0 && !isPasswordValid && (
            <div className="bg-red-20/50 border border-red-100/30 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <p className="text-[11px] font-bold text-red-600">Syarat Keamanan Kata Sandi:</p>
              </div>
              <ul className="text-[10px] text-red-500 grid grid-cols-2 gap-x-2 gap-y-1 pl-1">
                <li className={`flex items-center gap-1.5 ${password.length >= 8 ? "text-green-600 font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? "bg-green-600" : "bg-red-300"}`} /> Min. 8 Karakter
                </li>
                <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? "text-green-600 font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? "bg-green-600" : "bg-red-300"}`} /> Huruf Besar
                </li>
                <li className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? "text-green-600 font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(password) ? "bg-green-600" : "bg-red-300"}`} /> Huruf Kecil
                </li>
                <li className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? "text-green-600 font-bold" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(password) ? "bg-green-600" : "bg-red-300"}`} /> Angka
                </li>
              </ul>
            </div>
          )}

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <div className={`group bg-white border rounded-xl px-4 py-2.5 transition-all duration-300 ${
              confirmPassword.length > 0 && !isMatch
                ? "border-red-100 ring-2 ring-red-100/5"
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10"
            }`}>
              <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                Konfirmasi Kata Sandi
              </label>
              <div className="flex items-center gap-3">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-general-40 hover:text-blue-100 transition-colors p-1"
                >
                  {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {confirmPassword.length > 0 && !isMatch && (
              <p className="text-[10px] text-red-100 font-medium px-1">* Kata sandi tidak cocok</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 font-heading font-bold rounded-xl transition-all shadow-sm body-sm flex items-center justify-center gap-2 ${
              isFormValid && !isLoading
                ? "bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white cursor-pointer shadow-lg shadow-blue-100/20"
                : "bg-general-30 text-general-60 cursor-not-allowed opacity-70"
            }`}
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
