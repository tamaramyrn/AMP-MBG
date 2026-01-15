import { useState, useMemo, useCallback, memo } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ReportCard, type ReportData } from "@/components/ui/report-card"
import { cn } from "@/lib/utils"
import { ArrowRight, Loader2 } from "lucide-react"
import { reportsService } from "@/services/reports"

const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "poisoning", label: "Keracunan dan Masalah Kesehatan" },
  { id: "kitchen", label: "Operasional Dapur" },
  { id: "quality", label: "Kualitas dan Keamanan Dapur" },
  { id: "policy", label: "Kebijakan dan Anggaran" },
  { id: "implementation", label: "Implementasi Program" },
  { id: "social", label: "Dampak Sosial dan Ekonomi" },
] as const

const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan dan Masalah Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas dan Keamanan Dapur",
  policy: "Kebijakan dan Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial dan Ekonomi",
}

const CATEGORY_VARIANT: Record<string, ReportData["categoryVariant"]> = {
  poisoning: "danger",
  kitchen: "warning",
  quality: "warning",
  policy: "info",
  implementation: "info",
  social: "info",
}

const RELATION_LABELS: Record<string, string> = {
  parent: "Orang tua siswa",
  teacher: "Guru",
  principal: "Kepala Sekolah",
  supplier: "Penyedia Makanan",
  student: "Siswa",
  community: "Masyarakat Umum",
  other: "Lainnya",
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" }

function ReportFeedComponent() {
  const [activeCategory, setActiveCategory] = useState("all")

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => reportsService.getRecent(),
    staleTime: 30000,
  })

  const reports: ReportData[] = useMemo(() => {
    if (!reportsData?.data) return []
    return reportsData.data.map((r) => ({
      id: r.id,
      category: CATEGORY_LABELS[r.category] || r.category,
      categoryVariant: CATEGORY_VARIANT[r.category] || "info",
      title: r.title,
      location: r.location,
      date: new Date(r.incidentDate).toLocaleDateString("id-ID", DATE_FORMAT_OPTIONS),
      reporter: RELATION_LABELS[r.relation as keyof typeof RELATION_LABELS] || "Pelapor",
    }))
  }, [reportsData])

  const filteredReports = useMemo(() => {
    if (activeCategory === "all") return reports
    const currentCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label
    return reports.filter((report) => report.category === currentCategoryLabel)
  }, [reports, activeCategory])

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId)
  }, [])

  return (
    <section className="py-20 bg-general-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="h2 text-general-100 mb-4">
            Kategori Temuan
          </h2>
          <p className="body-lg text-general-70 max-w-2xl mx-auto">
            Jelajahi laporan terkini berdasarkan kategori untuk memahami isu-isu yang terjadi di lapangan.
          </p>
        </div>

        {/* --- TOMBOL KATEGORI --- */}
        <div className="flex flex-nowrap overflow-x-auto pb-4 gap-3 mb-8 md:mb-12 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center md:pb-0 scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "body-sm px-5 py-2.5 rounded-full font-medium transition-all duration-300 border shadow-sm whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-blue-100 text-general-20 border-blue-100 shadow-md transform scale-105"
                    : "bg-general-20 text-general-70 border-general-30 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 hover:shadow-md"
                )}
              >
                {category.label}
              </button>
            )
          })}
        </div>

        {/* --- REPORT CARDS --- */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
          </div>
        ) : (
        <div className="
          /* MOBILE: Flex Row + Scroll Samping */
          flex flex-nowrap overflow-x-auto gap-4 py-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide items-stretch
          
          /* DESKTOP: Grid 3 Kolom */
          md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-visible md:p-0 md:m-0
        ">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div 
                key={report.id}
                /* PERBAIKAN TINGGI SERAGAM:
                   - 'h-full flex flex-col': Membuat wrapper menjadi wadah flex vertikal penuh.
                */
                className="min-w-[85vw] sm:min-w-[400px] snap-center md:min-w-0 md:w-auto h-full flex flex-col"
              >
                {/* - 'flex-1': Mengisi ruang kosong vertikal.
                   - '[&>*]:h-full': Memaksa komponen ReportCard (anaknya) jadi tinggi 100%.
                */}
                <div className="flex-1 h-full [&>*]:h-full">
                  <ReportCard report={report} />
                </div>
              </div>
            ))
          ) : (
            // Pesan Kosong
            <div className="col-span-full w-full text-center py-12 text-general-60 body-md">
              Belum ada laporan untuk kategori ini.
            </div>
          )}
        </div>
        )}

        {/* Bottom Link */}
        <div className="text-center mt-12 md:mt-16">
          <Link
            to="/data-laporan"
            className="group inline-flex items-center gap-2 font-semibold transition-all px-8 py-4 rounded-full bg-blue-20 text-blue-100 hover:bg-blue-30 hover:shadow-md body-sm"
          >
            Lihat Seluruh Laporan
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export const ReportFeed = memo(ReportFeedComponent)