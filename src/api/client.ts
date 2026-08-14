const API_URL = import.meta.env.VITE_API_URL
console.log("API URL:", API_URL)

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

if (!response.ok) {
  const errorText = await response.text();

  let message = errorText || `API request failed: ${response.status}`;

  try {
    const errorData = JSON.parse(errorText);

    if (typeof errorData.error === "string") {
      message = errorData.error;
    }
  } catch {
    // Response was not JSON, so keep the original text.
  }

  throw new Error(message);
}

if (response.status === 204) {
  return undefined as T;
}

const text = await response.text();

if (!text) {
  return undefined as T;
}

return JSON.parse(text) as T;

}