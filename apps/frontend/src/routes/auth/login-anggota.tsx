import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export const Route = createFileRoute("/auth/login-anggota")({
  component: LoginAnggotaPage,
})

function LoginAnggotaPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  // Handler Login Simulasi
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulasi set user sebagai anggota
    localStorage.setItem("currentUser", JSON.stringify({ name: "Anggota Demo", role: "school" }))
    // Trigger event agar Navbar update
    window.dispatchEvent(new Event("user-login"))
    navigate({ to: "/" })
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="h3 text-general-100 mb-2">Selamat Datang, Anggota!</h1>
        <p className="body-md text-general-60">Masuk untuk mengelola laporan program MBG</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email / NIK Field */}
        <fieldset className="border border-general-30 rounded-lg px-3 pb-3 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
          <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Surel / NIK </legend>
          <input
            type="text"
            placeholder="Masukkan surel atau NIK"
            className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
          />
        </fieldset>

        {/* Password Field */}
        <fieldset className="border border-general-30 rounded-lg px-3 pb-3 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
          <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Kata Sandi</legend>
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi Anda"
              className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
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
          className="w-full py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg transition-colors shadow-sm body-sm"
        >
          Masuk
        </button>
      </form>

      <p className="text-center body-sm text-general-60 mt-6">
        Belum terdaftar sebagai anggota?{" "}
        <Link to="/auth/register-anggota" className="text-blue-100 font-semibold hover:underline">
          Daftar
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
          to="/auth/register"
          className="block w-full py-3 border border-blue-100 text-blue-100 font-heading font-medium rounded-lg text-center hover:bg-blue-100 hover:text-general-20 transition-all body-sm"
        >
          Daftar sebagai Masyarakat
        </Link>
      </div>
    </AuthLayout>
  )
}