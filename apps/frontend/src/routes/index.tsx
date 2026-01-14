import { createFileRoute } from "@tanstack/react-router"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { QuickStats } from "@/components/home/quick-stats"
import { ReportFeed } from "@/components/home/report-feed"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <QuickStats />
        <ReportFeed />
      </main>
      <Footer />
    </div>
  )
}
