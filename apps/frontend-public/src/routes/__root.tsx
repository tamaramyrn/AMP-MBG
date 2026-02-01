import { createRootRoute, Outlet } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { NotFound } from "@/components/not-found"

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
