import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { authService } from "@/services/auth"
import { 
  Utensils, 
  Calculator, 
  Droplets, 
  ChefHat, 
  LayoutTemplate, 
  Truck, 
  X, 
  CheckCircle2, 
  Send,
  Loader2 
} from "lucide-react"

export const Route = createFileRoute("/kebutuhan-dapur/")({
  component: KebutuhanDapurPage,
})

// --- DATA KEBUTUHAN DAPUR ---
const KITCHEN_NEEDS = [
  {
    id: "ahli_gizi",
    title: "Ahli Gizi",
    icon: Utensils,
    description: "SPPG butuh ahli gizi untuk memastikan menu dan porsi memenuhi standar gizi penerima manfaat sesuai kelompok sasaran. Ini juga mengurangi risiko keluhan, alergi, dan ketidaksesuaian menu saat bahan berubah.",
  },
  {
    id: "akuntan",
    title: "Akuntan/Keuangan",
    icon: Calculator,
    description: "SPPG butuh akuntan untuk menjaga akuntabilitas dana melalui pembukuan rapi, bukti transaksi lengkap, dan audit trail yang jelas. Ini membantu kontrol biaya per porsi serta mencegah temuan administrasi/pajak.",
  },
  {
    id: "ipal",
    title: "IPAL Dapur",
    icon: Droplets,
    description: "SPPG butuh IPAL karena dapur skala besar menghasilkan limbah cair yang harus diolah agar memenuhi baku mutu lingkungan. Tanpa IPAL, risiko bau, saluran bermasalah, dan komplain warga bisa menghentikan operasi.",
  },
  {
    id: "peralatan",
    title: "Peralatan Dapur",
    icon: ChefHat,
    description: "SPPG butuh peralatan yang tepat agar kapasitas produksi tercapai secara konsisten dan aman. Peralatan yang sesuai juga mempercepat proses, menurunkan human error, dan mendukung kontrol mutu/keamanan pangan.",
  },
  {
    id: "layout",
    title: "Layouting Dapur",
    icon: LayoutTemplate,
    description: "SPPG butuh layouting untuk mengatur alur kerja dan zonasi bersih–kotor sehingga mengurangi kontaminasi silang. Layout yang baik meningkatkan produktivitas, keselamatan kerja, dan efisiensi ruang.",
  },
  {
    id: "logistik",
    title: "Rantai Pasok & Logistik",
    icon: Truck,
    description: "SPPG butuh manajemen supply chain agar pasokan bahan stabil, kualitas terjaga, dan distribusi tepat waktu. Ini mencegah stockout, lonjakan biaya, dan bahan tidak sesuai spesifikasi.",
  },
]

