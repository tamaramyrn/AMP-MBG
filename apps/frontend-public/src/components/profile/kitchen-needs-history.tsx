import { memo, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Utensils, Calendar, ChefHat, Truck, Calculator, Droplets, LayoutTemplate, HelpCircle, Building2 } from "lucide-react"
// import { profileService } from "@/services/profile" 

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }

// --- 1. CONFIG & HELPERS ---

// Icon tetap disimpan untuk referensi logika desktop jika nanti dibutuhkan lagi, 
// tapi tidak akan dirender di UI sesuai request.
const CATEGORY_ICONS: Record<string, any> = {
  "ahli_gizi": Utensils,
  "akuntan": Calculator,
  "ipal": Droplets,
  "peralatan": ChefHat,
  "layout": LayoutTemplate,
  "logistik": Truck,
}

const CATEGORY_LABELS: Record<string, string> = {
  "ahli_gizi": "Ahli Gizi",
  "akuntan": "Akuntan/Keuangan",
  "ipal": "IPAL Dapur",
  "peralatan": "Peralatan Dapur",
  "layout": "Layouting Dapur",
  "logistik": "Rantai Pasok & Logistik",
}

// Label Status
const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Belum Diproses", variant: "orange" },
  processed: { label: "Diproses", variant: "blue" },
  completed: { label: "Selesai", variant: "green" },
  not_found: { label: "Tidak Ditemukan", variant: "red" },
}

const getStatusStyle = (status: string) => {
  const normalizedStatus = status ? status.toLowerCase() : ""
  const statusInfo = STATUS_LABELS[normalizedStatus] || { label: status, variant: "gray" }
  
  const variantStyles: Record<string, string> = {
    orange: "bg-orange-20 text-orange-100 border-orange-30",
    green: "bg-green-20 text-green-100 border-green-30",
    red: "bg-red-20 text-red-100 border-red-30",
    yellow: "bg-yellow-20 text-yellow-100 border-yellow-30", 
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    gray: "bg-general-30 text-general-70 border-general-40",
  }

  return { 
    label: statusInfo.label, 
    className: variantStyles[statusInfo.variant] || variantStyles.gray 
  }
}

// --- 2. COMPONENT ---

function KitchenNeedsHistoryComponent() {
  // Simulasi Loading & Data
  const isLoading = false
  
  const requests = [
    {
      id: "REQ-001",
      createdAt: "2024-01-25T08:00:00Z",
      category: "ahli_gizi",
      sppgName: "Dapur Umum Sejahtera",
      status: "pending" 
    },
    {
      id: "REQ-002",
      createdAt: "2024-01-20T14:30:00Z",
      category: "layout",
      sppgName: "Katering Berkah",
      status: "processed" 
    },
    {
      id: "REQ-003",
      createdAt: "2024-01-10T09:15:00Z",
      category: "peralatan",
      sppgName: "Sekolah Alam",
      status: "completed" 
    },
    {
      id: "REQ-004",
      createdAt: "2023-12-05T11:00:00Z",
      category: "logistik",
      sppgName: "UD. Sumber Rejeki",
      status: "not_found" 
    }
  ]

  const formatDate = useCallback((dateString: string) => new Date(dateString).toLocaleDateString("id-ID", DATE_OPTIONS), [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-general-30 p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-general-30 overflow-hidden text-center p-12">
        <div className="w-16 h-16 bg-general-20 rounded-full flex items-center justify-center mx-auto mb-4 text-general-40">
          <Utensils className="w-8 h-8" />
        </div>
        <h3 className="text-general-100 font-bold mb-1">Belum Ada Permintaan</h3>
        <p className="text-general-60 body-sm">Anda belum pernah mengajukan kebutuhan dapur.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-general-30 overflow-hidden">
      
      {/* Header Section */}
      <div className="px-6 py-5 md:px-8 border-b border-general-30 flex items-center gap-3 bg-general-20/30">
        <div className="p-2 bg-blue-20 rounded-lg">
          <Utensils className="w-5 h-5 text-blue-100" />
        </div>
        <h2 className="text-lg font-bold text-general-100">Riwayat Kebutuhan Dapur</h2>
      </div>

      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-20/30 border-b border-general-30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider w-16">No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Nama SPPG</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-general-30">
            {requests.map((req, index) => {
              const statusStyle = getStatusStyle(req.status)
              
              return (
                <tr key={req.id} className="hover:bg-blue-20/10 transition-colors">
                  <td className="px-6 py-4 body-sm text-general-60 font-medium">{index + 1}</td>
                  
                  <td className="px-6 py-4 body-sm text-general-80">
                    {formatDate(req.createdAt)}
                  </td>
                  
                  {/* Desktop: Text Only (Sesuai Request) */}
                  <td className="px-6 py-4 body-sm text-general-80 font-medium">
                    {CATEGORY_LABELS[req.category] || req.category}
                  </td>
                  
                  <td className="px-6 py-4 body-sm text-general-80">
                    <div className="flex flex-col">
                      <span className="font-medium text-general-100">{req.sppgName}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Layout (Cards Style - Modern & Responsive) */}
      <div className="md:hidden flex flex-col gap-4 p-4 bg-general-20/30">
        {requests.map((req, index) => {
          const statusStyle = getStatusStyle(req.status)

          return (
            <div key={req.id} className="bg-white rounded-xl border border-general-30 shadow-sm p-4 hover:shadow-md transition-shadow">
              
              {/* Header Kartu: Tanggal & Status */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-general-50 bg-general-20 px-2 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(req.createdAt)}
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${statusStyle.className}`}>
                  {statusStyle.label}
                </span>
              </div>
              
              {/* Content Utama: Nama Kategori */}
              <div className="mb-4">
                <h4 className="font-heading font-bold text-general-100 text-lg leading-tight">
                  {CATEGORY_LABELS[req.category] || req.category}
                </h4>
              </div>

              {/* Footer Kartu: SPPG Info */}
              <div className="flex items-start gap-3 pt-3 border-t border-general-30 border-dashed">
                <div>
                    <p className="text-[10px] font-bold text-general-50 uppercase tracking-wider mb-0.5">SPPG / Instansi</p>
                    <p className="text-sm font-medium text-general-80">{req.sppgName}</p>
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}

export const KitchenNeedsHistory = memo(KitchenNeedsHistoryComponent)