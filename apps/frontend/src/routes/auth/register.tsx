import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft } from "lucide-react" // Tambah ArrowLeft
import { authService } from "@/services/auth"

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    email: "",
    phone: "", // Disini hanya menyimpan angka setelah +62
    password: "",
    confirmPassword: "",
  })
  const [isAgreed, setIsAgreed] = useState(false)

  // Validasi
  const isNikValid = /^\d{16}$/.test(formData.nik)
  const isPhoneValid = /^\d{9,12}$/.test(formData.phone) 
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  const isPasswordValid = passwordRegex.test(formData.password)
  const isMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ""
  const isNameValid = formData.name.trim().length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

  const isValid = isNameValid && isNikValid && isEmailValid && isPhoneValid && isPasswordValid && isMatch && isAgreed

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setError("")
    setIsLoading(true)

    try {
      await authService.signup({
        name: formData.name,
        nik: formData.nik,
        email: formData.email,
        phone: `62${formData.phone}`,
        password: formData.password,
        passwordConfirmation: formData.confirmPassword,
      })
      navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-5">
        <h1 className="h3 text-general-100 mb-1">Mari, Masyarakat!</h1>
        <p className="body-md text-general-60">Daftar untuk dapat melapor!</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-3">
        {error && (
          <div className="bg-red-20 border border-red-100 text-red-100 px-4 py-3 rounded-lg body-sm">
            {error}
          </div>
        )}

        {/* Nama Lengkap */}
        <fieldset className="border border-general-30 rounded-lg px-3 pb-2.5 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
          <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Nama Lengkap</legend>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            type="text"
            placeholder="Masukkan nama Anda"
            className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
          />
        </fieldset>

        {/* NIK & Surel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <fieldset className={`border rounded-lg px-3 pb-2.5 pt-1 transition-all ${
              formData.nik.length > 0 && !isNikValid 
                ? "border-red-100 focus-within:ring-red-100" 
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-blue-100"
            }`}>
              <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">NIK</legend>
              <input
                name="nik"
                value={formData.nik}
                onChange={handleNumberInput}
                type="text"
                placeholder="16 Digit Angka"
                maxLength={16}
                className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
              />
            </fieldset>
            {formData.nik.length > 0 && !isNikValid && (
               <p className="text-[10px] text-red-100 px-1">Harus 16 angka ({formData.nik.length}/16)</p>
            )}
          </div>

          <fieldset className="border border-general-30 rounded-lg px-3 pb-2.5 pt-1 focus-within:border-blue-100 focus-within:ring-1 focus-within:ring-blue-100 transition-all h-fit">
            <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Surel</legend>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="Contoh: a@b.com"
              className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
            />
          </fieldset>
        </div>

        {/* Nomor Telepon (Updated with +62) */}
        <div className="flex flex-col gap-1">
          <fieldset className={`border rounded-lg px-3 pb-2.5 pt-1 transition-all flex flex-col ${
              formData.phone.length > 0 && !isPhoneValid 
                ? "border-red-100 focus-within:ring-red-100" 
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-blue-100"
            }`}>
            <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Nomor Telepon</legend>
            
            <div className="flex items-center gap-2">
                <span className="text-general-100 font-medium body-sm bg-general-30/30 px-2 py-0.5 rounded text-sm select-none">
                    +62
                </span>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleNumberInput}
                    type="tel"
                    maxLength={12} 
                    placeholder="8xxxxxxxxxx"
                    className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
                />
            </div>
          </fieldset>
          
          <div className="flex justify-between items-start px-1">
             <p className="text-[10px] text-general-50">Tanpa angka 0 di awal (Contoh: 81234567890)</p>
             {formData.phone.length > 0 && !isPhoneValid && (
                <p className="text-[10px] text-red-100 font-medium">9-12 Angka</p>
             )}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-1">
            <fieldset className={`border rounded-lg px-3 pb-2.5 pt-1 transition-all ${
              formData.password.length > 0 && !isPasswordValid
                ? "border-red-100 focus-within:ring-red-100" 
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-blue-100"
            }`}>
              <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Kata Sandi</legend>
              <div className="flex items-center gap-2">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata sandi kuat"
                  className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-general-40 hover:text-general-60 transition-colors"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-1">
            <fieldset className={`border rounded-lg px-3 pb-2.5 pt-1 transition-all ${
               formData.confirmPassword.length > 0 && !isMatch
                ? "border-red-100 focus-within:ring-red-100" 
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-blue-100"
            }`}>
              <legend className="body-xs text-general-60 px-2 font-medium bg-general-20">Konfirmasi</legend>
              <div className="flex items-center gap-2">
                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi sandi"
                  className="w-full outline-none text-general-100 placeholder:text-general-40 body-sm bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-general-40 hover:text-general-60 transition-colors"
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Indikator Kekuatan Password */}
        {formData.password.length > 0 && !isPasswordValid && (
          <div className="bg-red-20 border border-red-100 p-2.5 rounded-lg">
             <p className="text-[10px] font-semibold text-red-600 mb-1.5">Kata Sandi Wajib Memiliki:</p>
             <ul className="text-[10px] text-red-500 grid grid-cols-2 gap-x-2 gap-y-0.5 list-disc pl-3">
               <li className={formData.password.length >= 8 ? "text-green-600 font-medium" : ""}>Min. 8 Karakter</li>
               <li className={/[A-Z]/.test(formData.password) ? "text-green-600 font-medium" : ""}>Huruf Besar (A-Z)</li>
               <li className={/[a-z]/.test(formData.password) ? "text-green-600 font-medium" : ""}>Huruf Kecil (a-z)</li>
               <li className={/[0-9]/.test(formData.password) ? "text-green-600 font-medium" : ""}>Angka (0-9)</li>
               <li className={/[\W_]/.test(formData.password) ? "text-green-600 font-medium col-span-2" : "col-span-2"}>Simbol (!@#$...)</li>
             </ul>
          </div>
        )}

        {/* Terms */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-4 h-4 text-blue-100 border-general-30 rounded focus:ring-blue-100 accent-blue-100" 
            />
            <span className="body-xs text-general-100">Saya setuju dengan Ketentuan AMP MBG</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full py-2.5 font-heading font-semibold rounded-lg transition-all shadow-sm body-sm flex justify-center items-center gap-2 ${
            isValid && !isLoading
              ? "bg-blue-100 hover:bg-blue-90 text-general-20 cursor-pointer"
              : "bg-general-30 text-general-60 cursor-not-allowed opacity-70"
          }`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Memproses..." : "Daftar sebagai Masyarakat"}
          {isValid && !isLoading && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </form>

      <p className="text-center body-xs text-general-60 mt-4">
        Sudah memiliki akun?{" "}
        <Link to="/auth/login" className="text-blue-100 font-semibold hover:underline">
          Masuk
        </Link>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 border-t border-general-30"></div>
        <span className="text-general-50 body-xs">atau</span>
        <div className="flex-1 border-t border-general-30"></div>
      </div>

      <Link
        to="/auth/register-anggota"
        className="block w-full py-2.5 border-2 border-blue-100 text-blue-100 font-heading font-medium rounded-lg text-center hover:bg-blue-100 hover:text-general-20 transition-all body-sm"
      >
        Daftar sebagai Anggota AMP MBG
      </Link>

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