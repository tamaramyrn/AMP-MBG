import { SignJWT, jwtVerify } from "jose"
import type { JWTPayload } from "../types"

// Cache encoded secret
let cachedSecret: Uint8Array | null = null

const getSecret = () => {
  if (cachedSecret) return cachedSecret
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not set")
  cachedSecret = new TextEncoder().encode(secret)
  return cachedSecret
}

const expiresIn = process.env.JWT_EXPIRES_IN || "7d"

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
