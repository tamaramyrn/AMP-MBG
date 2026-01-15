import { createFileRoute, Link } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-anggota-layout"
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import { locationsService } from "@/services/locations"
import { categoriesService } from "@/services/categories"

export const Route = createFileRoute("/dashboard/laporan-lama/")({
  component: LaporanLamaPage,
})

const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan dan Masalah Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas dan Keamanan Dapur",
  policy: "Kebijakan dan Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial dan Ekonomi",
}

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  verified: { label: "Terverifikasi", variant: "green" },
  in_progress: { label: "Sedang Ditindaklanjuti", variant: "yellow" },
  resolved: { label: "Selesai", variant: "blue" },
  rejected: { label: "Ditolak", variant: "red" },
}

const CREDIBILITY_LABELS: Record<string, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
}

interface FilterValues {
  startDate: string
  endDate: string
  provinceId: string
  cityId: string
  category: string
}

function LaporanLamaPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    startDate: "",
    endDate: "",
    provinceId: "",
    cityId: "",
    category: ""
  })

  // Fetch verified/resolved/rejected reports (not pending)
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["admin", "reports", "old", activeFilters, currentPage, itemsPerPage],
    queryFn: async () => {
      // Fetch all non-pending reports
      const result = await adminService.getReports({
        page: currentPage,
        limit: itemsPerPage,
        category: activeFilters.category as any || undefined,
        provinceId: activeFilters.provinceId || undefined,
        cityId: activeFilters.cityId || undefined,
        startDate: activeFilters.startDate || undefined,
        endDate: activeFilters.endDate || undefined,
      })
      // Filter out pending reports on client side
      return {
        ...result,
        data: result.data.filter(r => r.status !== "pending"),
        pagination: result.pagination
      }
    },
  })

  const reports = reportsData?.data || []
  const pagination = reportsData?.pagination

  useEffect(() => { setCurrentPage(1) }, [activeFilters])

  const totalPages = pagination?.totalPages || 1
  const indexOfFirstItem = ((pagination?.page || 1) - 1) * itemsPerPage
  const indexOfLastItem = indexOfFirstItem + (reports.length || 0)

  const goToFirst = () => setCurrentPage(1)
  const goToLast = () => setCurrentPage(totalPages)
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))

  const renderPageNumbers = () => {
    const pages = []
    const baseClass = "w-8 h-8 flex items-center justify-center rounded transition-colors body-sm font-medium"
    const activeClass = "bg-blue-100 text-general-20 font-bold shadow-sm"
    const inactiveClass = "hover:bg-general-30 text-general-80"

    pages.push(
      <button key={1} onClick={() => setCurrentPage(1)} className={`${baseClass} ${currentPage === 1 ? activeClass : inactiveClass}`}>1</button>
    )
    if (currentPage > 3) pages.push(<span key="dots-start" className="px-1 text-general-60">...</span>)
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)
    for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button key={i} onClick={() => setCurrentPage(i)} className={`${baseClass} ${currentPage === i ? activeClass : inactiveClass}`}>{i}</button>
        )
    }
    if (currentPage < totalPages - 2) pages.push(<span key="dots-end" className="px-1 text-general-60">...</span>)
    if (totalPages > 1) {
      pages.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`${baseClass} ${currentPage === totalPages ? activeClass : inactiveClass}`}>{totalPages}</button>
      )
    }
    return pages
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const getStatusStyle = (status: string) => {
    const statusInfo = STATUS_LABELS[status] || { label: status, variant: "gray" }
    const variantStyles: Record<string, string> = {
      green: "bg-green-20 text-green-100 border-green-30",
      red: "bg-red-20 text-red-100 border-red-30",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      blue: "bg-blue-20 text-blue-100 border-blue-30",
      gray: "bg-general-30 text-general-70 border-general-40",
    }
    return { label: statusInfo.label, className: variantStyles[statusInfo.variant] || variantStyles.gray }
  }

  const getRiskStyle = (level: string) => {
    const styles: Record<string, string> = {
      high: "text-red-100 font-semibold",
      medium: "text-yellow-600 font-medium",
      low: "text-green-100 font-medium",
    }
    return styles[level] || "text-general-70"
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="h4 text-general-100">Laporan Lama</h1>
        </div>

        <FilterSection onFilter={(newFilters) => setActiveFilters(newFilters)} />

        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-general-20 border-b border-general-30 text-general-100 body-sm font-heading font-semibold">
                  <th className="p-4 w-12 text-center border-r border-general-30">No</th>
                  <th className="p-4 w-28 text-center border-r border-general-30">Tanggal</th>
                  <th className="p-4 border-r border-general-30 min-w-[200px]">Lokasi</th>
                  <th className="p-4 border-r border-general-30">Kategori</th>
                  <th className="p-4 w-36 text-center border-r border-general-30">Status</th>
                  <th className="p-4 w-28 text-center border-r border-general-30">Risiko</th>
                  <th className="p-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((item, idx) => {
                    const statusStyle = getStatusStyle(item.status)
                    return (
                    <tr key={item.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors">
                      <td className="p-4 text-center text-general-100 body-sm border-r border-general-30">{indexOfFirstItem + idx + 1}</td>
                      <td className="p-4 text-center text-general-100 body-sm border-r border-general-30">{formatDate(item.createdAt)}</td>
                      <td className="p-4 text-general-100 body-sm border-r border-general-30">
                        <span className="font-medium text-blue-100">{item.district || item.city}</span>, {item.city}, <span className="text-general-60">{item.province}</span>
                      </td>
                      <td className="p-4 text-general-100 body-sm border-r border-general-30">{CATEGORY_LABELS[item.category] || item.category}</td>
                      <td className="p-4 text-center border-r border-general-30">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className={`p-4 text-center border-r border-general-30 body-sm ${getRiskStyle(item.credibilityLevel)}`}>
                        {CREDIBILITY_LABELS[item.credibilityLevel] || item.credibilityLevel}
                      </td>
                      <td className="p-4 text-center">
                        <Link 
                          to="/dashboard/laporan-lama/$id" 
                          params={{ id: item.id }}
                          className="text-blue-100 hover:text-blue-90 hover:underline body-sm font-medium transition-colors"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-general-60 body-sm">Tidak ada data yang sesuai dengan filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
          
          {(pagination?.total || 0) > 0 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-general-30 text-general-60 body-sm">
              <span className="text-xs sm:text-sm">Menampilkan <span className="font-medium text-general-100">{indexOfFirstItem + 1}-{indexOfLastItem}</span> dari {pagination?.total || 0} data</span>
              <div className="flex items-center gap-1">
                <button onClick={goToFirst} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"><ChevronsLeft className="w-4 h-4" /></button>
                <button onClick={goToPrev} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"><ChevronLeft className="w-4 h-4" /></button>
                <div className="flex gap-1 mx-2">{renderPageNumbers()}</div>
                <button onClick={goToNext} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={goToLast} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"><ChevronsRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardAnggotaLayout>
  )
}

interface FilterSectionProps {
  onFilter: (filters: FilterValues) => void
}

function FilterSection({ onFilter }: FilterSectionProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>({
    startDate: "",
    endDate: "",
    provinceId: "",
    cityId: "",
    category: ""
  })
  const [error, setError] = useState("")

  const today = new Date().toISOString().split("T")[0]
  const minDate = "2024-01-01"

  // Fetch provinces from API
  const { data: provincesData } = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: () => locationsService.getProvinces(),
  })

  // Fetch cities based on selected province
  const { data: citiesData } = useQuery({
    queryKey: ["locations", "cities", localFilters.provinceId],
    queryFn: () => locationsService.getCities(localFilters.provinceId),
    enabled: !!localFilters.provinceId,
  })

  // Fetch categories from API
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.getCategories(),
  })

  const provinces = provincesData?.data || []
  const cities = citiesData?.data || []
  const categories = categoriesData?.data || []

  const handleChange = (key: keyof FilterValues, value: string) => {
    setLocalFilters(prev => {
        if (key === 'provinceId') return { ...prev, [key]: value, cityId: "" }
        return { ...prev, [key]: value }
    })
  }

  const handleDateInput = (key: 'startDate' | 'endDate', val: string) => {
    if (val) {
      const year = val.split("-")[0]
      if (year.length > 4) return 
    }
    setLocalFilters(prev => ({ ...prev, [key]: val }))
    if (error) setError("") 
  }

  const handleSearch = () => {
    if (localFilters.startDate && localFilters.endDate && localFilters.startDate > localFilters.endDate) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.")
      return
    }
    if ((localFilters.startDate && localFilters.startDate > today) || (localFilters.endDate && localFilters.endDate > today)) {
        setError("Tanggal tidak boleh melebihi hari ini.")
        return
    }

    setError("")
    onFilter(localFilters)
  }

  const handleReset = () => {
      const empty: FilterValues = { startDate: "", endDate: "", provinceId: "", cityId: "", category: "" }
      setLocalFilters(empty)
      setError("")
      onFilter(empty)
  }

  const isDateError = error !== ""

  const inputClass = `w-full px-3 py-2 bg-general-20 border rounded-lg focus:outline-none focus:ring-2 body-sm transition-all duration-200
    ${isDateError 
      ? "border-red-100 focus:ring-red-50 text-red-100" 
      : "border-general-30 focus:border-blue-100 focus:ring-blue-100/20 text-general-100"}`

  const labelClass = "block body-sm font-medium text-general-80 mb-1.5"

  return (
    <div className="bg-general-20 rounded-xl p-4 md:p-6 shadow-sm border border-general-30 mb-6">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
        <h2 className="h5 text-general-100">Filter Laporan</h2>
        <div className="flex gap-4 items-center flex-wrap">
            {error && (
                <div className="flex items-center gap-2 text-red-100 text-xs bg-red-20 px-3 py-1.5 rounded-full border border-red-30 font-medium animate-in fade-in slide-in-from-right-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </div>
            )}
            {Object.values(localFilters).some(v => v !== "") && (
                 <button onClick={handleReset} className="flex items-center gap-1 text-red-100 hover:text-red-90 text-xs font-medium transition-colors ml-auto sm:ml-0">
                    <XCircle className="w-3.5 h-3.5" /> Reset Filter
                 </button>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div>
          <label className={labelClass}>Mulai</label>
          <input
            type="date"
            value={localFilters.startDate}
            min={minDate}
            max={today}
            onChange={(e) => handleDateInput('startDate', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Akhir</label>
          <input
            type="date"
            value={localFilters.endDate}
            min={localFilters.startDate || minDate}
            max={today}
            onChange={(e) => handleDateInput('endDate', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Provinsi</label>
          <div className="relative">
            <select
              value={localFilters.provinceId}
              onChange={(e) => handleChange('provinceId', e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer truncate pr-8`}
            >
              <option value="">Semua</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Kota/Kab</label>
          <div className="relative">
            <select
              value={localFilters.cityId}
              onChange={(e) => handleChange('cityId', e.target.value)}
              disabled={!localFilters.provinceId}
              className={`${inputClass} appearance-none cursor-pointer truncate pr-8 disabled:bg-general-30/30 disabled:text-general-50 disabled:cursor-not-allowed`}
            >
              <option value="">Semua</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Kategori</label>
          <div className="relative">
            <select
              value={localFilters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer truncate pr-8`}
            >
              <option value="">Semua</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-end mt-2">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 rounded-lg transition-all flex items-center justify-center gap-2 body-sm font-heading font-medium shadow-sm hover:shadow active:scale-[0.98]"
          >
            <Search className="w-4 h-4" />
            Cari Data
          </button>
        </div>
      </div>
    </div>
  )
}
