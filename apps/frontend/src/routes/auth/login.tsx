import { createFileRoute, Link } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
})

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="h2 text-general-100 mb-2">Selamat Datang!</h1>
        <p className="body-md text-general-60">Masuk ke akun Anda</p>
      </div>

      <form className="space-y-5">
        <fieldset className="border border-general-30 rounded-lg px-3 pb-3 pt-1 focus-within:border-green-100 focus-within:ring-1 focus-within:ring-green-100 transition-all">
          <legend className="body-xs text-general-60 px-1 font-medium">Surel</legend>
          <input
            type="email"
            placeholder="Masukkan surel Anda"
            className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
          />
        </fieldset>

        <fieldset className="border border-general-30 rounded-lg px-3 pb-3 pt-1 focus-within:border-green-100 focus-within:ring-1 focus-within:ring-green-100 transition-all">
          <legend className="body-xs text-general-60 px-1 font-medium">Kata Sandi</legend>
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

        <div className="text-right">
          <Link to="/auth/login" className="body-sm text-green-100 hover:text-green-90 hover:underline font-medium">
            Lupa kata sandi? Atur ulang
          </Link>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-100 hover:bg-green-90 text-general-20 font-heading font-semibold rounded-lg transition-colors shadow-sm body-sm"
        >
          Masuk
        </button>
      </form>

      <p className="text-center body-sm text-general-60 mt-6">
        Belum memiliki akun?{" "}
        <Link to="/auth/register" className="text-green-100 font-semibold hover:underline">
          Daftar
        </Link>
      </p>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-general-30"></div>
        <span className="text-general-50 body-xs">atau</span>
        <div className="flex-1 border-t border-general-30"></div>
      </div>

      <div className="space-y-3">
        <Link
          to="/auth/register"
          className="block w-full py-3 border border-green-100 text-green-100 font-heading font-medium rounded-lg text-center hover:bg-green-100 hover:text-general-20 transition-all body-sm"
        >
          Daftar sebagai Masyarakat
        </Link>
        <Link
          to="/auth/register-anggota"
          className="block w-full py-3 border border-general-30 text-general-80 font-heading font-medium rounded-lg text-center hover:border-general-80 hover:bg-general-20 hover:text-general-100 transition-all body-sm"
        >
          Daftar sebagai Anggota AMP MBG
        </Link>
      </div>
    </AuthLayout>
  )
}
