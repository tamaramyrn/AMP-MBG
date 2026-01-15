import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

// Optimized connection pool
const client = postgres(connectionString, {
  max: 20, // Max connections
  idle_timeout: 30, // Close idle connections after 30s
  connect_timeout: 10, // Connection timeout
  prepare: true, // Use prepared statements
})

export const db = drizzle(client, { schema })

export { schema }
