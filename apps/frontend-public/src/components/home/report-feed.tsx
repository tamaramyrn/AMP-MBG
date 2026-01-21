import { useMemo, memo } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ReportCard, type ReportData } from "@/components/ui/report-card"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { reportsService } from "@/services/reports"
import { CATEGORY_LABELS, CATEGORY_VARIANTS, RELATION_LABELS } from "@/hooks/use-categories"

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" }

function ReportFeedComponent() {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => reportsService.getRecent(),
    staleTime: 30000,
  })

  const reports: ReportData[] = useMemo(() => {
    if (!reportsData?.data) return []
    
    return reportsData.data
      .slice(0, 3)
      .map((r) => ({
        id: r.id,
        category: CATEGORY_LABELS[r.category] || r.category,
        categoryVariant: CATEGORY_VARIANTS[r.category] || "info",
        title: r.title,
        location: r.location,
        date: new Date(r.incidentDate).toLocaleDateString("id-ID", DATE_FORMAT_OPTIONS),
        reporter: RELATION_LABELS[r.relation] || "Pelapor",
      }))
  }, [reportsData])

  return (
    <section className="py-12 md:py-20 bg-white">
      
      {/* CONTAINER UTAMA */}
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-general-100 mb-2">
              Laporan Terkini
            </h2>
            <p className="text-general-70 body-sm md:body-md">
              Pantau laporan yang baru saja masuk dan terverifikasi dari berbagai wilayah.
            </p>
          </div>
          
          <Link
            to="/data-laporan"
            className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-orange-100 text-white font-semibold rounded-lg hover:bg-orange-90 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Lihat Semua Laporan
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* --- REPORT CARDS GRID --- */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-general-20/50 rounded-xl border border-dashed border-general-30">
            <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
          </div>
        ) : reports.length > 0 ? (
        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {reports.map((report) => (
              <div key={report.id} className="h-full flex flex-col">
                 <div className="flex-1 h-full [&>*]:h-full">
                    <ReportCard report={report} />
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-general-20 rounded-xl text-center border border-general-30/50">
            <div className="w-12 h-12 bg-general-30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-general-60" />
            </div>
            <p className="text-general-80 font-medium">Belum ada laporan masuk saat ini.</p>
          </div>
        )}

        {/* Mobile Button */}
        <div className="mt-8 md:hidden">
          <Link
            to="/data-laporan"
            className="flex items-center justify-center w-full px-6 py-3 bg-orange-100 text-white font-bold rounded-lg hover:bg-orange-90 transition-colors shadow-sm"
          >
            Lihat Semua Laporan
          </Link>
        </div>

      </div>
    </section>
  )
}

export const ReportFeed = memo(ReportFeedComponent)