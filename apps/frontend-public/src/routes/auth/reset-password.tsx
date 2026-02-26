import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState, useEffect } from "react"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { authService } from "@/services/auth"
import { useSEO } from "@/hooks/use-seo"

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  useSEO({ title: "Reset Kata Sandi", description: "Buat kata sandi baru akun AMP MBG", path: "/auth/reset-password", noindex: true })
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
            className="block w-full py-3.5 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] text-center body-sm"
          >
            Minta Tautan Baru
          </Link>

          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2 rounded-full text-general-60 hover:text-blue-100 hover:bg-blue-20/50 transition-all duration-300 body-sm font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
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
            className="block w-full py-3.5 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] text-center body-sm"
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
      {/* Header */}
      <div className="mb-10 relative">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-100/10 rounded-full blur-2xl" />
        <h1 className="h3 font-heading font-bold text-general-100 mb-2 relative z-10">
          Atur Ulang <span className="text-blue-100">Kata Sandi</span>
        </h1>
        <p className="body-md text-general-60">Masukkan kata sandi baru untuk akun Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-center gap-3 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Password Field */}
        <div className="space-y-1">
          <fieldset className={`group bg-white border rounded-xl px-4 pb-2.5 pt-1 transition-all duration-300 focus-within:shadow-md ${
            password.length > 0 && !isPasswordValid
              ? "border-red-100 ring-2 ring-red-100/5"
              : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10"
          }`}>
            <legend className="body-xs font-semibold text-general-60 px-2 bg-white group-focus-within:text-blue-100 transition-colors">
              Kata Sandi Baru
            </legend>
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
          </fieldset>
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
          <fieldset className={`group bg-white border rounded-xl px-4 pb-2.5 pt-1 transition-all duration-300 focus-within:shadow-md ${
            confirmPassword.length > 0 && !isMatch
              ? "border-red-100 ring-2 ring-red-100/5"
              : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10"
          }`}>
            <legend className="body-xs font-semibold text-general-60 px-2 bg-white group-focus-within:text-blue-100 transition-colors">
              Konfirmasi Kata Sandi
            </legend>
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
          </fieldset>
          {confirmPassword.length > 0 && !isMatch && (
            <p className="text-[10px] text-red-100 font-medium px-1">* Kata sandi tidak cocok</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white/90" />
              Menyimpan...
            </>
          ) : (
            "Simpan Kata Sandi Baru"
          )}
        </button>

        {/* Back to login */}
        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-general-60 hover:text-blue-100 hover:bg-blue-20/50 transition-all duration-300 body-sm font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Masuk
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
