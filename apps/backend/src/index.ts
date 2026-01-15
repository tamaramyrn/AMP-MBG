import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { compress } from "hono/compress"
import { serveStatic } from "hono/bun"
import { timing } from "hono/timing"
import routes from "./routes"

const app = new Hono()

// Performance middleware
app.use("*", timing())
app.use("*", compress())

// Logging in development only
if (process.env.NODE_ENV !== "production") {
  app.use("*", logger())
}

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
)

// Serve local uploads in development
if (process.env.STORAGE_TYPE === "local") {
  app.use("/uploads/*", serveStatic({ root: "./" }))
}

app.get("/", (c) => {
  return c.json({
    name: "AMP MBG API",
    version: "1.0.0",
    status: "running",
  })
})

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.route("/api", routes)

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "Internal server error" }, 500)
})

const port = Number(process.env.PORT) || 3000

export default {
  port,
  fetch: app.fetch,
}

console.log(`Server running on http://localhost:${port}`)

