import { memo, useCallback, useMemo, Suspense, lazy, useState, useRef, useEffect } from "react"
import { ChevronDown, AlertCircle, Loader2, Check } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { ReportFormData, Timezone } from "./report-form"
import { categoriesService } from "@/services/categories"
import { locationsService } from "@/services/locations"
import { cn } from "@/lib/utils"

const LocationMapPreview = lazy(() =>
  import("./location-map-preview").then((m) => ({ default: m.LocationMapPreview }))
)

interface StepLocationCategoryProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

const TIMEZONES: { value: Timezone; label: string; offset: number }[] = [
  { value: "WIB", label: "WIB", offset: 7 },
  { value: "WITA", label: "WITA", offset: 8 },
  { value: "WIT", label: "WIT", offset: 9 },
]

// --- KOMPONEN CUSTOM SELECT (Diadaptasi dari DataFilters) ---
interface Option {
  id?: string | number
  value?: string | number
  name?: string
  label?: string
}

interface CustomSelectProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

function CustomSelect({ value, options, onChange, disabled, loading, placeholder }: CustomSelectProps) {
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
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-[50px] px-4 py-3 text-left bg-white border rounded-xl text-base font-normal
          flex items-center justify-between transition-all duration-200
          ${isOpen ? 'border-blue-100 ring-2 ring-blue-100/50' : 'border-general-30 focus:border-blue-100'}
          ${disabled ? 'bg-general-20 text-general-60 cursor-not-allowed' : 'text-general-100 cursor-pointer'}
        `}
      >
        <span className={`truncate block mr-2 ${!value ? 'text-general-40' : ''}`}>
          {loading ? "Memuat..." : (value ? selectedLabel : placeholder)}
        </span>
        <div className="text-general-60 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-general-30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-0 right-0">
          {/* Max height disesuaikan agar tampil 5 item */}
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
                      w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                      ${isSelected ? 'bg-blue-100/10 text-blue-100 font-bold' : 'text-general-80 hover:bg-general-20'}
                    `}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-sm text-general-50 text-center italic">
                Tidak ada data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StepLocationCategoryComponent({ formData, updateFormData }: StepLocationCategoryProps) {
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"], queryFn: async () => (await categoriesService.getCategories()).data, staleTime: 3600000,
  })
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"], queryFn: async () => (await locationsService.getProvinces()).data, staleTime: 3600000,
  })
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", formData.province], queryFn: async () => formData.province ? (await locationsService.getCities(formData.province)).data : [], enabled: !!formData.province, staleTime: 1800000,
  })
  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts", formData.city], queryFn: async () => formData.city ? (await locationsService.getDistricts(formData.city)).data : [], enabled: !!formData.city, staleTime: 1800000,
  })

  const categories = categoriesData || []
  const provinces = provincesData || []
  const availableCities = citiesData || []
  const availableDistricts = districtsData || []

  const MAX_TITLE_WORDS = 10
  const MIN_TITLE_CHARS = 10
  const MAX_LOCATION_LENGTH = 100
  const MIN_DATE = "2024-01-01"

  const currentTitleWords = useMemo(
    () => (formData.title ? formData.title.trim().split(/\s+/).filter(Boolean).length : 0),
    [formData.title]
  )
  
  const isTitleTooShort = formData.title.length > 0 && formData.title.length < MIN_TITLE_CHARS
  
  const currentLength = formData.location.length

  const { todayInTz, isDateError, isTimeError } = useMemo(() => {
    const now = new Date()
    const tz = TIMEZONES.find((t) => t.value === formData.timezone) || TIMEZONES[0]
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const tzDate = new Date(utc + tz.offset * 3600000)
    return {
      todayInTz: tzDate.toISOString().split("T")[0],
      isDateFuture: formData.date > tzDate.toISOString().split("T")[0],
      isYearInvalid: formData.date.split("-")[0].length > 4,
      isDateError: formData.date > tzDate.toISOString().split("T")[0] || (formData.date < MIN_DATE && formData.date !== "") || formData.date.split("-")[0].length > 4,
      isTimeError: formData.date === tzDate.toISOString().split("T")[0] && formData.time > tzDate.toTimeString().slice(0, 5),
    }
  }, [formData.date, formData.time, formData.timezone])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const currentWords = inputValue.trim().split(/\s+/).filter(Boolean)
    const wordCount = currentWords.length
    
    // Cek apakah input terakhir adalah spasi
    const endsWithSpace = inputValue.endsWith(" ")

    // JIKA sudah 10 kata DAN user mencoba menambah spasi, maka BLOK (jangan update state)
    if (wordCount >= MAX_TITLE_WORDS && endsWithSpace) {
      return
    }

    // Izinkan update jika masih dalam batas kata
    if (wordCount <= MAX_TITLE_WORDS) {
      updateFormData({ title: inputValue })
    }
  }, [updateFormData, MAX_TITLE_WORDS])

  // FIX: Menambahkan h-[50px] agar input tidak gepeng di mobile
  const commonInputClass = "w-full h-[50px] px-4 py-3 bg-white border rounded-xl text-general-100 placeholder:text-general-40 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-blue-100 transition-all duration-200 disabled:bg-general-20 disabled:cursor-not-allowed"
  const labelClass = "block text-sm font-bold text-general-80 mb-2"

  const locationNames = useMemo(() => ({
    province: provinces.find((p) => p.id === formData.province)?.name || "",
    city: availableCities.find((c) => c.id === formData.city)?.name || "",
    district: availableDistricts.find((d) => d.id === formData.district)?.name || "",
  }), [provinces, availableCities, availableDistricts, formData.province, formData.city, formData.district])

  return (
    <div className="space-y-6">
      {/* JUDUL LAPORAN */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <label htmlFor="title" className={labelClass}>Judul Laporan <span className="text-red-100">*</span></label>
          <span className={cn("text-xs font-medium", 
            (currentTitleWords === MAX_TITLE_WORDS || isTitleTooShort) ? 'text-red-100' : 'text-general-60'
          )}>
            {isTitleTooShort ? `Min. ${MIN_TITLE_CHARS} Karakter` : `${currentTitleWords}/${MAX_TITLE_WORDS} Kata`}
          </span>
        </div>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={handleTitleChange}
          placeholder="Contoh: Nasi basi di SDN 01 Pagi"
          className={cn(commonInputClass, 
            (currentTitleWords >= MAX_TITLE_WORDS || isTitleTooShort) 
              ? "border-red-100 focus:border-red-100 focus:ring-red-100/30" 
              : "border-general-30"
          )}
        />
        {isTitleTooShort && (
          <p className="text-xs text-red-100 mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3 h-3"/> Judul terlalu pendek (minimal {MIN_TITLE_CHARS} karakter)
          </p>
        )}
      </div>

      {/* KATEGORI */}
      <div>
        <label htmlFor="category" className={labelClass}>Kategori Masalah <span className="text-red-100">*</span></label>
        <div className="relative z-50">
          <CustomSelect
            value={formData.category}
            onChange={(val) => updateFormData({ category: val })}
            options={categories}
            loading={categoriesLoading}
            placeholder="Pilih Kategori"
          />
        </div>
      </div>

      {/* TANGGAL & WAKTU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="date" className={labelClass}>Tanggal Kejadian <span className="text-red-100">*</span></label>
          <input
            type="date"
            id="date"
            value={formData.date}
            min={MIN_DATE}
            max={todayInTz}
            onChange={(e) => updateFormData({ date: e.target.value })}
            className={cn(commonInputClass, "min-h-[50px]", isDateError ? "border-red-100 focus:ring-red-100/30" : "border-general-30")}
          />
          {isDateError && <p className="text-xs text-red-100 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Tanggal tidak valid</p>}
        </div>
        <div>
          <label htmlFor="time" className={labelClass}>Waktu Kejadian <span className="text-red-100">*</span></label>
          <div className="flex gap-3">
            <input
              type="time"
              id="time"
              value={formData.time}
              onChange={(e) => updateFormData({ time: e.target.value })}
              className={cn(commonInputClass, "min-h-[50px]", isTimeError ? "border-red-100" : "border-general-30")}
            />
            <div className="relative w-32 shrink-0 z-40">
              <CustomSelect
                value={formData.timezone}
                onChange={(val) => updateFormData({ timezone: val as Timezone })}
                options={TIMEZONES}
                placeholder="WIB"
              />
            </div>
          </div>
        </div>
      </div>

      {/* WILAYAH */}
      <div className="space-y-4 pt-2">
        <p className="text-sm font-bold text-general-100 border-b border-general-30 pb-2">Detail Lokasi</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative z-30">
                <label className={labelClass}>Provinsi <span className="text-red-100">*</span></label>
                <CustomSelect
                    value={formData.province}
                    onChange={(val) => updateFormData({ province: val, city: "", district: "", latitude: undefined, longitude: undefined })}
                    options={provinces}
                    loading={provincesLoading}
                    placeholder="Pilih Provinsi"
                />
            </div>
            <div className="relative z-20">
                <label className={labelClass}>Kota/Kabupaten <span className="text-red-100">*</span></label>
                <CustomSelect
                    value={formData.city}
                    onChange={(val) => updateFormData({ city: val, district: "", latitude: undefined, longitude: undefined })}
                    options={availableCities}
                    loading={citiesLoading}
                    disabled={!formData.province}
                    placeholder="Pilih Kota/Kab"
                />
            </div>
            <div className="relative md:col-span-2 z-10">
                <label className={labelClass}>Kecamatan <span className="text-red-100">*</span></label>
                <CustomSelect
                    value={formData.district}
                    onChange={(val) => updateFormData({ district: val, latitude: undefined, longitude: undefined })}
                    options={availableDistricts}
                    loading={districtsLoading}
                    disabled={!formData.city}
                    placeholder="Pilih Kecamatan"
                />
            </div>
        </div>
      </div>

      {/* LOKASI SPESIFIK */}
      <div>
        <div className="flex justify-between items-end mb-2">
            <label htmlFor="location" className={labelClass}>Lokasi Spesifik <span className="text-red-100">*</span></label>
            <span className="text-xs text-general-60 font-medium">{currentLength}/{MAX_LOCATION_LENGTH}</span>
        </div>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => e.target.value.length <= MAX_LOCATION_LENGTH && updateFormData({ location: e.target.value })}
          placeholder="Nama Sekolah / Gedung / Jalan"
          className={cn(commonInputClass, "border-general-30")}
        />
      </div>

      {/* MAP PREVIEW */}
      {formData.district && (
        <div className="pt-2">
            <label className={labelClass}>Titik Peta (Opsional)</label>
            <Suspense fallback={<div className="h-[400px] bg-general-20 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-100" /></div>}>
                <LocationMapPreview
                    provinceName={locationNames.province}
                    cityName={locationNames.city}
                    districtName={locationNames.district}
                    specificLocation={formData.location}
                    onCoordinatesChange={(lat, lng) => updateFormData({ latitude: lat, longitude: lng })}
                />
            </Suspense>
        </div>
      )}
    </div>
  )
}

export const StepLocationCategory = memo(StepLocationCategoryComponent)