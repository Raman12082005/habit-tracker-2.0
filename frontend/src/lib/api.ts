const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("ht_token")
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const contentType = response.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json") ? await response.json() : await response.text()
  if (!response.ok) throw new Error(typeof body === "object" ? body.detail ?? "Request failed" : body || "Request failed")
  return body as T
}
export const apiUrl = API_URL
