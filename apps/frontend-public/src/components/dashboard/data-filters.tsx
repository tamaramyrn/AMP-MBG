import { useState, useCallback, memo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, AlertCircle, RotateCcw } from "lucide-react"
import { locationsService } from "@/services/locations"
import { categoriesService } from "@/services/categories"
import { CustomSelect } from "@/components/ui/custom-select"

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
  
  const handleProvinceChange = useCallback((val: string) => { setProvince(val); setCity(""); setDistrict("") }, [])
  const handleCityChange = useCallback((val: string) => { setCity(val); setDistrict("") }, [])
  const handleDistrictChange = useCallback((val: string) => setDistrict(val), [])
  const handleCategoryChange = useCallback((val: string) => setCategory(val), [])
  const handleStatusChange = useCallback((val: string) => setStatus(val), [])

  const handleSearch = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak valid.")
      return
    }
    setError("")
    onFilter({ startDate, endDate, province, city, district, category, status })
  }, [startDate, endDate, province, city, district, category, status, onFilter])

  const handleReset = useCallback(() => {
    setStartDate("")
    setEndDate("")
    setProvince("")
    setCity("")
    setDistrict("")
    setCategory("")
    setStatus("")
    setError("")
    onFilter({ 
      startDate: "", 
      endDate: "", 
      province: "", 
      city: "", 
      district: "", 
      category: "", 
      status: "" 
    })
  }, [onFilter])

  const isDateError = error !== ""

  // Fixed date input height
  const dateInputClass =`w-full h-[42px] px-3 py-2 bg-white border rounded-lg focus:ring-2 text-sm transition-colors truncate appearance-none disabled:bg-general-20 disabled:text-general-60 disabled:cursor-not-allowed ${
    isDateError ? "border-red-100 focus:border-red-100 focus:ring-red-100 text-red-100" : "border-general-30 focus:border-blue-100 focus:ring-blue-100 text-general-100"
  }`
  
  const labelClass = "block text-xs md:text-sm font-medium text-general-80 mb-1.5"

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-blue-30/30 mb-8 overflow-visible relative z-10">
      
      <div className="p-6 md:p-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <h2 className="text-lg font-bold text-blue-100">Filter Laporan</h2>
          {error && (
            <div className="flex items-center gap-2 text-red-100 text-xs bg-red-20 px-3 py-2 rounded-lg animate-pulse border border-red-100/20 w-full sm:w-auto">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          
          <div className="lg:col-span-6 relative z-0">
            <label htmlFor="startDate" className={labelClass}>Tanggal Mulai</label>
            <input type="date" id="startDate" value={startDate} min={minDate} max={today} onChange={handleStartDateChange} className={dateInputClass} />
          </div>
          <div className="lg:col-span-6 relative z-0">
            <label htmlFor="endDate" className={labelClass}>Tanggal Akhir</label>
            <input type="date" id="endDate" value={endDate} min={startDate || minDate} max={today} onChange={handleEndDateChange} className={dateInputClass} />
          </div>

          <div className="lg:col-span-4 relative z-50">
            <CustomSelect
              label="Provinsi"
              value={province}
              options={provinces}
              onChange={handleProvinceChange}
              loading={provincesLoading}
              placeholder="Semua Provinsi"
              size="sm"
            />
          </div>

          <div className="lg:col-span-4 relative z-40">
            <CustomSelect
              label="Kabupaten/Kota"
              value={city}
              options={cities}
              onChange={handleCityChange}
              loading={citiesLoading}
              disabled={!province}
              placeholder={!province ? "Pilih Provinsi Dulu" : "Semua Kota/Kab"}
              size="sm"
            />
          </div>

          <div className="lg:col-span-4 relative z-30">
            <CustomSelect
              label="Kecamatan"
              value={district}
              options={districts}
              onChange={handleDistrictChange}
              loading={districtsLoading}
              disabled={!city}
              placeholder={!city ? "Pilih Kota Dulu" : "Semua Kecamatan"}
              size="sm"
            />
          </div>

          <div className="lg:col-span-4 relative z-20">
            <CustomSelect
              label="Kategori"
              value={category}
              options={categories}
              onChange={handleCategoryChange}
              loading={categoriesLoading}
              placeholder="Semua Kategori"
              size="sm"
            />
          </div>

          <div className="lg:col-span-4 relative z-10">
            <CustomSelect
              label="Status Laporan"
              value={status}
              options={REPORT_STATUSES}
              onChange={handleStatusChange}
              placeholder="Semua Status"
              size="sm"
            />
          </div>

          {/* Action buttons */}
          <div className="lg:col-span-4 sm:col-span-2 lg:col-start-auto relative z-0 flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2.5 bg-general-20 hover:bg-general-30 text-general-80 font-bold rounded-lg transition-all shadow-sm flex items-center justify-center h-[42px] border border-general-30"
              title="Reset Filter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="flex-1 px-4 py-2.5 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm h-[42px]"
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