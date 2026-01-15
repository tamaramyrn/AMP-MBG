import type { Context } from "hono"

// Custom error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(400, message, "VALIDATION_ERROR")
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, message, "AUTHENTICATION_ERROR")
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Akses ditolak") {
    super(403, message, "AUTHORIZATION_ERROR")
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(404, `${resource} tidak ditemukan`, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT")
    this.name = "ConflictError"
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Terlalu banyak permintaan") {
    super(429, message, "RATE_LIMIT")
    this.name = "RateLimitError"
  }
}

// Error response helper
export function errorResponse(c: Context, error: AppError | Error) {
  if (error instanceof AppError) {
    return c.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.field && { field: error.field }),
      },
      error.statusCode as 400 | 401 | 403 | 404 | 409 | 429
    )
  }

  // Log unexpected errors
  console.error("Unexpected error:", error)

  return c.json(
    {
      error: "Terjadi kesalahan internal",
      code: "INTERNAL_ERROR",
    },
    500
  )
}

// Standard response formats
export interface SuccessResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ErrorResponse {
  error: string
  code?: string
  field?: string
}

// Success response helpers
export function successResponse<T>(c: Context, data: T, message?: string, status: 200 | 201 = 200) {
  return c.json({ data, ...(message && { message }) }, status)
}

export function paginatedResponse<T>(
  c: Context,
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return c.json({
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  })
}
