const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "")

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    // IMPORTANT:
    // tells the browser to send/receive our HttpOnly session cookie
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()

    let message = errorText || `API request failed: ${response.status}`

    try {
      const errorData = JSON.parse(errorText)

      if (typeof errorData.error === "string") {
        message = errorData.error
      }
    } catch {
      // Response was not JSON.
    }

    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()

  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}