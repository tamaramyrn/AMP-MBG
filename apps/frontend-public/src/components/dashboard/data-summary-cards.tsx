import { memo, useMemo, useState } from "react"
import {
  ClipboardCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Tag,
  X,
  HelpCircle
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { reportsService } from "@/services/reports"
import { CATEGORY_LABELS_SHORT } from "@/hooks/use-categories"

// Data Legenda disesuaikan dengan Matriks Skoring
const RISK_LEGEND = [
  { 
    label: "Tingkat Tinggi", 
    color: "bg-red-100", 
    text: "text-red-100",
    desc: "Skor ≥ 12. Relasi jelas, validitas tinggi, bukti lengkap & narasi konsisten." 
  },
  { 
    label: "Tingkat Sedang", 
    color: "bg-orange-500", 
    text: "text-orange-500",
    desc: "Skor 7-11. Informasi cukup jelas namun bukti/narasi parsial atau butuh verifikasi." 
  },
  { 
    label: "Tingkat Rendah", 
    color: "bg-green-100", 
    text: "text-green-100",
    desc: "Skor ≤ 6. Informasi tidak spesifik, minim bukti, atau narasi kontradiktif." 
  }
]

function DataSummaryCardsComponent() {
  const [showLegend, setShowLegend] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => reportsService.getSummary(),
    staleTime: 30000,
  })

  const { row1Data, row2Data } = useMemo(() => {
    const topCategoryLabel = stats?.topCategory
      ? CATEGORY_LABELS_SHORT[stats.topCategory.category] || stats.topCategory.category
      : "-"

    const total = stats?.total || 0
    const verified = stats?.verified || 0 
    const high = stats?.highRisk || 0
    const medium = stats?.mediumRisk || 0 
    const low = stats?.lowRisk || 0       

    // BARIS 1: Status & Kategori
    const row1 = [
      {
        icon: ClipboardCheck,
        value: `${verified} / ${total}`, 
        label: "Laporan Terverifikasi",
        desc: "Dari total laporan masuk", 
        color: "bg-blue-100 text-general-20",
      },
      {
        icon: Tag,
        value: topCategoryLabel,
        label: "Kategori Terbanyak",
        desc: "Isu paling sering dilaporkan", 
        color: "bg-purple-600 text-general-20",
      }
    ]

    // BARIS 2: Detail Tingkat Kepercayaan
    const row2 = [
      {
        icon: AlertTriangle,
        value: high.toLocaleString(),
        label: "Tingkat Tinggi", 
        color: "bg-red-100 text-general-20",
      },
      {
        icon: AlertCircle,
        value: medium.toLocaleString(),
        label: "Tingkat Sedang", 
        color: "bg-orange-500 text-general-20",
      },
      {
        icon: Info,
        value: low.toLocaleString(),
        label: "Tingkat Rendah", 
        color: "bg-green-100 text-general-20",
      }
    ]

    return { row1Data: row1, row2Data: row2 }
  }, [stats])

  // Helper render card (Responsive Styles)
  const renderCard = (item: any, index: number) => (
    <div 
      key={index} 
      className="bg-general-20 rounded-lg p-4 md:p-5 shadow-sm border border-general-30 hover:border-orange-30 transition-colors h-full flex items-center group"
    >
      <div className="flex items-center gap-3 md:gap-4 w-full">
        {/* Icon Container: Resize on Mobile vs Desktop */}
        <div className={`p-2.5 md:p-3 rounded-lg shadow-sm shrink-0 transition-transform group-hover:scale-105 ${item.color}`}>
          <item.icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        
        <div className="overflow-hidden min-w-0">
          {/* Value Text: Responsive Font Size */}
          <p className="text-lg md:text-xl font-bold font-heading text-general-100 leading-tight truncate">
            {item.value}
          </p>
          {/* Label Text */}
          <p className="text-xs md:text-sm font-medium text-general-80 mt-0.5 truncate">
            {item.label}
          </p>
          {/* Desc Text */}
          {item.desc && (
             <p className="text-[10px] text-general-60 mt-0.5 truncate">
               {item.desc}
             </p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="mb-6 md:mb-8">
      
      {/* HEADER + TOMBOL INFO */}
      {/* Flex-col di mobile agar judul & tombol tidak dempetan, sm:flex-row di tablet+ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-5">
        <h3 className="h5 text-general-100">Ringkasan Statistik</h3>
        
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium transition-all ${
            showLegend 
              ? "bg-orange-100 text-general-20 ring-2 ring-orange-30" 
              : "bg-general-20 text-general-60 border border-general-30 hover:bg-general-30"
          }`}
        >
          {showLegend ? <X className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
          <span>{showLegend ? "Tutup Info" : "Keterangan Data"}</span>
        </button>
      </div>

      {/* PANEL LEGENDA (COLLAPSIBLE) */}
      {showLegend && (
        <div className="bg-orange-50/50 border border-orange-20 rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Kolom 1: Penjelasan Tingkat Kepercayaan */}
            <div>
              <h4 className="text-xs font-bold text-general-60 mb-3 tracking-wider">
                Klasifikasi Tingkat Kepercayaan
              </h4>
              <div className="space-y-2">
                {RISK_LEGEND.map((risk, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-2 bg-white rounded border border-general-30/50">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${risk.color}`} />
                    <div>
                      <span className={`text-xs font-bold block ${risk.text}`}>
                        {risk.label}
                      </span>
                      <span className="text-[11px] text-general-70 leading-tight block">
                        {risk.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom 2: Penjelasan Data Lain */}
            <div>
              <h4 className="text-xs font-bold text-general-60 mb-3 tracking-wider">
                Definisi Data
              </h4>
              <div className="space-y-2 text-xs text-general-80">
                <div className="p-2 bg-white rounded border border-general-30/50">
                  <span className="font-bold text-blue-100">Laporan Terverifikasi:</span>
                  <p className="mt-1 text-general-70 leading-relaxed">
                    Jumlah laporan yang telah divalidasi oleh admin sebagai data yang benar dan lengkap (Skoring total cukup), dibandingkan total masuk.
                  </p>
                </div>
                <div className="p-2 bg-white rounded border border-general-30/50">
                  <span className="font-bold text-purple-600">Kategori Terbanyak:</span>
                  <p className="mt-1 text-general-70 leading-relaxed">
                    Jenis permasalahan yang paling sering dilaporkan oleh masyarakat dalam periode waktu saat ini.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CONTAINER KARTU */}
      <div className="space-y-4">
        
        {/* BARIS PERTAMA: Status & Kategori
            - Mobile: Stacked (1 kolom)
            - Tablet/Desktop: 2 Kolom Sejajar
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {row1Data.map(renderCard)}
        </div>

        {/* BARIS KEDUA: Tingkat Kepercayaan
            - Mobile: Stacked (1 kolom)
            - Tablet/Desktop: 3 Kolom Sejajar
            - (sm:grid-cols-3 akan otomatis mengisi layar iPad/Laptop/Monitor dengan proporsional)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {row2Data.map(renderCard)}
        </div>
      </div>

    </div>
  )
}

export const DataSummaryCards = memo(DataSummaryCardsComponent)