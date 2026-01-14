import { createMiddleware } from "hono/factory"
import { verifyToken } from "../lib/jwt"
import type { AuthUser } from "../types"

type Variables = {
  user: AuthUser
}

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Invalid token" }, 401)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    phone: "",
    role: payload.role,
  })

  await next()
})

export const optionalAuthMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)

    if (payload) {
      c.set("user", {
        id: payload.sub,
        email: payload.email,
        phone: "",
        role: payload.role,
      })
    }
  }

  await next()
})

export const adminMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return c.json({ error: "Invalid token" }, 401)
  }

  if (payload.role !== "admin" && payload.role !== "moderator") {
    return c.json({ error: "Forbidden" }, 403)
  }

  c.set("user", {
    id: payload.sub,
    email: payload.email,
    phone: "",
    role: payload.role,
  })

  await next()
})
