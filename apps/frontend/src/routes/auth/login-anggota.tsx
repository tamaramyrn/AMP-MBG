import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react" // Tambah ArrowLeft
import { authService } from "@/services/auth"

export const Route = createFileRoute("/auth/login-anggota")({
  component: LoginAnggotaPage,
})

function LoginAnggotaPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await authService.login({ identifier, password })
      // 1. Cek Role - Only admin and associate can access dashboard
      if (response.user.role !== "admin" && response.user.role !== "associate") {
        setError("Akun ini terdaftar sebagai masyarakat umum. Silakan login di halaman masyarakat.")
        await authService.logout()
        return
      }

      // 2. Cek Status Verifikasi (only for associate)
      if (response.user.role === "associate" && !response.user.isVerified) {
        setError("Akun Anda sedang dalam proses verifikasi oleh Admin. Mohon tunggu persetujuan.")
        await authService.logout()
        return
      }
      navigate({ to: "/dashboard" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="h3 text-general-100 mb-2">Selamat Datang, Anggota!</h1>
        <p className="body-md text-general-60">Masuk untuk mengelola laporan program MBG</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="bg-red-20 border border-red-100 text-red-100 px-4 py-3 rounded-lg body-sm">
            {error}
          </div>
        )}

        {/* Email / NIK Field */}
        <fieldset className="border border-general-30 rounded-lg px-3 pb-3 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
          <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Surel / ID Anggota</legend>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Masukkan surel atau ID Anggota"
            className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
            disabled={isLoading}
          />
        </fieldset>

        {/* Password Field */}
        <fieldset className="border border-general-30 rounded-lg px-3 pb-3 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
          <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Kata Sandi</legend>
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi Anda"
              className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-general-40 hover:text-general-60 transition-colors"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </fieldset>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            to="/auth/forgot-password"
            className="body-sm text-blue-100 hover:text-blue-90 hover:underline font-medium"
          >
            Lupa kata sandi? Atur ulang
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !identifier || !password}
          className="w-full py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg transition-colors shadow-sm body-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="text-center body-sm text-general-60 mt-6">
        Belum terdaftar sebagai anggota?{" "}
        <Link to="/auth/register-anggota" className="text-blue-100 font-semibold hover:underline">
          Daftar di sini
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-general-30"></div>
        <span className="text-general-50 body-xs">atau</span>
        <div className="flex-1 border-t border-general-30"></div>
      </div>

      {/* Secondary Action Link - Ke Login Masyarakat */}
      <div className="space-y-3">
        <Link
          to="/auth/login"
          className="block w-full py-3 border border-blue-100 text-blue-100 font-heading font-medium rounded-lg text-center hover:bg-blue-100 hover:text-general-20 transition-all body-sm"
        >
          Masuk sebagai Masyarakat
        </Link>
      </div>

      {/* TOMBOL KEMBALI KE BERANDA */}
      <div className="mt-6 text-center">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-general-60 hover:text-blue-100 transition-colors body-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </AuthLayout>
  )
}