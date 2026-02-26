import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, FileSearch } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { DataSummaryCards } from "@/components/dashboard/data-summary-cards"
import { DataFilters, type FilterValues } from "@/components/dashboard/data-filters"
import { DataTable, type ReportRow } from "@/components/dashboard/data-table"
import { reportsService, type ReportsQuery, type ReportCategory, type ReportStatus } from "@/services/reports"
import { useSEO } from "@/hooks/use-seo"
import { SEO } from "@/config/seo"

export const Route = createFileRoute("/data-laporan/")({
  component: DataLaporanPage,
})

const INITIAL_FILTERS: FilterValues = {
  startDate: "",
  endDate: "",
  province: "",
  city: "",
  district: "",
  category: "",
  status: "",
}

function DataLaporanPage() {
  useSEO(SEO.dataLaporan)
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS)

  const query = useMemo<ReportsQuery>(() => ({
    limit: 50,
    ...(filters.category && { category: filters.category as ReportCategory }),
    ...(filters.province && { provinceId: filters.province }),
    ...(filters.city && { cityId: filters.city }),
    ...(filters.district && { districtId: filters.district }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
    ...(filters.status && { status: filters.status as ReportStatus }),
  }), [filters])

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports", "public", query],
    queryFn: () => reportsService.getReports(query),
  })

  const tableData: ReportRow[] = useMemo(() => {
    if (!reportsData?.data) return []
    return reportsData.data.map((report) => ({
      id: report.id,
      date: report.incidentDate.split("T")[0],
      city: report.city,
      province: report.province,
      district: report.district,
      category: report.category,
      status: report.status, 
      description: report.title || (report.description.length > 50 
        ? report.description.substring(0, 50) + "..." 
        : report.description),
    }))
  }, [reportsData])

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-general-20 font-sans">
      <Navbar />
      
      <main className="flex-1 py-10 md:py-14">
        
        <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24 max-w-[2400px]">
          
          {/* Header Section */}
          <div className="mb-10 md:mb-12 relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-100/5 rounded-full blur-3xl -z-10" />
            
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-general-100 mb-3">
              Data & Statistik <span className="text-blue-100">Laporan MBG</span>
            </h1>
            
            {/* Description text */}
            <p className="body-md text-general-60 w-full leading-relaxed">
              Pantau perkembangan laporan masyarakat secara transparan, data ini diperbarui secara berkala untuk memastikan akuntabilitas program.
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Summary cards */}
            <DataSummaryCards />
            
            {/* Filter section */}
            <DataFilters onFilter={handleFilterChange} />
            
            {/* Table content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-general-30 shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin text-blue-100 mb-4" />
                <p className="body-sm text-general-60 font-medium">Memuat data laporan...</p>
              </div>
            ) : (
              <>
                <DataTable data={tableData} />
                
                {tableData.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-general-30 text-center">
                    <div className="w-16 h-16 bg-general-20 rounded-full flex items-center justify-center mb-4 text-general-40">
                      <FileSearch className="w-8 h-8" />
                    </div>
                    <h3 className="text-general-100 font-bold mb-1">Tidak ada laporan ditemukan</h3>
                    <p className="text-general-60 body-sm max-w-md mx-auto">
                      Coba sesuaikan filter tanggal, lokasi, atau kategori untuk menemukan data yang Anda cari.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}