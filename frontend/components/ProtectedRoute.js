import { useAuth } from '../hooks/useAuth'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { token, loading, user } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (loading) return
    
    if (!token) {
      console.log('⚠️ No token, redirecting to login')
      router.replace('/')
      return
    }
    
    if (requiredRole && user?.role !== requiredRole) {
      console.log('⚠️ Wrong role, redirecting')
      router.replace('/')
      return
    }
    
    setIsReady(true)
  }, [token, loading, user, requiredRole, router])

  if (loading || !isReady) {
    return <div style={{padding:20, textAlign:'center'}}>Loading...</div>
  }

  return children
}
