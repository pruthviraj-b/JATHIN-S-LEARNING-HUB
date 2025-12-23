import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('') // Debug state

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      console.error('Form error:', err)
      setMsg(err?.message || 'Login failed. Please check your credentials.')
      setDebugInfo(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Get API URL for debug display
  const getDebugApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:4000/api';
      return 'https://jathin-s-learning-hub.onrender.com/api';
    }
    return 'Server Side';
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#f8fafc', // Clean light background
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'DM Sans', sans-serif"
    }}>

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        background: '#ffffff', // Pure white card
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        padding: '40px 30px',
        textAlign: 'center',
        color: '#0f172a'
      }}>

        {/* Logo Area */}
        <div style={{ marginBottom: 30 }}>
          <img src="/logo.png" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 15 }} />
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: '#000000', // Pure black text
            letterSpacing: '-0.5px'
          }}>
            JATHIN'S LEARNING HUB
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>Welcome back! Please sign in.</p>
        </div>

        <form onSubmit={submit} style={{ textAlign: 'left' }}>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#000000', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#64748b' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  color: '#0f172a',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#000000'} // Focus black
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#000000', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#64748b' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  color: '#0f172a',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#000000'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary)', // Pure black button
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.1s',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>

        </form>

        {msg && (
          <div style={{
            marginTop: 20,
            padding: '10px',
            borderRadius: 6,
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#ef4444',
            fontSize: 13,
            textAlign: 'center'
          }}>
            {msg}
          </div>
        )}
      </div>

      {/* Footer Text */}
      <div style={{ position: 'fixed', bottom: 20, color: '#94a3b8', fontSize: 12, width: '100%', textAlign: 'center' }}>
        © {new Date().getFullYear()} Jathin's Learning Hub <br />
        <span style={{ opacity: 0.8, fontSize: 10, color: 'blue' }}>Target API: {getDebugApiUrl()}</span>
        {debugInfo && <div style={{ color: 'red', marginTop: 5 }}>{debugInfo}</div>}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        input::placeholder {
            color: #94a3b8;
        }
      `}</style>
    </div>
  )
}
