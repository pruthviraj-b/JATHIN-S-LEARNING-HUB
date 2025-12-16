const API_BASE = 'http://localhost:4000/api'

export async function apiCall(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`)
  return data
}
