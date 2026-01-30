import { useState, useCallback, memo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { locationsService } from "@/services/locations"
import { categoriesService } from "@/services/categories"

export interface FilterValues {
  startDate: string
  endDate: string
  province: string
  city: string
  district: string
  category: string
  status: string
}

interface DataFiltersProps {
  onFilter: (filters: FilterValues) => void
}

const REPORT_STATUSES = [
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "analyzing", label: "Dalam Proses Analisis" },
  { value: "needs_evidence", label: "Butuh Bukti Tambahan" },
  { value: "invalid", label: "Tidak Valid" },
  { value: "in_progress", label: "Dalam Proses Penanganan" },
  { value: "resolved", label: "Selesai Ditangani" },
]

function DataFiltersComponent({ onFilter }: DataFiltersProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [province, setProvince] = useState("")
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("") 
  const [error, setError] = useState("")

  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => (await locationsService.getProvinces()).data,
    staleTime: 1000 * 60 * 60,
  })

  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", province],
    queryFn: async () => province ? (await locationsService.getCities(province)).data : [],
    enabled: !!province,
    staleTime: 1000 * 60 * 60,
  })

  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts", city],
    queryFn: async () => city ? (await locationsService.getDistricts(city)).data : [],
    enabled: !!city,
    staleTime: 1000 * 60 * 60,
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesService.getCategories()).data,
    staleTime: 1000 * 60 * 60,
  })

  const provinces = provincesData || []
  const cities = citiesData || []
  const districts = districtsData || []
  const categories = categoriesData || []

  const today = new Date().toISOString().split("T")[0]
  const minDate = "2024-01-01"

  const handleDateInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value
    if (val && val.split("-")[0].length > 4) return
    setter(val)
    setError("")
  }, [])

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setStartDate), [handleDateInput])
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setEndDate), [handleDateInput])
  const handleProvinceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { setProvince(e.target.value); setCity(""); setDistrict("") }, [])
  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => { setCity(e.target.value); setDistrict("") }, [])
  const handleDistrictChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setDistrict(e.target.value), [])
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value), [])
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value), [])

  const handleSearch = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak valid.")
      return
    }
    setError("")
    onFilter({ startDate, endDate, province, city, district, category, status })
  }, [startDate, endDate, province, city, district, category, status, onFilter])

  const isDateError = error !== ""

  // Styles Updated: Focus Ring Blue
  const inputClass = `w-full px-3 py-2.5 bg-white border rounded-lg focus:ring-2 text-sm transition-colors truncate appearance-none disabled:bg-general-20 disabled:text-general-60 disabled:cursor-not-allowed ${
    isDateError ? "border-red-100 focus:border-red-100 focus:ring-red-100 text-red-100" : "border-general-30 focus:border-blue-100 focus:ring-blue-100 text-general-100"
  }`
  const labelClass = "block text-xs md:text-sm font-medium text-general-80 mb-1.5"
  const selectIconClass = "absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60"

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-blue-30/30 mb-8 overflow-hidden">
      
      {/* PADDING SAMA DENGAN KOTAK CARA KERJA (p-6 md:p-10) */}
      <div className="p-6 md:p-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          {/* Judul Biru Formal */}
          <h2 className="text-lg font-bold text-blue-100">Filter Laporan</h2>
          {error && (
            <div className="flex items-center gap-2 text-red-100 text-xs bg-red-20 px-3 py-2 rounded-lg animate-pulse border border-red-100/20 w-full sm:w-auto">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          
          <div className="lg:col-span-6">
            <label htmlFor="startDate" className={labelClass}>Tanggal Mulai</label>
            <input type="date" id="startDate" value={startDate} min={minDate} max={today} onChange={handleStartDateChange} className={inputClass} />
          </div>
          <div className="lg:col-span-6">
            <label htmlFor="endDate" className={labelClass}>Tanggal Akhir</label>
            <input type="date" id="endDate" value={endDate} min={startDate || minDate} max={today} onChange={handleEndDateChange} className={inputClass} />
          </div>

          {/* LOKASI */}
          <div className="lg:col-span-4 relative">
            <label htmlFor="province" className={labelClass}>Provinsi</label>
            <div className="relative">
              <select id="province" value={province} onChange={handleProvinceChange} disabled={provincesLoading} className={`${inputClass} pr-10`}>
                <option value="">{provincesLoading ? "Memuat..." : "Semua Provinsi"}</option>
                {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className={selectIconClass}>{provincesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}</div>
            </div>
          </div>

          <div className="lg:col-span-4 relative">
            <label htmlFor="city" className={labelClass}>Kabupaten/Kota</label>
            <div className="relative">
              <select id="city" value={city} onChange={handleCityChange} disabled={!province || citiesLoading} className={`${inputClass} pr-10`}>
                <option value="">{!province ? "Pilih Provinsi" : citiesLoading ? "Memuat..." : "Semua Kota/Kab"}</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className={selectIconClass}>{citiesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}</div>
            </div>
          </div>

          <div className="lg:col-span-4 relative">
            <label htmlFor="district" className={labelClass}>Kecamatan</label>
            <div className="relative">
              <select id="district" value={district} onChange={handleDistrictChange} disabled={!city || districtsLoading} className={`${inputClass} pr-10`}>
                <option value="">{!city ? "Pilih Kota" : districtsLoading ? "Memuat..." : "Semua Kecamatan"}</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className={selectIconClass}>{districtsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}</div>
            </div>
          </div>

          {/* META & TOMBOL */}
          <div className="lg:col-span-4 relative">
            <label htmlFor="category" className={labelClass}>Kategori</label>
            <div className="relative">
              <select id="category" value={category} onChange={handleCategoryChange} disabled={categoriesLoading} className={`${inputClass} pr-10`}>
                <option value="">{categoriesLoading ? "Memuat..." : "Semua Kategori"}</option>
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className={selectIconClass}>{categoriesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}</div>
            </div>
          </div>

          <div className="lg:col-span-4 relative">
            <label htmlFor="status" className={labelClass}>Status Laporan</label>
            <div className="relative">
              <select id="status" value={status} onChange={handleStatusChange} className={`${inputClass} pr-10`}>
                <option value="">Semua Status</option>
                {REPORT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className={selectIconClass}><ChevronDown className="w-4 h-4" /></div>
            </div>
          </div>

          <div className="lg:col-span-4 sm:col-span-2 lg:col-start-auto">
            {/* TOMBOL AKSI: ORANYE (Primary Action) */}
            <button
              type="button"
              onClick={handleSearch}
              className="w-full px-4 py-2.5 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm h-[42px]"
            >
              <Search className="w-4 h-4" />
              <span>Cari Data</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export const DataFilters = memo(DataFiltersComponent)