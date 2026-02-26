import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { useSEO } from "@/hooks/use-seo"
import { SEO } from "@/config/seo"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"

// Lazy Load Components
const QuickStats = lazy(() =>
  import("@/components/home/quick-stats").then((m) => ({ default: m.QuickStats }))
)
// Lazy load KeyBenefits
const KeyBenefits = lazy(() =>
  import("@/components/home/key-benefits").then((m) => ({ default: m.KeyBenefits }))
)
const ReportFeed = lazy(() =>
  import("@/components/home/report-feed").then((m) => ({ default: m.ReportFeed }))
)

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  useSEO(SEO.home)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Stats Bar */}
        <Suspense fallback={<div className="h-32 bg-gray-50 animate-pulse" />}>
          <QuickStats />
        </Suspense>

        {/* 3. Key Benefits */}
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <KeyBenefits />
        </Suspense>

        {/* 4. Report Feed */}
        <Suspense fallback={<div className="h-96 bg-gray-50 animate-pulse" />}>
          <ReportFeed />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}