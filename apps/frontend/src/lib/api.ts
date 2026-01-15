const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Cache token to avoid localStorage reads
let cachedToken: string | null = null

function getToken(): string | null {
  if (cachedToken === null) {
    cachedToken = localStorage.getItem("token")
  }
  return cachedToken
}

export function setToken(token: string): void {
  cachedToken = token
  localStorage.setItem("token", token)
}

export function removeToken(): void {
  cachedToken = null
  localStorage.removeItem("token")
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options

  const token = getToken()
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  }

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.error || "Request failed", data)
  }

  return data
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "POST", body }),
  put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "PUT", body }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "PATCH", body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
}

export { ApiError }
