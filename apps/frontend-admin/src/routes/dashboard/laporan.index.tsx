import { createFileRoute, Link } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  AlertCircle,
  Loader2,
  Eye,
  Check 
} from "lucide-react"
import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import type { ReportCategory, ReportStatus } from "@/services/reports"
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
  analyzing: { label: "Dalam Proses Analisis", variant: "blue" },
  needs_evidence: { label: "Butuh Bukti Tambahan", variant: "yellow" },
  invalid: { label: "Tidak Valid", variant: "red" },
  in_progress: { label: "Dalam Proses Penanganan", variant: "purple" },
  resolved: { label: "Selesai Ditangani", variant: "green" },
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
      orange: "bg-orange-20 text-orange-100 border-orange-30",
      green: "bg-green-20 text-green-100 border-green-30",
      red: "bg-red-20 text-red-100 border-red-30",
      yellow: "bg-yellow-50 text-general-80 border-yellow-100",
      blue: "bg-blue-20 text-blue-100 border-blue-30",
      purple: "bg-purple-100/10 text-purple-600 border-purple-200",
      gray: "bg-general-30 text-general-70 border-general-40",
    }
    return { label: statusInfo.label, className: variantStyles[statusInfo.variant] || variantStyles.gray }
  }

  const getRiskStyle = (level: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-20 text-red-100 border-red-30",
      medium: "bg-yellow-50 text-general-80 border-yellow-100",
      low: "bg-green-20 text-green-100 border-green-30",
    }
    return styles[level] || "bg-general-30 text-general-70 border-general-40"
  }

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["admin", "reports", "all", activeFilters, currentPage, itemsPerPage],
    queryFn: async () => {
      const result = await adminService.getReports({
        page: currentPage,
        limit: itemsPerPage,
        category: (activeFilters.category || undefined) as ReportCategory | undefined,
        provinceId: activeFilters.provinceId || undefined,
        cityId: activeFilters.cityId || undefined,
        districtId: activeFilters.districtId || undefined,
        startDate: activeFilters.startDate || undefined,
        endDate: activeFilters.endDate || undefined,
        status: (activeFilters.status || undefined) as ReportStatus | undefined,
        credibilityLevel: activeFilters.riskLevel || undefined
      })
      return result
    },
  })

  const reports = reportsData?.data || []
  const pagination = reportsData?.pagination

  const [prevFilters, setPrevFilters] = useState(activeFilters)
  if (prevFilters !== activeFilters) {
    setPrevFilters(activeFilters)
    setCurrentPage(1)
  }

  const totalPages = pagination?.totalPages || 1
  const indexOfFirstItem = ((pagination?.page || 1) - 1) * itemsPerPage
  const indexOfLastItem = indexOfFirstItem + (reports.length || 0)

  // Pagination handlers
  const goToFirst = () => setCurrentPage(1)
  const goToLast = () => setCurrentPage(totalPages)
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))
  const handlePageClick = (page: number) => setCurrentPage(page)

  // Smart pagination logic
  const paginationItems = useMemo(() => {
    // Show all if few pages
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Use gap logic
    const pages = new Set([1, 2, totalPages]);

    // Add current middle page
    if (currentPage > 2 && currentPage < totalPages) {
      pages.add(currentPage);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const finalItems: (number | string)[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      if (i > 0) {
        const prevPage = sortedPages[i - 1];
        if (page - prevPage > 1) {
          finalItems.push("...");
        }
      }
      finalItems.push(page);
    }

    return finalItems;
  }, [currentPage, totalPages]);

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

        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm relative z-0">
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
                  reports.map((item, idx) => {
                    const statusStyle = getStatusStyle(item.status)
                    const riskData = item.credibilityLevel;
                    const riskLabel = riskData ? (CREDIBILITY_LABELS[riskData] || riskData) : null;
                    const riskClassName = getRiskStyle(riskData);

                    return (
                    <tr key={item.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors">
                      <td className="p-4 text-center text-general-100 body-sm border-r border-general-30 align-middle">{indexOfFirstItem + idx + 1}</td>
                      <td className="p-4 text-center text-general-100 body-sm border-r border-general-30 align-middle">{formatDate(item.incidentDate)}</td>
                      
                      <td className="p-4 border-r border-general-30 align-middle">
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

                      <td className="p-4 text-general-100 body-sm border-r border-general-30 align-middle">{CATEGORY_LABELS[item.category] || item.category}</td>
                      
                      <td className="p-4 text-center border-r border-general-30 align-middle">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      
                      <td className="p-4 text-center border-r border-general-30 align-middle">
                        {riskLabel ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${riskClassName}`}>
                            {riskLabel}
                          </span>
                        ) : (
                          <span className="text-general-60">-</span>
                        )}
                      </td>

                      <td className="p-4 align-middle text-center">
                        <div className="flex justify-center">
                          <Link
                            to="/dashboard/laporan/$id" 
                            params={{ id: item.id }}
                            className="
                              text-blue-100 font-bold text-xs 
                              bg-blue-20 hover:bg-blue-30 
                              px-3 py-1.5 rounded-lg 
                              transition-all shadow-sm hover:shadow active:scale-95 
                              flex items-center gap-1
                            "
                          >
                            <Eye className="w-3 h-3" /> Detail
                          </Link>
                        </div>
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
          
          {/* Pagination */}
          {(pagination?.total || 0) > 0 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-general-30 text-general-60 body-sm">
              <span className="text-xs sm:text-sm text-center sm:text-left">
                Menampilkan <span className="font-medium text-general-100">{indexOfFirstItem + 1}-{indexOfLastItem}</span> dari {pagination?.total || 0} data
              </span>
              
              <div className="flex items-center gap-1">
                
                {/* First page, hidden mobile */}
                <button 
                  onClick={goToFirst} 
                  disabled={currentPage === 1} 
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Page (<) */}
                <button 
                  onClick={goToPrev} 
                  disabled={currentPage === 1} 
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1 mx-2">
                  {paginationItems.map((item, idx) => {
                    if (item === "...") {
                      return (
                        <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-general-60 font-medium">
                          ...
                        </span>
                      )
                    }
                    const pageNum = item as number
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageClick(pageNum)}
                        className={`
                          w-8 h-8 flex items-center justify-center rounded transition-colors body-sm font-medium
                          ${currentPage === pageNum 
                            ? "bg-blue-100 text-general-20 font-bold shadow-sm" 
                            : "hover:bg-general-30 text-general-80"}
                        `}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Next Page (>) */}
                <button 
                  onClick={goToNext} 
                  disabled={currentPage === totalPages} 
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page, hidden mobile */}
                <button 
                  onClick={goToLast} 
                  disabled={currentPage === totalPages} 
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardAnggotaLayout>
  )
}

// Custom select component
interface Option {
  id?: string | number
  value?: string | number
  name?: string
  label?: string
}

interface CustomSelectProps {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

function CustomSelect({ label, value, options, onChange, disabled, loading, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedLabel = options.find(opt => String(opt.id || opt.value) === value)?.name || 
                        options.find(opt => String(opt.id || opt.value) === value)?.label || 
                        placeholder

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs md:text-sm font-medium text-general-80 mb-1.5">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-general-20 border rounded-lg text-sm font-medium 
          flex items-center justify-between transition-all duration-200
          ${isOpen ? 'border-blue-100 ring-2 ring-blue-100/20' : 'border-general-30 hover:border-blue-100'}
          ${disabled ? 'opacity-70 cursor-not-allowed' : 'text-general-100 cursor-pointer'}
        `}
      >
        <span className="truncate block mr-2 text-sm">
          {loading ? "Memuat..." : (value ? selectedLabel : placeholder)}
        </span>
        <div className="text-general-60 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-general-30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-0 right-0">
          <div className="max-h-[200px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-general-30 scrollbar-track-transparent">
            {options.length > 0 ? (
              options.map((opt) => {
                const optValue = String(opt.id || opt.value)
                const optLabel = opt.name || opt.label
                const isSelected = optValue === value

                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={() => {
                      onChange(optValue)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between
                      ${isSelected ? 'bg-blue-100/10 text-blue-100 font-bold' : 'text-general-80 hover:bg-general-20'}
                    `}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-xs text-general-50 text-center italic">
                Tidak ada data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Filter component
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

  const getSafeArray = (data: unknown) => {
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as Record<string, unknown>).data)) return (data as Record<string, unknown>).data as unknown[]
    return []
  }

  // Data queries
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: async () => (await locationsService.getProvinces()).data,
    staleTime: 1000 * 60 * 60,
  })

  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["locations", "cities", province],
    queryFn: async () => province ? (await locationsService.getCities(province)).data : [],
    enabled: !!province,
    staleTime: 1000 * 60 * 60,
  })

  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["locations", "districts", city],
    queryFn: async () => city ? (await locationsService.getDistricts(city)).data : [],
    enabled: !!city,
    staleTime: 1000 * 60 * 60,
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesService.getCategories()).data,
    staleTime: 1000 * 60 * 60,
  })

  const provinces = getSafeArray(provincesData)
  const cities = getSafeArray(citiesData)
  const districts = getSafeArray(districtsData)
  const categories = getSafeArray(categoriesData)

  // Status and risk options
  const statusOptions = Object.entries(STATUS_LABELS).map(([key, { label }]) => ({ value: key, label }))
  const riskOptions = Object.entries(CREDIBILITY_LABELS).map(([key, label]) => ({ value: key, label }))

  // Event handlers
  const handleDateInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value
    if (val && val.split("-")[0].length > 4) return
    setter(val)
    setError("")
  }, [])

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setStartDate), [handleDateInput])
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setEndDate), [handleDateInput])

  // Select change handlers
  const handleProvinceChange = useCallback((val: string) => { setProvince(val); setCity(""); setDistrict("") }, [])
  const handleCityChange = useCallback((val: string) => { setCity(val); setDistrict("") }, [])
  const handleDistrictChange = useCallback((val: string) => setDistrict(val), [])
  const handleCategoryChange = useCallback((val: string) => setCategory(val), [])
  const handleStatusChange = useCallback((val: string) => setStatus(val), [])
  const handleRiskChange = useCallback((val: string) => setRiskLevel(val), [])

  const handleSearch = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak valid.")
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
  }, [startDate, endDate, province, city, district, category, status, riskLevel, onFilter])

  const isDateError = error !== ""
  const dateInputClass = `w-full px-3 py-2 bg-general-20 border rounded-lg focus:outline-none focus:ring-2 body-sm transition-all duration-200 ${isDateError ? "border-red-100 focus:ring-red-50 text-red-100" : "border-general-30 focus:border-blue-100 focus:ring-blue-100/20 text-general-100"}`
  const labelClass = "block body-sm font-medium text-general-80 mb-1.5"

  return (
    <div className="bg-general-20 rounded-lg p-4 md:p-6 shadow-md border border-general-30 mb-6 relative z-10 overflow-visible">
      
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
        <div className="md:col-span-6 relative z-0">
          <label className={labelClass}>Mulai</label>
          <input type="date" value={startDate} min={minDate} max={today} onChange={handleStartDateChange} className={dateInputClass} />
        </div>
        <div className="md:col-span-6 relative z-0">
          <label className={labelClass}>Akhir</label>
          <input type="date" value={endDate} min={startDate || minDate} max={today} onChange={handleEndDateChange} className={dateInputClass} />
        </div>

        {/* Location */}
        <div className="md:col-span-4 relative z-50">
          <CustomSelect 
            label="Provinsi" 
            value={province} 
            options={provinces} 
            onChange={handleProvinceChange} 
            loading={provincesLoading} 
            placeholder="Semua Provinsi" 
          />
        </div>
        
        <div className="md:col-span-4 relative z-40">
          <CustomSelect 
            label="Kota/Kab" 
            value={city} 
            options={cities} 
            onChange={handleCityChange} 
            loading={citiesLoading} 
            disabled={!province}
            placeholder={!province ? "Pilih Provinsi" : "Semua Kota/Kab"} 
          />
        </div>

        <div className="md:col-span-4 relative z-30">
          <CustomSelect 
            label="Kecamatan" 
            value={district} 
            options={districts} 
            onChange={handleDistrictChange} 
            loading={districtsLoading} 
            disabled={!city}
            placeholder={!city ? "Pilih Kota" : "Semua Kecamatan"} 
          />
        </div>

        <div className="md:col-span-4 relative z-20">
          <CustomSelect 
            label="Kategori" 
            value={category} 
            options={categories} 
            onChange={handleCategoryChange} 
            loading={categoriesLoading} 
            placeholder="Semua Kategori" 
          />
        </div>

        <div className="md:col-span-4 relative z-10">
          <CustomSelect 
            label="Status" 
            value={status} 
            options={statusOptions} 
            onChange={handleStatusChange} 
            placeholder="Semua Status" 
          />
        </div>

        <div className="md:col-span-4 relative z-10">
          <CustomSelect 
            label="Tingkat Masalah" 
            value={riskLevel} 
            options={riskOptions} 
            onChange={handleRiskChange} 
            placeholder="Semua Tingkat" 
          />
        </div>

        <div className="md:col-span-12 mt-2 relative z-0">
          <button type="button" onClick={handleSearch} className="w-full px-6 py-2.5 bg-orange-100 hover:bg-orange-90 text-general-20 rounded-lg transition-all flex items-center justify-center gap-2 body-sm font-heading font-medium shadow-sm hover:shadow active:scale-[0.98]">
            <Search className="w-4 h-4" /> Cari Data
          </button>
        </div>

      </div>
    </div>
  )
}

const DataFilters = memo(DataFiltersComponent)