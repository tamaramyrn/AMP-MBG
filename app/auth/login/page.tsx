"use client"

import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang!</h1>
        <p className="text-gray-600">Masuk ke akun Anda</p>
      </div>

      <form className="space-y-5">
        {/* Email */}
        <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
          <legend className="text-sm text-gray-600 px-1">Surel</legend>
          <input
            type="email"
            placeholder="Masukkan surel Anda"
            className="w-full outline-none text-gray-700 placeholder:text-gray-400"
          />
        </fieldset>

        {/* Password */}
        <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
          <legend className="text-sm text-gray-600 px-1">Kata Sandi</legend>
          <div className="flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi Anda"
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </fieldset>

        {/* Forgot Password */}
        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
            Lupa kata sandi? Atur ulang
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          Masuk
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Belum memiliki akun?{" "}
        <Link href="/auth/register" className="text-primary font-medium hover:underline">
          Daftar
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 text-sm">atau</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Register Options */}
      <div className="space-y-3">
        <Link
          href="/auth/register"
          className="block w-full py-3 border-2 border-primary text-primary font-medium rounded-lg text-center hover:bg-primary hover:text-white transition-colors"
        >
          Daftar sebagai Masyarakat
        </Link>
        <Link
          href="/auth/register-anggota"
          className="block w-full py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg text-center hover:bg-gray-50 transition-colors"
        >
          Daftar sebagai Anggota AMP MBG
        </Link>
      </div>
    </AuthLayout>
  )
}
