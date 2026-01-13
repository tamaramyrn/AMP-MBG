import { FileText, MapPin, AlertTriangle } from "lucide-react"

const stats = [
  {
    icon: FileText,
    value: "0",
    label: "Partisipasi Masyarakat",
  },
  {
    icon: MapPin,
    value: "0",
    label: "Lokasi Laporan",
  },
  {
    icon: AlertTriangle,
    value: "0",
    label: "Risiko Terindikasi",
  },
]

export function QuickStats() {
  return (
    <section className="bg-blue-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="flex flex-row items-center justify-start md:justify-center gap-4 pl-4 md:pl-0"
            >
              
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-blue-100" />
              </div>
              
              <div className="text-left">
                <p className="h3 text-white mb-0 leading-none">{stat.value}</p>
                <p className="body-sm text-white/90 font-medium">
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