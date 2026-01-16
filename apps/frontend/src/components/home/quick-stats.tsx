import { memo, useMemo } from "react"
import { FileText, Map, Users, UserCheck, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { reportsService } from "@/services/reports"
import { locationsService } from "@/services/locations"

function QuickStatsComponent() {
  // 1. Query Data Laporan & User Summary
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => reportsService.getSummary(),
    staleTime: 30000,
  })

  // 2. Query Data Provinsi (Untuk menghitung jangkauan wilayah)
  const { data: provinces, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await locationsService.getProvinces()
      return response.data
    },
    staleTime: 1000 * 60 * 60, // Cache 1 jam karena data wilayah jarang berubah
  })

  const statsItems = useMemo(() => {
    // Menghitung jumlah provinsi dari panjang list dropdown
    const provinceCount = provinces?.length || 0
    const coverageText = `${provinceCount}` 

    return [
      {
        icon: Users,
        value: stats?.totalCommunityUsers?.toLocaleString() || "0",
        label: "Masyarakat Terdaftar",
      },
      {
        icon: UserCheck,
        value: stats?.totalAmpMbgUsers?.toLocaleString() || "0",
        label: "Anggota AMP MBG",
      },
      {
        icon: Map,
        value: coverageText,
        label: "Provinsi yang akan Dijangkau",
      },
      {
        icon: FileText,
        value: stats?.total?.toLocaleString() || "0",
        label: "Laporan Masuk",
      },
    ]
  }, [stats, provinces])

  return (
    <section className="bg-blue-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsItems.map((stat, index) => (
            <div 
              key={index} 
              className="flex flex-row items-center justify-start lg:justify-center gap-4 pl-4 lg:pl-0"
            >
              
              <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shadow-sm shrink-0 backdrop-blur-sm">
                {(statsLoading || provincesLoading) ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                    <stat.icon className="w-7 h-7 text-white" />
                )}
              </div>
              
              <div className="text-left">
                <p className="h3 text-white mb-0 leading-none">
                    {stat.value}
                </p>
                {/* PERUBAHAN DI SINI: Added 'whitespace-nowrap' */}
                <p className="body-sm text-white/90 font-bold mt-1 whitespace-nowrap">
                    {stat.label}
                </p>
                {/* Sublabel dihapus karena tidak ada data di object statsItems */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const QuickStats = memo(QuickStatsComponent)