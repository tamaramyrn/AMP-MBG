import { createMiddleware } from "hono/factory"
import { verifyToken } from "../lib/jwt"
import type { AuthUser } from "../types"

type Variables = {
  user: AuthUser
}

// Base auth middleware - requires valid token
export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Token tidak valid" }, 401)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  })

  await next()
})

// Optional auth - validates if present
export const optionalAuthMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)

    if (payload) {
      c.set("user", {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      })
    }
  }

  await next()
})

// Admin only
export const adminMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Token tidak valid" }, 401)
  }

  if (payload.role !== "admin") {
    return c.json({ error: "Akses ditolak" }, 403)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  })

  await next()
})

// Public users only - for report submission (no admin)
export const reporterMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
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
  if (payload.role === "admin") {
    return c.json({ error: "Admin tidak dapat membuat laporan" }, 403)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  })

  await next()
})

// Create role checker middleware factory
export const requireRole = (...roles: string[]) => {
  return createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const authHeader = c.req.header("Authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    const token = authHeader.slice(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return c.json({ error: "Token tidak valid" }, 401)
    }

    if (!roles.includes(payload.role)) {
      return c.json({ error: "Akses ditolak" }, 403)
    }

    c.set("user", {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    })

    await next()
  })
}
