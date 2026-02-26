import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { lazy, Suspense, useEffect } from "react"
import { NotFound } from "@/components/not-found"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const TanStackRouterDevtools =
  import.meta.env.DEV
    ? lazy(() =>
        import("@tanstack/router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        }))
      )
    : () => null

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_title: document.title,
      })
    }
  }, [pathname])

  return (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
      )}
    </>
  )
}