function KebutuhanDapurPage() {
  const navigate = useNavigate()
  const [selectedNeed, setSelectedNeed] = useState<typeof KITCHEN_NEEDS[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const user = authService.getCurrentUser()
      if (!user) {
        navigate({ to: "/auth/login" })
      } else {
        setIsAuthenticated(true)
      }
      setIsChecking(false)
    }
    checkAuth()
  }, [navigate])

  const handleCardClick = (need: typeof KITCHEN_NEEDS[0]) => {
    setSelectedNeed(need)
    setIsModalOpen(true)
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
    <div className="min-h-screen flex flex-col bg-general-20 font-sans text-general-100">
      <Navbar />
      
      <main className="flex-1 py-12 md:py-16">
        <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24 max-w-[2400px]">
          
          <div className="text-center mb-12 max-w-3xl mx-auto">
            {/* Menggunakan class .h2 (responsive dari CSS) dan font-heading */}
            <h1 className="h2 font-heading text-general-100 mb-4">
              Pusat <span className="text-blue-100">Kebutuhan Dapur</span>
            </h1>
            <p className="body-md text-general-60">
              Temukan solusi profesional untuk menunjang operasional SPPG Anda. Pilih kategori kebutuhan di bawah ini, dan kami akan menghubungkan Anda dengan ahlinya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {KITCHEN_NEEDS.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="bg-white rounded-2xl p-6 md:p-8 border border-general-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-blue-40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="w-14 h-14 bg-blue-20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors duration-300 shrink-0 relative z-10">
                  <item.icon className="w-7 h-7 text-blue-100 group-hover:text-white transition-colors" />
                </div>
                
                {/* Menggunakan class .h4 */}
                <h3 className="h4 font-heading text-general-100 mb-3 group-hover:text-blue-100 transition-colors relative z-10">
                  {item.title}
                </h3>
                
                {/* Menggunakan class .body-sm dan text-justify */}
                <p className="body-sm text-general-60 flex-grow relative z-10 text-justify leading-relaxed">
                  {item.description}
                </p>

                {/* Menggunakan class .body-sm font-bold */}
                <div className="mt-6 pt-4 border-t border-general-30 flex items-center text-blue-100 body-sm font-bold relative z-10">
                  Ajukan Permintaan <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
      
      <Footer />

      {isModalOpen && selectedNeed && (
        <RequestModal 
          need={selectedNeed} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}

// --- KOMPONEN MODAL FORM ---
function RequestModal({ need, onClose }: { need: typeof KITCHEN_NEEDS[0], onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    sppgName: "",
    contactPerson: "",
    position: "",
    phoneNumber: "",
    details: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)) 
      setIsSuccess(true)
    } catch (error) {
      console.error("Gagal mengirim permintaan", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-general-100/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl border border-general-30 animate-in zoom-in-95 duration-200 relative overflow-hidden">
          <div className="w-16 h-16 bg-green-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-30 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-green-100" />
          </div>
          {/* Menggunakan class .h4 */}
          <h3 className="h4 font-heading text-general-100 mb-2">Permintaan Terkirim!</h3>
          {/* Menggunakan class .body-sm */}
          <p className="body-sm text-general-60 mb-6 leading-relaxed">
            Tim AMP MBG telah menerima permintaan Anda untuk kebutuhan <strong>{need.title}</strong>. Kami akan segera menghubungi Contact Person yang terdaftar.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-blue-100 hover:bg-blue-90 text-white font-bold rounded-xl transition-colors shadow-md body-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-general-100/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="bg-white rounded-2xl w-full max-w-2xl md:max-w-3xl shadow-2xl border border-general-30 relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-5 sm:px-8 border-b border-general-30 flex justify-between items-center bg-general-20 shrink-0">
          <div>
            {/* Menggunakan body-xs font-bold dan warna orange sesuai CSS */}
            <p className="body-xs font-bold text-orange-100 uppercase tracking-wider mb-1">Formulir Kebutuhan</p>
            {/* Judul tanpa ikon, menggunakan .h3 */}
            <h3 className="h3 font-heading text-general-100">
              {need.title}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-general-30 rounded-full transition-colors text-general-60">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar">
          <form id="kitchen-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nama SPPG */}
            <div className="space-y-2">
              <label className="body-sm font-bold text-general-80 tracking-wide">Nama SPPG / Instansi</label>
              <input
                required
                name="sppgName"
                value={formData.sppgName}
                onChange={handleChange}
                type="text"
                placeholder="Contoh: Dapur Umum Sejahtera"
                className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-40"
              />
            </div>

            {/* Contact Person & Jabatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="body-sm font-bold text-general-80 tracking-wide">Contact Person</label>
                <input
                  required
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-40"
                />
              </div>
              <div className="space-y-2">
                <label className="body-sm font-bold text-general-80 tracking-wide">Jabatan</label>
                <input
                  required
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  type="text"
                  placeholder="Contoh: Manajer"
                  className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-40"
                />
              </div>
            </div>

            {/* No Telepon */}
            <div className="space-y-2">
              <label className="body-sm font-bold text-general-80 tracking-wide">No. Telp / WhatsApp</label>
              <input
                required
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                type="tel"
                placeholder="08xxxxxxxxxx"
                className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-40"
              />
            </div>

            {/* Detail Kebutuhan */}
            <div className="space-y-2">
              <label className="body-sm font-bold text-general-80 tracking-wide">Detail Kebutuhan</label>
              <textarea
                required
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={5}
                placeholder={`Jelaskan spesifikasi atau masalah yang Anda hadapi terkait ${need.title.toLowerCase()}...`}
                className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm resize-none text-general-100 placeholder:text-general-40"
              />
            </div>

          </form>
        </div>

        {/* Footer Modal */}
        <div className="p-6 sm:px-10 border-t border-general-30 bg-general-20 shrink-0">
          <button
            type="submit"
            form="kitchen-form"
            disabled={isLoading}
            className="w-full py-4 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] body-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Kirim Permintaan
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}