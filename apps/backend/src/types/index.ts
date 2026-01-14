export interface JWTPayload {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
}

export interface AuthUser {
  id: string
  email: string
  phone: string
  role: string
}

export type ReportStatus = "pending" | "verified" | "in_progress" | "resolved" | "rejected"

export type ReportCategory =
  | "poisoning"
  | "kitchen"
  | "quality"
  | "policy"
  | "implementation"
  | "social"

export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  CORS_ORIGIN: string
  PORT: string
  NODE_ENV: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET?: string
  R2_ENDPOINT?: string
  R2_PUBLIC_URL?: string
}
