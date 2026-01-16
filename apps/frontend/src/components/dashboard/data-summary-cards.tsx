import { memo, useMemo } from "react"
import { 
  ClipboardCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Tag
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { reportsService } from "@/services/reports"

const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan & Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas & Keamanan",
  policy: "Kebijakan & Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial",
}

function DataSummaryCardsComponent() {
  const { data: stats } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => reportsService.getSummary(),
    staleTime: 30000,
  })

  // Kita pisahkan data menjadi 2 bagian (Row 1 dan Row 2)
  const { row1Data, row2Data } = useMemo(() => {
    const topCategoryLabel = stats?.topCategory 
      ? CATEGORY_LABELS[stats.topCategory.category] || stats.topCategory.category 
      : "-"

    const total = stats?.total || 0
    const verified = stats?.verified || 0 
    const high = stats?.highRisk || 0
    const medium = stats?.mediumRisk || 0 
    const low = stats?.lowRisk || 0       

    // BARIS 1: Status & Kategori (Paling Penting)
    const row1 = [
      {
        icon: ClipboardCheck,
        value: `${verified} / ${total}`, 
        label: "Laporan Terverifikasi",
        color: "bg-blue-100 text-general-20",
      },
      {
        icon: Tag,
        value: topCategoryLabel,
        label: "Kategori Terbanyak",
        color: "bg-purple-600 text-general-20",
      }
    ]

    // BARIS 2: Detail Risiko (Breakdown)
    const row2 = [
      {
        icon: AlertTriangle,
        value: high.toLocaleString(),
        label: "Risiko Tinggi",
        color: "bg-red-100 text-general-20",
      },
      {
        icon: AlertCircle,
        value: medium.toLocaleString(),
        label: "Risiko Sedang",
        color: "bg-orange-500 text-general-20",
      },
      {
        icon: Info,
        value: low.toLocaleString(),
        label: "Risiko Rendah",
        color: "bg-green-100 text-general-20",
      }
    ]

    return { row1Data: row1, row2Data: row2 }
  }, [stats])

  // Helper function untuk merender kartu agar kodenya tidak berulang
  const renderCard = (item: any, index: number) => (
    <div 
      key={index} 
      className="bg-general-20 rounded-lg p-5 shadow-sm border border-general-30 hover:border-blue-30 transition-colors h-full flex items-center"
    >
      <div className="flex items-center gap-4 w-full">
        <div className={`p-3 rounded-lg shadow-sm shrink-0 ${item.color}`}>
          <item.icon className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <p className="body-md font-bold font-heading text-general-100 leading-tight truncate">
            {item.value}
          </p>
          <p className="text-sm font-medium text-general-80 body-sm mt-0.5 truncate">
            {item.label}
          </p>
          <p className="text-[10px] text-general-50 truncate">
            {item.desc}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 mb-8">
      
      {/* BARIS PERTAMA: 2 Kolom (Verifikasi & Kategori) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {row1Data.map(renderCard)}
      </div>

      {/* BARIS KEDUA: 3 Kolom (Risiko Tinggi, Sedang, Rendah) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {row2Data.map(renderCard)}
      </div>

    </div>
  )
}

export const DataSummaryCards = memo(DataSummaryCardsComponent)