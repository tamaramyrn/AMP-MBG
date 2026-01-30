import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { authService } from "@/services/auth"
import { adminService, type KitchenNeedItem } from "@/services/admin"
import { useQuery } from "@tanstack/react-query"
import { 
  X, CheckCircle2, Send, Loader2, ArrowRight
} from "lucide-react"

export const Route = createFileRoute("/kebutuhan-dapur/")({
  component: KebutuhanDapurPage,
})

function KebutuhanDapurPage() {
  const navigate = useNavigate()
  const [selectedNeed, setSelectedNeed] = useState<KitchenNeedItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Fetch Konten Dinamis
  const { data: kitchenNeeds, isLoading: isContentLoading } = useQuery({
    queryKey: ["public", "kitchen-content"],
    queryFn: adminService.kitchen.getAll
  })

  // PERUBAHAN 1: Cek auth hanya untuk update state, JANGAN redirect di sini
  useEffect(() => {
    const checkAuth = () => {
      const user = authService.getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      setIsChecking(false)
    }
    checkAuth()
  }, [])

  // PERUBAHAN 2: Cek auth saat user mencoba berinteraksi (klik kartu)
  const handleCardClick = (need: KitchenNeedItem) => {
    if (!isAuthenticated) {
      // Jika belum login, arahkan ke login page
      // Opsional: Anda bisa menyimpan 'redirect' state agar setelah login balik lagi ke sini
      navigate({ to: "/auth/login" }) 
      return
    }

    // Jika sudah login, buka modal
    setSelectedNeed(need)
    setIsModalOpen(true)
  }

  if (isChecking || isContentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-general-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
      </div>
    )
  }

  // PERUBAHAN 3: Hapus baris 'if (!isAuthenticated) return null' agar halaman tetap tampil

  return (
    <div className="min-h-screen flex flex-col bg-general-20 font-sans text-general-100">
      <Navbar />
      
      <main className="flex-1 py-12 md:py-16">
        <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24 max-w-[2400px]">
          
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="h2 font-heading text-general-100 mb-4">
              Pusat <span className="text-blue-100">Kebutuhan Dapur</span>
            </h1>
            <p className="body-md text-general-60">
              Temukan solusi profesional untuk menunjang operasional SPPG Anda.
            </p>
          </div>

          {/* DYNAMIC GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {kitchenNeeds?.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`
                  relative overflow-hidden rounded-2xl bg-white border border-general-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] 
                  hover:shadow-lg hover:border-blue-40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full
                `}
              >
                {item.imageUrl ? (
                  // --- TAMPILAN DENGAN GAMBAR ---
                  <>
                    <div className="h-48 w-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-100/10 group-hover:bg-transparent transition-colors z-10" />
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="h4 font-heading text-general-100 mb-3 group-hover:text-blue-100 transition-colors">
                        {item.title}
                      </h3>
                      <p className="body-sm text-general-60 flex-grow text-justify leading-relaxed line-clamp-4">
                        {item.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-general-30 flex items-center text-blue-100 body-sm font-bold">
                        Ajukan Permintaan <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </>
                ) : (
                  // --- TAMPILAN TANPA GAMBAR ---
                  <div className="p-6 md:p-8 flex flex-col h-full relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <h3 className="h4 font-heading text-general-100 mb-3 group-hover:text-blue-100 transition-colors relative z-10">
                      {item.title}
                    </h3>
                    
                    <p className="body-sm text-general-60 flex-grow relative z-10 text-justify leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-6 pt-4 border-t border-general-30 flex items-center text-blue-100 body-sm font-bold relative z-10">
                      Ajukan Permintaan <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                )}
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

// --- REQUEST MODAL ---
function RequestModal({ need, onClose }: { need: KitchenNeedItem, onClose: () => void }) {
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
      await adminService.kitchen.submitRequest({
        kitchenNeedId: need.id,
        sppgName: formData.sppgName,
        contactPerson: formData.contactPerson,
        position: formData.position,
        phoneNumber: formData.phoneNumber,
        details: formData.details,
      })
      setIsSuccess(true)
    } catch (error) {
      console.error(error)
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
          <h3 className="h4 font-heading text-general-100 mb-2">Permintaan Terkirim!</h3>
          <p className="body-sm text-general-60 mb-6 leading-relaxed">
            Tim AMP MBG telah menerima permintaan Anda untuk kebutuhan <strong>{need.title}</strong>.
          </p>
          <button onClick={onClose} className="w-full py-3 bg-blue-100 hover:bg-blue-90 text-white font-bold rounded-xl transition-colors shadow-md body-sm">Tutup</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-general-100/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl md:max-w-3xl shadow-2xl border border-general-30 relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-5 sm:px-8 border-b border-general-30 flex justify-between items-center bg-general-20 shrink-0">
          <div>
            <p className="body-xs font-bold text-orange-100 uppercase tracking-wider mb-1">Formulir Kebutuhan</p>
            <h3 className="h3 font-heading text-general-100">{need.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-general-30 rounded-full transition-colors text-general-60"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar">
          <form id="kitchen-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="body-sm font-bold text-general-80 tracking-wide">Nama SPPG / Instansi</label>
              <input required name="sppgName" value={formData.sppgName} onChange={handleChange} type="text" className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100" />
            </div>
            {/* Contact Person & Jabatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="body-sm font-bold text-general-80 tracking-wide">Contact Person</label>
                <input required name="contactPerson" value={formData.contactPerson} onChange={handleChange} type="text" placeholder="Nama Lengkap" className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100" />
              </div>
              <div className="space-y-2">
                <label className="body-sm font-bold text-general-80 tracking-wide">Jabatan</label>
                <input required name="position" value={formData.position} onChange={handleChange} type="text" placeholder="Contoh: Manajer" className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100" />
              </div>
            </div>
            {/* No Telepon */}
            <div className="space-y-2">
              <label className="body-sm font-bold text-general-80 tracking-wide">No. Telp / WhatsApp</label>
              <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="tel" placeholder="08xxxxxxxxxx" className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100" />
            </div>
            {/* Detail */}
            <div className="space-y-2">
               <label className="body-sm font-bold text-general-80 tracking-wide">Detail Kebutuhan</label>
               <textarea required name="details" value={formData.details} onChange={handleChange} rows={5} className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm resize-none text-general-100" placeholder="Jelaskan kebutuhan..." />
            </div>
          </form>
        </div>
        <div className="p-6 sm:px-10 border-t border-general-30 bg-general-20 shrink-0">
          <button type="submit" form="kitchen-form" disabled={isLoading} className="w-full py-4 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Kirim Permintaan</>}
          </button>
        </div>
      </div>
    </div>
  )
}