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
  Loader2
} from "lucide-react"
import { useState, useEffect, useCallback, memo } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import { locationsService } from "@/services/locations"
import { categoriesService } from "@/services/categories"

export const Route = createFileRoute("/dashboard/laporan/")({
  component: LaporanPage,
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
  pending: { label: "Menunggu Verifikasi", variant: "orange" },
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
  districtId: string
  category: string
  status: string 
  riskLevel: string
}

function LaporanPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    startDate: "",
    endDate: "",
    provinceId: "",
    cityId: "",
    districtId: "",
    category: "",
    status: "",
    riskLevel: ""
  })

  const getStatusStyle = (status: string) => {
    const statusInfo = STATUS_LABELS[status] || { label: status, variant: "gray" }
    const variantStyles: Record<string, string> = {
      orange: "bg-orange-50 text-orange-700 border-orange-200",
      green: "bg-green-20 text-green-100 border-green-30",
      red: "bg-red-20 text-red-100 border-red-30",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      blue: "bg-blue-20 text-blue-100 border-blue-30",
      gray: "bg-general-30 text-general-70 border-general-40",
    }
    return { label: statusInfo.label, className: variantStyles[statusInfo.variant] || variantStyles.gray }
  }

  // UPDATED: Mengubah style text biasa menjadi style background/border seperti Status
  const getRiskStyle = (level: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-20 text-red-100 border-red-30",      // Merah untuk Tinggi
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200", // Kuning untuk Sedang
      low: "bg-green-20 text-green-100 border-green-30", // Hijau untuk Rendah
    }
    return styles[level] || "bg-general-30 text-general-70 border-general-40"
  }

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["admin", "reports", "all", activeFilters, currentPage, itemsPerPage],
    queryFn: async () => {
      const result = await adminService.getReports({
        page: currentPage,
        limit: itemsPerPage,
        category: activeFilters.category as any || undefined,
        provinceId: activeFilters.provinceId || undefined,
        cityId: activeFilters.cityId || undefined,
        districtId: activeFilters.districtId || undefined,
        startDate: activeFilters.startDate || undefined,
        endDate: activeFilters.endDate || undefined,
        status: (activeFilters.status as any) || undefined,
        credibilityLevel: activeFilters.riskLevel || undefined
      })
      return result
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

    pages.push(<button key={1} onClick={() => setCurrentPage(1)} className={`${baseClass} ${currentPage === 1 ? activeClass : inactiveClass}`}>1</button>)
    if (currentPage > 3) pages.push(<span key="dots-start" className="px-1 text-general-60">...</span>)
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)
    for (let i = startPage; i <= endPage; i++) {
        pages.push(<button key={i} onClick={() => setCurrentPage(i)} className={`${baseClass} ${currentPage === i ? activeClass : inactiveClass}`}>{i}</button>)
    }
    if (currentPage < totalPages - 2) pages.push(<span key="dots-end" className="px-1 text-general-60">...</span>)
    if (totalPages > 1) {
      pages.push(<button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`${baseClass} ${currentPage === totalPages ? activeClass : inactiveClass}`}>{totalPages}</button>)
    }
    return pages
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    })
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="h4 text-general-100">Daftar Laporan</h1>
        </div>

        <DataFilters onFilter={(newFilters) => setActiveFilters(newFilters)} />

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
                  <th className="p-4 w-40 text-center border-r border-general-30">Status</th>
                  <th className="p-4 w-32 text-center border-r border-general-30">Tingkat Masalah</th>
                  <th className="p-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((item: any, idx) => {
                    const statusStyle = getStatusStyle(item.status)
                    const riskData = item.credibilityLevel || item.credibility_level;
                    const riskLabel = riskData ? (CREDIBILITY_LABELS[riskData] || riskData) : null;
                    const riskClassName = getRiskStyle(riskData); // Ambil class style baru

                    return (
                    <tr key={item.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors">
                      <td className="p-4 text-center text-general-100 body-sm border-r border-general-30 align-top">{indexOfFirstItem + idx + 1}</td>
                      <td className="p-4 text-center text-general-100 body-sm border-r border-general-30 align-top">{formatDate(item.createdAt)}</td>
                      
                      <td className="p-4 border-r border-general-30 align-top">
                        <div className="flex flex-col gap-0.5 body-sm">
                          <span className="font-bold text-general-100">
                            {item.district || "Kec. Tidak Diketahui"}
                          </span>
                          <span className="text-general-80 text-xs">
                            {item.city || "Kota Tidak Diketahui"}
                          </span>
                          <span className="text-general-60 text-xs">
                            {item.province || "Provinsi Tidak Diketahui"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-general-100 body-sm border-r border-general-30 align-top">{CATEGORY_LABELS[item.category] || item.category}</td>
                      
                      {/* Kolom Status (Tampilan Pill) */}
                      <td className="p-4 text-center border-r border-general-30 align-top">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      
                      {/* Kolom Tingkat Masalah (UPDATED: Menggunakan Tampilan Pill yang sama dengan Status) */}
                      <td className="p-4 text-center border-r border-general-30 align-top">
                        {riskLabel ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${riskClassName}`}>
                            {riskLabel}
                          </span>
                        ) : (
                          <span className="text-general-60">-</span>
                        )}
                      </td>

                      <td className="p-4 text-center align-top">
                        <Link 
                          to="/dashboard/laporan/$id" 
                          params={{ id: item.id }}
                          className="
                            text-blue-100 
                            font-bold 
                            underline underline-offset-4 decoration-blue-100/30
                            hover:text-blue-80 hover:decoration-blue-80 hover:decoration-2 hover:underline-offset-2
                            transition-all duration-200 
                            body-sm
                          "
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

// --- FILTER COMPONENT ---
const DataFiltersComponent = ({ onFilter }: { onFilter: (f: FilterValues) => void }) => {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [riskLevel, setRiskLevel] = useState("")
  const [error, setError] = useState("")

  const today = new Date().toISOString().split("T")[0]
  const minDate = "2024-01-01"

  const getSafeArray = (data: any) => {
    if (Array.isArray(data)) return data
    if (data && Array.isArray(data.data)) return data.data
    return []
  }

  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: async () => {
      const response = await locationsService.getProvinces()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["locations", "cities", province],
    queryFn: async () => {
      if (!province) return []
      const response = await locationsService.getCities(province)
      return response.data
    },
    enabled: !!province,
    staleTime: 1000 * 60 * 60,
  })

  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["locations", "districts", city],
    queryFn: async () => {
      if (!city) return []
      const response = await locationsService.getDistricts(city)
      return response.data
    },
    enabled: !!city,
    staleTime: 1000 * 60 * 60,
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesService.getCategories()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  const provinces = getSafeArray(provincesData)
  const cities = getSafeArray(citiesData)
  const districts = getSafeArray(districtsData)
  const categories = getSafeArray(categoriesData)

  const handleDateInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
      const val = e.target.value
      if (val) {
        const year = val.split("-")[0]
        if (year.length > 4) return
      }
      setter(val)
      setError("")
    },
    []
  )

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setStartDate), [handleDateInput])
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setEndDate), [handleDateInput])

  const handleProvinceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvince(e.target.value)
    setCity("")
    setDistrict("")
  }, [])

  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value)
    setDistrict("")
  }, [])

  const handleDistrictChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setDistrict(e.target.value), [])
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value), [])
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value), [])
  const handleRiskChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setRiskLevel(e.target.value), [])

  const handleSearch = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.")
      return
    }
    if ((startDate && startDate > today) || (endDate && endDate > today)) {
      setError("Tanggal tidak boleh melebihi hari ini.")
      return
    }
    setError("")
    onFilter({ 
      startDate, endDate, 
      provinceId: province, 
      cityId: city, 
      districtId: district, 
      category, 
      status, 
      riskLevel 
    })
  }, [startDate, endDate, province, city, district, category, status, riskLevel, today, onFilter])

  const isDateError = error !== ""
  const inputClass = `w-full px-3 py-2 bg-general-20 border rounded-lg focus:outline-none focus:ring-2 body-sm transition-all duration-200 ${isDateError ? "border-red-100 focus:ring-red-50 text-red-100" : "border-general-30 focus:border-blue-100 focus:ring-blue-100/20 text-general-100"}`
  const labelClass = "block body-sm font-medium text-general-80 mb-1.5"

  return (
    <div className="bg-general-20 rounded-lg p-4 md:p-6 shadow-md border border-general-30 mb-6">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="h5 text-general-100">Filter Laporan</h2>
        {error && (
            <div className="flex items-center gap-2 text-red-100 text-xs bg-red-20 px-3 py-1 rounded-full animate-pulse border border-red-100/20">
                <AlertCircle className="w-3 h-3" />
                {error}
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-6">
          <label className={labelClass}>Mulai</label>
          <input type="date" value={startDate} min={minDate} max={today} onChange={handleStartDateChange} className={inputClass} />
        </div>
        <div className="md:col-span-6">
          <label className={labelClass}>Akhir</label>
          <input type="date" value={endDate} min={startDate || minDate} max={today} onChange={handleEndDateChange} className={inputClass} />
        </div>

        <div className="md:col-span-4">
          <label className={labelClass}>Provinsi</label>
          <div className="relative">
            <select value={province} onChange={handleProvinceChange} disabled={provincesLoading} className={`${inputClass} appearance-none cursor-pointer truncate pr-8`}>
              <option value="">{provincesLoading ? "Memuat..." : "Semua Provinsi"}</option>
              {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>
        
        <div className="md:col-span-4">
          <label className={labelClass}>Kota/Kab</label>
          <div className="relative">
            <select value={city} onChange={handleCityChange} disabled={!province || citiesLoading} className={`${inputClass} appearance-none cursor-pointer truncate pr-8 disabled:bg-general-30/30`}>
              <option value="">{citiesLoading ? "Memuat..." : "Semua Kota/Kab"}</option>
              {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4">
          <label className={labelClass}>Kecamatan</label>
          <div className="relative">
            <select value={district} onChange={handleDistrictChange} disabled={!city || districtsLoading} className={`${inputClass} appearance-none cursor-pointer truncate pr-8 disabled:bg-general-30/30`}>
              <option value="">{districtsLoading ? "Memuat..." : "Semua Kecamatan"}</option>
              {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4">
          <label className={labelClass}>Kategori</label>
          <div className="relative">
            <select value={category} onChange={handleCategoryChange} disabled={categoriesLoading} className={`${inputClass} appearance-none cursor-pointer truncate pr-8`}>
              <option value="">{categoriesLoading ? "Memuat..." : "Semua Kategori"}</option>
              {categories.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4">
          <label className={labelClass}>Status</label>
          <div className="relative">
            <select value={status} onChange={handleStatusChange} className={`${inputClass} appearance-none cursor-pointer truncate pr-8`}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4">
          <label className={labelClass}>Tingkat Masalah</label>
          <div className="relative">
            <select value={riskLevel} onChange={handleRiskChange} className={`${inputClass} appearance-none cursor-pointer truncate pr-8`}>
              <option value="">Semua Tingkat</option>
              {Object.entries(CREDIBILITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-12 mt-2">
          <button type="button" onClick={handleSearch} className="w-full px-6 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 rounded-lg transition-all flex items-center justify-center gap-2 body-sm font-heading font-medium shadow-sm hover:shadow active:scale-[0.98]">
            <Search className="w-4 h-4" /> Cari Data
          </button>
        </div>

      </div>
    </div>
  )
}

const DataFilters = memo(DataFiltersComponent)