import { createFileRoute, Link } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-anggota-layout"
import { useQuery } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import {
  Loader2,
  TrendingUp,
  MapPin,
  AlertTriangle,
  ChevronDown,
  FileText,
  ClipboardList
} from "lucide-react"
import { useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardAnggota,
})

const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan & Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas & Keamanan",
  policy: "Kebijakan & Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial",
}

const MONTH_OPTIONS = [
  { value: 0, label: "Tahunan" },
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
]

function DashboardAnggota() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(0)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminService.getDashboard(),
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin", "analytics", selectedYear, selectedMonth],
    queryFn: () => adminService.getAnalytics(selectedYear, selectedMonth),
  })

  const isLoading = statsLoading || analyticsLoading

  const riskCounts = {
    high: analytics?.overview.highRiskReports || 0,
    medium: analytics?.overview.mediumRiskReports || 0,
    low: analytics?.overview.lowRiskReports || 0,
  }

  const pendingCount = stats?.reports.pending || 0

  const topCategories = useMemo(() => {
    if (!stats?.reports.byCategory) return []
    return [...stats.reports.byCategory]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [stats])

  const chartData = useMemo(() => {
    if (analytics?.trends?.data) {
      return analytics.trends.data
    }
    return []
  }, [analytics])


  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8">

        {/* --- Header Section --- */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
            
            {/* Title Box */}
            <div className="flex-1 bg-general-20 border border-general-30 rounded-xl p-6 shadow-sm flex flex-col justify-center">
                <h1 className="h4 text-general-100 mb-1">
                    Dashboard Monitoring
                </h1>
                <p className="body-sm text-general-60">
                    Pantau sebaran masalah program MBG secara real-time.
                </p>
                <div className="mt-4 flex gap-3">
                    <div className="px-3 py-1.5 bg-general-30/50 rounded-lg text-xs font-medium text-general-80">
                        Total Laporan: <span className="text-general-100 font-bold">{stats?.reports.total || 0}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-green-20 border border-green-30 rounded-lg text-xs font-medium text-green-100">
                        Terverifikasi: <span className="font-bold">{stats?.reports.total ? stats.reports.total - pendingCount : 0}</span>
                    </div>
                </div>
            </div>

            {/* Action Needed Card (Pending Reports) */}
            <div className="lg:w-1/3 bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-orange-800 text-xs font-bold uppercase tracking-wider mb-1">Perlu Tindakan</p>
                    <div className="flex items-baseline gap-2">
                        <span className="h1 text-orange-900 leading-none">{pendingCount}</span>
                        <span className="body-sm text-orange-800 font-medium">Laporan Baru</span>
                    </div>
                    <p className="text-xs text-orange-700/80 mt-2">Menunggu verifikasi admin</p>
                </div>
                <div className="h-16 w-16 bg-white/50 rounded-full flex items-center justify-center text-orange-500">
                    <ClipboardList className="w-8 h-8" />
                </div>
            </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-100 mb-4" />
            <p className="body-sm text-general-60">Memuat analitik data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* --- SECTION 1: RISIKO MASALAH --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-20 border border-red-30 rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-red-100" /></div>
                    <p className="body-sm font-bold text-red-100 uppercase tracking-wider mb-1">Risiko Tinggi</p>
                    <p className="h2 text-red-100">{riskCounts.high}</p>
                </div>

                <div className="bg-yellow-20 border border-yellow-30 rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-yellow-600" /></div>
                    <p className="body-sm font-bold text-yellow-600 uppercase tracking-wider mb-1">Risiko Sedang</p>
                    <p className="h2 text-yellow-600">{riskCounts.medium}</p>
                </div>

                <div className="bg-green-20 border border-green-30 rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-green-100" /></div>
                    <p className="body-sm font-bold text-green-100 uppercase tracking-wider mb-1">Risiko Rendah</p>
                    <p className="h2 text-green-100">{riskCounts.low}</p>
                </div>
            </div>

            {/* --- SECTION 2: CHART & CATEGORIES (Grid Split) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Chart (2 Cols) */}
                <div className="lg:col-span-2 bg-general-20 border border-general-30 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <h3 className="h6 text-general-100 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-100" />
                            Tren Laporan {selectedMonth === 0 ? "Bulanan" : "Harian"}
                        </h3>
                        <div className="flex gap-2">
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="appearance-none bg-general-20 border border-general-30 text-general-80 py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 outline-none cursor-pointer hover:bg-general-30/30 transition-colors"
                                >
                                    {[2024, 2025, 2026].map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-general-60 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="appearance-none bg-general-20 border border-general-30 text-general-80 py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 outline-none cursor-pointer hover:bg-general-30/30 transition-colors"
                                >
                                    {MONTH_OPTIONS.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-general-60 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: "#6b7280" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "#6b7280" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e5e7eb" }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                                    labelFormatter={(label) => selectedMonth === 0 ? `Bulan: ${label}` : `Tanggal: ${label}`}
                                    formatter={(value: number) => [`${value} Laporan`, "Jumlah"]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, fill: "#3b82f6" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Top Categories (1 Col) */}
                <div className="bg-general-20 border border-general-30 rounded-xl p-6 shadow-sm flex flex-col">
                    <h3 className="h6 text-general-100 flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-100" />
                        Masalah Terbanyak
                    </h3>
                    
                    <div className="flex-1 space-y-4">
                        {topCategories.map((cat, idx) => (
                            <div key={cat.category} className="group">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-medium text-general-80">
                                        {CATEGORY_LABELS[cat.category] || cat.category}
                                    </span>
                                    <span className="text-xs font-bold text-general-100">{cat.count}</span>
                                </div>
                                <div className="w-full h-2 bg-general-30 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${idx === 0 ? 'bg-red-90' : idx === 1 ? 'bg-orange-400' : 'bg-blue-100'}`} 
                                        style={{ width: `${(cat.count / (stats?.reports.total || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {topCategories.length === 0 && (
                            <p className="text-xs text-general-60 text-center py-4">Belum ada data kategori.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: BREAKDOWN LOKASI --- */}
            <div>
                <h3 className="h6 text-general-100 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-general-60" />
                    Wilayah dengan Laporan Terbanyak
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Top Provinsi */}
                    <LocationCard 
                        title="Provinsi" 
                        data={analytics?.topProvinces?.slice(0, 5).map(i => ({ 
                            name: i.province, 
                            count: i.count 
                        })) || []} 
                    />

                    {/* Top Kabupaten/Kota */}
                    <LocationCard
                        title="Kabupaten/Kota"
                        data={analytics?.topCities?.slice(0, 5).map(i => ({
                            name: i.city,
                            sub: i.province,
                            count: i.count
                        })) || []}
                    />

                    {/* Top Kecamatan */}
                    <LocationCard
                        title="Kecamatan"
                        data={analytics?.topDistricts?.slice(0, 5).map(i => ({
                            name: i.district,
                            sub: i.city,
                            count: i.count
                        })) || []}
                    />

                </div>
            </div>

          </div>
        )}

      </div>
    </DashboardAnggotaLayout>
  )
}

// Reusable Location List Card
function LocationCard({ title, data }: { title: string, data: { name: string; sub?: string; count: number }[] }) {
    return (
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-general-30 bg-general-30/30">
                <h4 className="body-sm font-bold text-general-100">{title}</h4>
            </div>
            <div className="divide-y divide-general-30 flex-1">
                {data.length > 0 ? (
                    data.map((item, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-general-30/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < 3 ? 'bg-blue-100 text-general-20' : 'bg-general-30 text-general-60'}`}>
                                    {idx + 1}
                                </span>
                                <div>
                                    <p className="body-sm text-general-80 line-clamp-1">{item.name}</p>
                                    {item.sub && <p className="text-[10px] text-general-50 line-clamp-1">{item.sub}</p>}
                                </div>
                            </div>
                            <span className="body-sm font-bold text-general-100">{item.count}</span>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-general-60 body-sm">Belum ada data</div>
                )}
            </div>
            <div className="p-3 border-t border-general-30 text-center">
                {/* LINK KE LAPORAN AGAR BISA DITEKAN */}
                <Link 
                    to="/dashboard/laporan" 
                    className="text-xs font-medium text-blue-100 hover:text-blue-90 hover:underline transition-colors"
                >
                    Lihat Semua {title}
                </Link>
            </div>
        </div>
    )
}