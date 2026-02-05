import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect, useMemo } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { authService } from "@/services/auth"
import { adminService, type KitchenNeedItem } from "@/services/admin"
import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import {
  X, CheckCircle2, Send, Loader2, ArrowRight, Search, ChevronLeft, ChevronRight
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

  // --- STATE UNTUK SEARCH & PAGINATION ---
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Fetch Konten Dinamis
  const { data: kitchenNeeds, isLoading: isContentLoading } = useQuery({
    queryKey: ["public", "kitchen-content"],
    queryFn: adminService.kitchen.getAll
  })

  // Auth Check
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

  const handleCardClick = (need: KitchenNeedItem) => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" }) 
      return
    }
    setSelectedNeed(need)
    setIsModalOpen(true)
  }

  // --- LOGIC FILTER, SORTING (A-Z), & PAGINATION ---
  const filteredNeeds = useMemo(() => {
    if (!kitchenNeeds) return []
    
    // 1. Filter Data
    const filtered = kitchenNeeds.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 2. Sort Data A-Z (Alphabetical)
    return filtered.sort((a, b) => a.title.localeCompare(b.title))

  }, [kitchenNeeds, searchTerm])

  const totalPages = Math.ceil(filteredNeeds.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredNeeds.slice(indexOfFirstItem, indexOfLastItem)

  // --- LOGIKA PAGINATION SESUAI REQUEST ---
  const paginationItems = useMemo(() => {
    // Jika halaman sedikit (<= 3), tampilkan semua (1 2 3)
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Jika halaman > 3, paksa format: 1 2 ... Last
    // Contoh: 1 2 ... 8 atau 1 2 ... 10
    return [1, 2, "...", totalPages];
  }, [totalPages]);

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const goToPage = (page: number) => setCurrentPage(page)

  // Reset page ke 1 jika user melakukan pencarian
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])


  if (isChecking || isContentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-general-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-general-20 font-sans text-general-100">
      <Navbar />
      
      <main className="flex-1 py-12 md:py-16">
        <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24 max-w-[2400px]">
          
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <h1 className="h2 font-heading text-general-100 mb-4">
              Pusat <span className="text-blue-100">Kebutuhan Dapur</span>
            </h1>
            <p className="body-md text-general-60">
              Temukan solusi profesional untuk menunjang operasional SPPG Anda.
            </p>
          </div>

          {/* --- SEARCH BAR --- */}
          <div className="max-w-md mx-auto mb-10 relative group">
            <input
              type="text"
              placeholder="Cari kebutuhan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-40 shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-general-40 group-focus-within:text-blue-100 transition-colors" />
          </div>

          {/* DYNAMIC GRID */}
          {currentItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {currentItems.map((item) => (
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
          ) : (
             <div className="text-center py-20">
               <p className="text-general-50 body-md">Tidak ada data ditemukan untuk "{searchTerm}"</p>
             </div>
          )}

          {/* --- PAGINATION CONTROLS (UPDATED) --- */}
          {filteredNeeds.length > itemsPerPage && (
            <div className="mt-12 flex justify-center items-center gap-2 select-none">
              
              {/* Prev Button */}
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex gap-1 mx-2">
                {paginationItems.map((item, idx) => {
                  if (item === "...") {
                    return (
                      <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-general-60 font-bold text-xs sm:text-sm">
                        ...
                      </span>
                    )
                  }

                  const pageNum = item as number
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`
                        w-8 h-8 rounded-lg text-sm font-bold border transition-all flex items-center justify-center
                        ${currentPage === pageNum 
                          ? 'bg-blue-100 border-blue-100 text-white shadow-sm' 
                          : 'bg-white border-general-30 text-general-60 hover:border-blue-100 hover:text-blue-100'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              {/* Next Button */}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

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

  // --- VALIDASI ---
  const MIN_DETAIL_CHARS = 20
  
  // 1. Validasi No. Telepon (9-12 digit)
  const isPhoneValid = /^\d{9,12}$/.test(formData.phoneNumber)
  
  // 2. Validasi Detail (Minimal 20 karakter)
  const isDetailValid = formData.details.trim().length >= MIN_DETAIL_CHARS

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (/^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, phoneNumber: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Cek semua validasi sebelum submit
    if (!isPhoneValid || !isDetailValid) return 

    setIsLoading(true)
    try {
      await adminService.kitchen.submitRequest({
        kitchenNeedId: need.id,
        sppgName: formData.sppgName,
        contactPerson: formData.contactPerson,
        position: formData.position,
        phoneNumber: `62${formData.phoneNumber}`,
        details: formData.details,
      })
      setIsSuccess(true)
      queryClient.invalidateQueries({ queryKey: ["profile", "kitchen-requests"] })
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
        
        {/* Header Modal */}
        <div className="px-6 py-5 sm:px-8 border-b border-general-30 flex justify-between items-center bg-general-20 shrink-0">
          <div>
            <p className="body-xs font-bold text-orange-100 uppercase tracking-wider mb-1">Formulir Kebutuhan</p>
            <h3 className="h3 font-heading text-general-100">{need.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-general-30 rounded-full transition-colors text-general-60"><X className="w-6 h-6" /></button>
        </div>

        {/* Body Modal */}
        <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar">
          <form id="kitchen-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nama SPPG */}
            <div className="space-y-2">
              <label className="body-sm font-bold text-general-80 tracking-wide">Nama SPPG / Instansi</label>
              <input required name="sppgName" value={formData.sppgName} onChange={handleChange} type="text" placeholder="Contoh: SPPG MBG" className="w-full px-5 py-3.5 bg-general-20 border border-general-30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100" />
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
              <div className="relative group">
                <div className="flex items-center w-full bg-general-20 border border-general-30 rounded-xl focus-within:ring-2 focus-within:ring-blue-100/20 focus-within:border-blue-100 transition-all overflow-hidden">
                  <div className="pl-5 pr-3 py-3.5 bg-general-30/50 border-r border-general-30 text-general-60 font-bold body-sm select-none">
                    +62
                  </div>
                  <input 
                    required 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handlePhoneInput} 
                    type="tel" 
                    placeholder="8xxxxxxxxxx" 
                    maxLength={12}
                    className="flex-1 px-4 py-3.5 bg-transparent outline-none body-sm text-general-100 placeholder:text-general-40" 
                  />
                </div>
              </div>
              <div className="flex justify-between px-1">
                <p className="text-[10px] text-general-50 italic">Tanpa angka 0 di awal</p>
                {formData.phoneNumber.length > 0 && !isPhoneValid && (
                  <p className="text-[10px] text-red-100 font-bold animate-pulse">Wajib 9-12 Angka</p>
                )}
              </div>
            </div>

            {/* Detail Kebutuhan (DENGAN VALIDASI VISUAL) */}
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                 <label className="body-sm font-bold text-general-80 tracking-wide">Detail Kebutuhan</label>
                 <span className={`text-[10px] font-bold ${!isDetailValid && formData.details.length > 0 ? "text-red-100" : "text-general-50"}`}>
                   {formData.details.length}/{MIN_DETAIL_CHARS} Karakter
                 </span>
               </div>
               <textarea 
                 required 
                 name="details" 
                 value={formData.details} 
                 onChange={handleChange} 
                 rows={5} 
                 className={`w-full px-5 py-3.5 bg-general-20 border rounded-xl focus:outline-none focus:ring-2 transition-all body-sm resize-none text-general-100
                   ${!isDetailValid && formData.details.length > 0 
                     ? "border-red-100 focus:ring-red-100/20 focus:border-red-100" 
                     : "border-general-30 focus:ring-blue-100/20 focus:border-blue-100"
                   }
                 `} 
                 placeholder={`Jelaskan spesifikasi atau kebutuhan Anda (Min. ${MIN_DETAIL_CHARS} karakter)...`} 
               />
            </div>

          </form>
        </div>

        {/* Footer Modal */}
        <div className="p-6 sm:px-10 border-t border-general-30 bg-general-20 shrink-0">
          <button 
            type="submit" 
            form="kitchen-form" 
            disabled={isLoading || !isPhoneValid || !isDetailValid} 
            className="w-full py-4 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Kirim Permintaan</>}
          </button>
        </div>

      </div>
    </div>
  )
}