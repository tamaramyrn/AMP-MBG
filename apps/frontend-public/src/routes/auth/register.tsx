import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/auth-layout"
import { useState } from "react"
import { Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft, ShieldCheck, UserPlus } from "lucide-react"
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
  const [success, setSuccess] = useState(false)

  // --- LOGIKA ASLI (TETAP SAMA PERSIS) ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", 
    password: "",
    confirmPassword: "",
  })
  const [isAgreed, setIsAgreed] = useState(false)

  // Validasi
  const isPhoneValid = /^\d{9,12}$/.test(formData.phone)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  const isPasswordValid = passwordRegex.test(formData.password)
  const isMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ""
  const isNameValid = formData.name.trim().length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

  const isValid = isNameValid && isEmailValid && isPhoneValid && isPasswordValid && isMatch && isAgreed

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
        email: formData.email,
        phone: `62${formData.phone}`,
        password: formData.password,
        passwordConfirmation: formData.confirmPassword,
      })
      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate({ to: "/auth/login" })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* HEADER SECTION AESTHETIC */}
      <div className="mb-8 relative">
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-100/10 rounded-full blur-2xl" />
        <h1 className="h3 font-heading font-bold text-general-100 mb-2">
          Mari, <span className="text-blue-100">Masyarakat!</span>
        </h1>
        <p className="body-md text-general-60">
          Buat akun untuk melapor dan mengawasi.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {success && (
          <div className="bg-green-20 border border-green-100/30 text-green-100 px-4 py-4 rounded-xl body-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Registrasi Berhasil!</p>
              <p className="text-xs mt-0.5">Mengalihkan ke halaman login...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-start gap-3 animate-in fade-in">
            <div className="w-1.5 h-1.5 bg-red-100 rounded-full mt-2 shrink-0" />
            {error}
          </div>
        )}

        {/* Nama Lengkap */}
        <div className="group bg-white border border-general-30 rounded-xl px-4 py-2 transition-all duration-300 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50">
          <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
            Nama Lengkap
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            type="text"
            placeholder="Masukkan nama Anda"
            className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
          />
        </div>

        {/* Surel (Email) */}
        <div className="space-y-1">
          <div className={`group bg-white border rounded-xl px-4 py-2 transition-all duration-300 ${
            formData.email.length > 0 && !isEmailValid
              ? "border-red-100 ring-2 ring-red-100/5"
              : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
          }`}>
            <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
              Surel
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="Contoh: a@b.com"
              className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
            />
          </div>
          {formData.email.length > 0 && !isEmailValid && (
            <p className="text-[10px] text-red-100 px-1 font-medium ml-1">* Format email tidak valid</p>
          )}
        </div>

        {/* Nomor Telepon */}
        <div className="space-y-1">
          <div className={`group bg-white border rounded-xl px-4 py-2 transition-all duration-300 ${
              formData.phone.length > 0 && !isPhoneValid 
                ? "border-red-100 ring-2 ring-red-100/5" 
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
            }`}>
            <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
              Nomor Telepon
            </label>
            
            <div className="flex items-center gap-3">
                <span className="text-general-100 font-bold body-sm bg-general-20 px-2 py-1 rounded-md text-xs select-none border border-general-30">
                    +62
                </span>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleNumberInput}
                    type="tel"
                    maxLength={12} 
                    placeholder="8xxxxxxxxxx"
                    className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium tracking-wide"
                />
            </div>
          </div>
          
          <div className="flex justify-between items-start px-1 ml-1">
             <p className="text-[10px] text-general-50 font-medium">Tanpa angka 0 di awal</p>
             {formData.phone.length > 0 && !isPhoneValid && (
                <p className="text-[10px] text-red-100 font-bold">Wajib 9-12 Angka</p>
             )}
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-1">
            <div className={`group bg-white border rounded-xl px-4 py-2 transition-all duration-300 ${
              formData.password.length > 0 && !isPasswordValid
                ? "border-red-100 ring-2 ring-red-100/5" 
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
            }`}>
              <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                Kata Sandi
              </label>
              <div className="flex items-center gap-2">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata sandi kuat"
                  className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-general-40 hover:text-blue-100 transition-colors p-1"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className={`group bg-white border rounded-xl px-4 py-2 transition-all duration-300 ${
               formData.confirmPassword.length > 0 && !isMatch
                ? "border-red-100 ring-2 ring-red-100/5"
                : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
            }`}>
              <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                Konfirmasi
              </label>
              <div className="flex items-center gap-2">
                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi sandi"
                  className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-general-40 hover:text-blue-100 transition-colors p-1"
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {formData.confirmPassword.length > 0 && !isMatch && (
              <p className="text-[10px] text-red-100 px-1 font-medium ml-1">* Sandi tidak cocok</p>
            )}
          </div>
        </div>

        {/* Indikator Kekuatan Password */}
        {formData.password.length > 0 && !isPasswordValid && (
          <div className="bg-red-20/50 border border-red-100/30 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
             <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <p className="text-[11px] font-bold text-red-600">Syarat Keamanan Kata Sandi:</p>
             </div>
             <ul className="text-[10px] text-red-500 grid grid-cols-2 gap-x-2 gap-y-1 pl-1">
               <li className={`flex items-center gap-1.5 ${formData.password.length >= 8 ? "text-green-600 font-bold" : ""}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? "bg-green-600" : "bg-red-300"}`} /> Min. 8 Karakter
               </li>
               <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.password) ? "text-green-600 font-bold" : ""}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? "bg-green-600" : "bg-red-300"}`} /> Huruf Besar
               </li>
               <li className={`flex items-center gap-1.5 ${/[a-z]/.test(formData.password) ? "text-green-600 font-bold" : ""}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? "bg-green-600" : "bg-red-300"}`} /> Huruf Kecil
               </li>
               <li className={`flex items-center gap-1.5 ${/[0-9]/.test(formData.password) ? "text-green-600 font-bold" : ""}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(formData.password) ? "bg-green-600" : "bg-red-300"}`} /> Angka
               </li>
             </ul>
          </div>
        )}

        {/* Terms - Custom Checkbox UI */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div className="relative flex items-center mt-0.5">
              <input 
                type="checkbox" 
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="peer sr-only" 
              />
              <div className="w-5 h-5 border-2 border-general-40 rounded transition-all peer-checked:bg-blue-100 peer-checked:border-blue-100 peer-focus:ring-2 peer-focus:ring-blue-100/20" />
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="body-sm text-general-80 group-hover:text-general-100 transition-colors">
              Saya menyetujui <span className="text-blue-100 font-semibold hover:underline">Ketentuan AMP MBG</span>.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full py-3.5 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2.5 ${
            isValid && !isLoading ? "cursor-pointer" : "cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white/90" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
          {isLoading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-general-30 text-center space-y-6">
        <p className="body-sm text-general-60">
          Sudah memiliki akun?{" "}
          <Link to="/auth/login" className="text-blue-100 font-bold hover:text-orange-100 transition-colors duration-300 decoration-2 hover:underline underline-offset-4">
            Masuk
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