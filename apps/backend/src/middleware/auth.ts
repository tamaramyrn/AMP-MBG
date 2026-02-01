import { createMiddleware } from "hono/factory"
import { verifyToken } from "../lib/jwt"
import type { AuthUser, AuthAdmin } from "../types"

type UserVariables = { user: AuthUser }
type AdminVariables = { admin: AuthAdmin }
type AnyAuthVariables = { user?: AuthUser; admin?: AuthAdmin }

// User auth middleware - for public users only
export const authMiddleware = createMiddleware<{ Variables: UserVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Token tidak valid" }, 401)
  }

  if (payload.type !== "user") {
    return c.json({ error: "Token tidak valid untuk pengguna" }, 401)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    type: "user",
  })

  await next()
})

// Optional auth - validates user if present
export const optionalAuthMiddleware = createMiddleware<{ Variables: UserVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)

    if (payload && payload.type === "user") {
      c.set("user", {
        id: payload.sub,
        email: payload.email,
        type: "user",
      })
    }
  }

  await next()
})

// Admin auth middleware - for admin only
export const adminMiddleware = createMiddleware<{ Variables: AdminVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Token tidak valid" }, 401)
  }

  if (payload.type !== "admin") {
    return c.json({ error: "Akses ditolak" }, 403)
  }

  c.set("admin", {
    id: payload.sub,
    email: payload.email,
    type: "admin",
  })

  await next()
})

// Reporter middleware - for public users to submit reports
export const reporterMiddleware = createMiddleware<{ Variables: UserVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Silakan login untuk membuat laporan" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Token tidak valid" }, 401)
  }

  // Admin cannot submit reports
  if (payload.type === "admin") {
    return c.json({ error: "Admin tidak dapat membuat laporan" }, 403)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    type: "user",
  })

  await next()
})
