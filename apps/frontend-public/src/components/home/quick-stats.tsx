import { memo, useMemo } from "react"
import { FileText, Users, UserCheck, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { reportsService } from "@/services/reports"

function QuickStatsComponent() {
  // 1. Query Data Laporan & User Summary
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => reportsService.getSummary(),
    staleTime: 30000,
  })

  const statsItems = useMemo(() => {
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
        icon: FileText,
        value: stats?.total?.toLocaleString() || "0",
        label: "Laporan Masuk",
      },
    ]
  }, [stats])

  return (
    // Responsive Vertical Padding (py-10 di mobile, py-16 di desktop)
    <section className="bg-blue-100 py-10 md:py-16">
      
      {/* CONTAINER FLUID:
          - Mobile: px-5
          - Tablet: px-8
          - Laptop: px-16
          - Monitor Besar: px-24
      */}
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
        
        {/* GRID SYSTEM:
            - grid-cols-1: Mobile (HP) -> Susun ke bawah
            - md:grid-cols-3: Tablet & Desktop -> Langsung 3 kolom sejajar
              (Menghindari grid-cols-2 agar tidak ada item gantung sendirian)
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {statsItems.map((stat, index) => (
            <div 
              key={index} 
              // Alignment:
              // Mobile: justify-start (Rata kiri biar rapih kayak list) + pl-4 (padding kiri)
              // Tablet/Desktop: justify-center (Rata tengah) + pl-0 (reset padding)
              className="flex flex-row items-center justify-start md:justify-center gap-4 pl-4 md:pl-0"
            >
              
              {/* Icon Container: Responsive Size (w-12 mobile, w-14 desktop) */}
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shadow-sm shrink-0 backdrop-blur-sm transition-transform hover:scale-105">
                {statsLoading ? (
                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                ) : (
                    <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                )}
              </div>
              
              <div className="text-left">
                {/* Text Value: Responsive Font Size */}
                <p className="h3 text-white mb-0 leading-none text-2xl md:text-3xl">
                    {stat.value}
                </p>
                <p className="body-sm text-white/90 font-bold mt-1 whitespace-nowrap">
                    {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const QuickStats = memo(QuickStatsComponent)