import { memo, useMemo } from "react"
import { FileText, Users, UserCheck, Loader2, Building2 } from "lucide-react" // Ditambahkan Building2
import { useQuery } from "@tanstack/react-query"
import { reportsService } from "@/services/reports"

function QuickStatsComponent() {
  // Data Fetching
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => reportsService.getSummary(),
    staleTime: 30000,
  })

  // Data Formatting
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
        icon: Building2,
        value: stats?.totalFoundations?.toLocaleString() || "0",
        label: "Yayasan Terdaftar",
      },
      {
        icon: FileText,
        value: stats?.total?.toLocaleString() || "0",
        label: "Laporan Masuk",
      },
    ]
  }, [stats])

  return (
    // Section Container
    <section className="bg-blue-90 py-12 md:py-20 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <FileText className="w-64 h-64 text-white rotate-12" />
      </div>

      <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24 relative z-10">
        {/* UPDATED: grid-cols-3 menjadi grid-cols-4 agar muat 4 item */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 divide-y md:divide-y-0 md:divide-x divide-blue-80/50">
          {statsItems.map((stat, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center text-center pt-8 md:pt-0 first:pt-0"
            >
              <div className="mb-4 p-3 bg-blue-80 rounded-2xl shadow-inner inline-flex">
                {statsLoading ? (
                    <Loader2 className="w-6 h-6 text-orange-40 animate-spin" />
                ) : (
                    <stat.icon className="w-6 h-6 text-orange-40" />
                )}
              </div>
              
              {/* Stat Value Display */}
              <p className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-general-20 mb-2">
                  {stat.value}
              </p>
              {/* Stat Label Display */}
              <p className="body-sm text-blue-20 font-medium tracking-wide uppercase">
                  {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const QuickStats = memo(QuickStatsComponent)