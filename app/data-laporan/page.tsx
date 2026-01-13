import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { DataSummaryCards } from "@/components/dashboard/data-summary-cards"
import { DataFilters } from "@/components/dashboard/data-filters"
import { DataTable } from "@/components/dashboard/data-table"

export default function DataLaporanPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Data dan Statistik Laporan MBG</h1>
            <p className="text-gray-600">Pantau perkembangan laporan masyarakat secara transparan</p>
          </div>

          {/* Summary Cards */}
          <DataSummaryCards />

          {/* Filters */}
          <DataFilters />

          {/* Data Table */}
          <DataTable />
        </div>
      </main>
      <Footer />
    </div>
  )
}
