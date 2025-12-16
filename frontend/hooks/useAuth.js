import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiCall } from '../lib/api'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (stored) {
      setToken(stored)
      // Try to parse user from localStorage
      const userData = localStorage.getItem('user')
      if (userData) setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', email)

      // Use apiCall instead of direct fetch to localhost
      const data = await apiCall('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      console.log('📦 Response:', data)
      // apiCall throws error if status is not ok

      console.log('✅ Login successful, token:', data.token?.substring(0, 20) + '...')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ role: data.role, student: data.student || null }))
      setToken(data.token)
      setUser({ role: data.role, student: data.student || null })

      console.log('🔄 Redirecting to:', data.role === 'ADMIN' ? '/admin' : '/student')
      if (data.role === 'ADMIN') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/student'
      }

      return data
    } catch (err) {
      console.error('❌ Login error:', err)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.push('/')
  }

  return { user, token, loading, login, logout, isAuthenticated: !!token }
}
