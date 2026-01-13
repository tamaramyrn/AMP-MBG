"use client"

import Link from "next/link"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterAnggotaPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Daftar Anggota AMP MBG</h1>
        <p className="text-gray-600">Daftar sebagai anggota resmi AMP MBG</p>
      </div>

      <form className="space-y-5">
        {/* Full Name */}
        <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
          <legend className="text-sm text-gray-600 px-1">Nama Lengkap</legend>
          <input
            type="text"
            placeholder="Masukkan nama Anda"
            className="w-full outline-none text-gray-700 placeholder:text-gray-400"
          />
        </fieldset>

        {/* NIK and Email side by side */}
        <div className="grid grid-cols-2 gap-4">
          <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
            <legend className="text-sm text-gray-600 px-1">NIK</legend>
            <input
              type="text"
              placeholder="Masukkan NIK Anda"
              maxLength={16}
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
            />
          </fieldset>
          <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
            <legend className="text-sm text-gray-600 px-1">Surel</legend>
            <input
              type="email"
              placeholder="Masukkan surel Anda"
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
            />
          </fieldset>
        </div>

        {/* Organization/Role */}
        <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
          <legend className="text-sm text-gray-600 px-1">Organisasi/Peran</legend>
          <select className="w-full outline-none text-gray-700 bg-transparent">
            <option value="">Pilih organisasi atau peran Anda</option>
            <option value="supplier">Supplier/Vendor</option>
            <option value="caterer">Katering</option>
            <option value="school">Pihak Sekolah</option>
            <option value="government">Pemerintah Daerah</option>
            <option value="ngo">LSM/NGO</option>
            <option value="other">Lainnya</option>
          </select>
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

        {/* Confirm Password */}
        <fieldset className="border border-gray-300 rounded-lg px-3 pb-3 pt-1">
          <legend className="text-sm text-gray-600 px-1">Konfirmasi Kata Sandi</legend>
          <div className="flex items-center">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi Anda"
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </fieldset>

        {/* Terms */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary" />
            <span className="text-sm text-gray-700">Saya setuju dengan Ketentuan AMP MBG</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          Daftar sebagai Anggota
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Sudah memiliki akun?{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Masuk
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-500 text-sm">atau</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <Link
        href="/auth/register"
        className="block w-full py-3 border-2 border-primary text-primary font-medium rounded-lg text-center hover:bg-primary hover:text-white transition-colors"
      >
        Daftar sebagai Masyarakat
      </Link>
    </AuthLayout>
  )
}
