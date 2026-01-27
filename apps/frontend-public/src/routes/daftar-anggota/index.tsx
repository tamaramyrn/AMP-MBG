import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { useState, useEffect } from "react"
import { ChevronDown, CheckCircle2, Loader2, ArrowLeft, Building2 } from "lucide-react"
import { authService } from "@/services/auth"
import { api } from "@/lib/api"

export const Route = createFileRoute("/daftar-anggota/")({
  component: DaftarAnggotaPage,
})

const MEMBER_TYPES = [
  { value: "supplier", label: "Supplier/Vendor" },
  { value: "caterer", label: "Katering" },
  { value: "school", label: "Pihak Sekolah" },
  { value: "government", label: "Pemerintah Daerah" },
  { value: "foundation", label: "Yayasan"},
  { value: "ngo", label: "LSM/NGO" },
  { value: "farmer", label: "Petani/Peternak" },
  { value: "other", label: "Lainnya" },
]

function DaftarAnggotaPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // --- LOGIKA ASLI (TETAP) ---
  const [formData, setFormData] = useState({
    memberType: "",
    organizationName: "",
    organizationEmail: "",
    organizationPhone: "",
    roleDescription: "",
    mbgDescription: "",
  })

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (!user) {
      navigate({ to: "/auth/login" })
    } else if (user.role !== "public") {
      navigate({ to: "/profil" })
    } else {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [navigate])

  const isPhoneValid = /^\d{9,15}$/.test(formData.organizationPhone)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizationEmail)
  const isNameValid = formData.organizationName.trim().length >= 3
  const isRoleDescValid = formData.roleDescription.trim().length >= 10
  const isMbgDescValid = formData.mbgDescription.trim().length >= 10

  const isValid =
    formData.memberType !== "" &&
    isNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isRoleDescValid &&
    isMbgDescValid

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, organizationPhone: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setError("")
    setIsLoading(true)

    try {
      await api.post("/auth/apply-member", formData)
      setShowSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal")
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-general-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <>
      <div className="min-h-screen flex flex-col bg-general-20 font-sans">
        <Navbar />
        
        <main className="flex-1 py-10 md:py-14">
          <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
            
             {/* Header Section */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-general-60 hover:text-blue-100 transition-colors body-sm font-medium mb-4 group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Kembali
                  </button>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-general-100">
                    Daftar Sebagai <span className="text-blue-100">Anggota</span>
                  </h1>
                  {/* UPDATE TEKS JADI 1 BARIS */}
                  <p className="body-sm text-general-60 mt-1 max-w-3xl">
                    Lengkapi data organisasi Anda untuk bergabung dan berkontribusi dalam program MBG.
                  </p>
               </div>
             </div>

             {/* Content Card (FULL WIDTH) */}
             <div className="w-full bg-white rounded-2xl border border-general-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] p-6 md:p-10 relative overflow-hidden">
                {/* Dekorasi Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {error && (
                    <div className="bg-red-20/50 border border-red-100/20 text-red-100 px-4 py-3 rounded-xl body-sm flex items-start gap-3 animate-in fade-in">
                        <div className="w-1.5 h-1.5 bg-red-100 rounded-full mt-2 shrink-0" />
                        {error}
                    </div>
                    )}

                    {/* Jenis Organisasi */}
                    <div className="group relative bg-white border border-general-30 rounded-xl px-4 pb-2.5 pt-1.5 transition-all duration-300 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50">
                    <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                        Jenis Organisasi/Komunitas
                    </label>
                    <div className="relative flex items-center">
                        <select
                        name="memberType"
                        value={formData.memberType}
                        onChange={handleChange}
                        className="w-full outline-none text-general-100 bg-transparent body-sm cursor-pointer appearance-none pr-8 font-medium py-1"
                        disabled={isLoading}
                        >
                        <option value="" disabled>Pilih jenis organisasi</option>
                        {MEMBER_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                        </select>
                        <ChevronDown className="absolute right-0 w-4 h-4 text-general-40 pointer-events-none group-focus-within:text-blue-100 transition-colors" />
                    </div>
                    </div>

                    {/* Nama Organisasi */}
                    <div className="space-y-1">
                    <div className={`group relative bg-white border rounded-xl px-4 pb-2.5 pt-1.5 transition-all duration-300 ${
                        formData.organizationName.length > 0 && !isNameValid
                        ? "border-red-100 ring-2 ring-red-100/5"
                        : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
                    }`}>
                        <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                        Nama Organisasi/Komunitas
                        </label>
                        <input
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleChange}
                        type="text"
                        placeholder="Masukkan nama organisasi"
                        className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                        disabled={isLoading}
                        />
                    </div>
                    {formData.organizationName.length > 0 && !isNameValid && (
                        <p className="text-[10px] text-red-100 font-medium px-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-100"/> Min. 3 karakter ({formData.organizationName.trim().length}/3)
                        </p>
                    )}
                    </div>

                    {/* Grid Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Email */}
                    <div className="space-y-1">
                        <div className={`group relative bg-white border rounded-xl px-4 pb-2.5 pt-1.5 transition-all duration-300 ${
                        formData.organizationEmail.length > 0 && !isEmailValid
                            ? "border-red-100 ring-2 ring-red-100/5"
                            : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
                        }`}>
                        <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                            Surel Organisasi
                        </label>
                        <input
                            name="organizationEmail"
                            value={formData.organizationEmail}
                            onChange={handleChange}
                            type="email"
                            placeholder="email@organisasi.com"
                            className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                            disabled={isLoading}
                        />
                        </div>
                        {formData.organizationEmail.length > 0 && !isEmailValid && (
                        <p className="text-[10px] text-red-100 font-medium px-1">* Format email tidak valid</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                        <div className={`group relative bg-white border rounded-xl px-4 pb-2.5 pt-1.5 transition-all duration-300 ${
                        formData.organizationPhone.length > 0 && !isPhoneValid
                            ? "border-red-100 ring-2 ring-red-100/5"
                            : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
                        }`}>
                        <label className="block body-xs font-semibold text-general-60 mb-0.5 group-focus-within:text-blue-100 transition-colors">
                            Nomor Telepon
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-general-100 font-bold body-sm bg-general-20 px-2 py-0.5 rounded text-xs select-none border border-general-30">
                            +62
                            </span>
                            <input
                            name="organizationPhone"
                            value={formData.organizationPhone}
                            onChange={handlePhoneInput}
                            type="tel"
                            maxLength={15}
                            placeholder="8xxxxxxxxxx"
                            className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium tracking-wide"
                            disabled={isLoading}
                            />
                        </div>
                        </div>
                        <div className="flex justify-between px-1">
                            <p className="text-[10px] text-general-50">Tanpa angka 0 awal</p>
                            {formData.organizationPhone.length > 0 && !isPhoneValid && (
                            <p className="text-[10px] text-red-100 font-medium">9-15 Angka</p>
                            )}
                        </div>
                    </div>
                    </div>

                    {/* Deskripsi Peran */}
                    <div className="space-y-1">
                    <div className={`group relative bg-white border rounded-xl px-4 pb-2.5 pt-1.5 transition-all duration-300 ${
                        formData.roleDescription.length > 0 && !isRoleDescValid
                        ? "border-red-100 ring-2 ring-red-100/5"
                        : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
                    }`}>
                        <label className="block body-xs font-semibold text-general-60 mb-1 group-focus-within:text-blue-100 transition-colors">
                        Deskripsi Peran Anda
                        </label>
                        <textarea
                        name="roleDescription"
                        value={formData.roleDescription}
                        onChange={handleChange}
                        placeholder="Jelaskan peran dan tanggung jawab Anda..."
                        rows={3}
                        className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent resize-none leading-relaxed"
                        disabled={isLoading}
                        />
                    </div>
                    {formData.roleDescription.length > 0 && !isRoleDescValid && (
                        <p className="text-[10px] text-red-100 font-medium px-1 text-right">
                        {formData.roleDescription.trim().length}/10 Karakter
                        </p>
                    )}
                    </div>

                    {/* Deskripsi MBG */}
                    <div className="space-y-1">
                    <div className={`group relative bg-white border rounded-xl px-4 pb-2.5 pt-1.5 transition-all duration-300 ${
                        formData.mbgDescription.length > 0 && !isMbgDescValid
                        ? "border-red-100 ring-2 ring-red-100/5"
                        : "border-general-30 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 hover:border-blue-100/50"
                    }`}>
                        <label className="block body-xs font-semibold text-general-60 mb-1 group-focus-within:text-blue-100 transition-colors">
                        Kontribusi Terkait MBG
                        </label>
                        <textarea
                        name="mbgDescription"
                        value={formData.mbgDescription}
                        onChange={handleChange}
                        placeholder="Jelaskan keterlibatan organisasi Anda dalam program MBG..."
                        rows={3}
                        className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent resize-none leading-relaxed"
                        disabled={isLoading}
                        />
                    </div>
                    {formData.mbgDescription.length > 0 && !isMbgDescValid && (
                        <p className="text-[10px] text-red-100 font-medium px-1 text-right">
                        {formData.mbgDescription.trim().length}/10 Karakter
                        </p>
                    )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                    <button
                        type="submit"
                        disabled={!isValid || isLoading}
                        className={`w-full py-4 bg-gradient-to-r from-blue-100 to-blue-90 hover:from-blue-90 hover:to-blue-100 text-white font-heading font-bold rounded-xl transition-all shadow-lg shadow-blue-100/20 hover:shadow-blue-100/40 transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2.5 ${
                            isValid && !isLoading ? "cursor-pointer" : "cursor-not-allowed"
                        }`}
                    >
                        {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                        ) : (
                        <Building2 className="w-5 h-5" />
                        )}
                        {isLoading ? "Memproses..." : "Kirim Pendaftaran"}
                    </button>
                    </div>
                </form>
             </div>
          </div>
        </main>
        <Footer />
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-general-100/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100 border border-general-30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/10 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="flex flex-col items-center text-center mb-8 relative z-10">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-green-50/50">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="h3 font-bold text-general-100 mb-3">Pendaftaran Terkirim!</h3>
              <p className="body-sm text-general-60 leading-relaxed">
                Terima kasih. Data organisasi Anda telah kami terima dan sedang dalam proses verifikasi oleh tim AMP MBG.
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/profil" })}
              className="w-full py-3.5 bg-blue-100 hover:bg-blue-90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg body-sm"
            >
              Kembali ke Profil
            </button>
          </div>
        </div>
      )}
    </>
  )
}