import { createFileRoute } from "@tanstack/react-router"
import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { DataSummaryCards } from "@/components/dashboard/data-summary-cards"
import { DataFilters, type FilterValues } from "@/components/dashboard/data-filters"
import { DataTable, type ReportRow } from "@/components/dashboard/data-table"
import { reportsService, type ReportsQuery, type ReportCategory } from "@/services/reports"

export const Route = createFileRoute("/data-laporan/")({
  component: DataLaporanPage,
})

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  verified: "Terverifikasi",
  in_progress: "Diproses",
  resolved: "Selesai",
  rejected: "Ditolak",
}

const INITIAL_FILTERS: FilterValues = {
  startDate: "",
  endDate: "",
  province: "",
  category: "",
}

function DataLaporanPage() {
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS)

  const query = useMemo<ReportsQuery>(() => ({
    limit: 50,
    ...(filters.category && { category: filters.category as ReportCategory }),
    ...(filters.province && { provinceId: filters.province }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
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
      status: STATUS_LABELS[report.status] || report.status,
      description: report.description.length > 100 
        ? report.description.substring(0, 100) + "..." 
        : report.description,
    }))
  }, [reportsData])

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 md:mb-12">
            <h1 className="h3 text-general-100 mb-4">Data dan Statistik Laporan MBG</h1>
            <p className="body-md text-general-70">Pantau perkembangan laporan masyarakat secara transparan</p>
          </div>
          <DataSummaryCards />
          <DataFilters onFilter={handleFilterChange} />
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
            </div>
          ) : (
            <>
              <DataTable data={tableData} />
              {tableData.length === 0 && (
                <div className="text-center py-12 bg-general-20 border border-general-30 border-dashed rounded-lg mt-4">
                  <p className="text-general-60 body-md font-medium">Tidak ada laporan yang sesuai dengan filter Anda.</p>
                  <p className="text-general-50 text-sm mt-1">Coba atur ulang tanggal atau kategori pencarian.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
