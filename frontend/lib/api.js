// Automatically determine API URL based on current window location
const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:4000/api'; // Server-side

  const hostname = window.location.hostname;

  // Local Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }

  // Production (Render Backend)
  return 'https://jathin-s-learning-hub.onrender.com/api';
}

const API_BASE = getApiUrl();

export async function apiCall(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // If body is FormData, let browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
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
