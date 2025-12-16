import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    classesToday: 0,
    attendanceRate: 0,
    topStudent: '—'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiCall('/dashboard/stats')
        setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Overview of your tuition center.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
          <DashCard title="Total Students" value={loading ? '...' : stats.totalStudents} icon="👥" color="#3699ff" href="/admin/students" />
          <DashCard title="Classes Today" value={loading ? '...' : stats.classesToday} icon="📅" color="#1bc5bd" href="/admin/classes" />
          <DashCard title="Avg Attendance" value={loading ? '...' : stats.attendanceRate + '%'} icon="✅" color="#8950fc" href="/admin/attendance" />
          <DashCard title="Top Performer" value={loading ? '...' : stats.topStudent} icon="👑" color="#ffa800" href="/admin/stars" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Quick Actions removed as sidebar covers navigation, maybe show recent activity or quick links in a different style? */}
          <div className="card" style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 0 20px 0 rgba(76,87,125,0.02)', border: '1px solid #f0f0f0' }}>
            <h3 style={{ marginTop: 0 }}>🚀 Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <QuickBtn href="/admin/students" label="Add Student" color="#3699ff" />
              <QuickBtn href="/admin/classes" label="Schedule Class" color="#1bc5bd" />
              <QuickBtn href="/admin/announcements" label="Post Notice" color="#8950fc" />
              <QuickBtn href="/admin/tests" label="Create Test" color="#ffa800" />
            </div>
          </div>

          <div className="card" style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 0 20px 0 rgba(76,87,125,0.02)', border: '1px solid #f0f0f0' }}>
            <h3 style={{ marginTop: 0 }}>📌 System Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1bc5bd' }}></div>
              <span>Backend API: Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1bc5bd' }}></div>
              <span>Star System: Active</span>
            </div>
            <div style={{ marginTop: 20, padding: 15, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#666' }}>
              Tip: Remember to award stars weekly to keep students engaged!
            </div>
          </div>
        </div>

      </AdminLayout>
    </ProtectedRoute>
  )
}

function DashCard({ title, value, icon, color, href }) {
  const CardContent = (
    <div className="card" style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 0 20px 0 rgba(76,87,125,0.02)',
      border: '1px solid #f0f0f0',
      cursor: href ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      height: '100%'
    }}>
      <div>
        <div style={{ color: '#b5b5c3', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 5, color: '#3f4254' }}>{value}</div>
      </div>
      <div style={{ width: 48, height: 48, background: `${color}20`, color: color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
        {icon}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {CardContent}
      </Link>
    )
  }
  return CardContent
}

function QuickBtn({ href, label, color }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '12px',
        border: `1px solid ${color}`,
        color: color,
        borderRadius: 8,
        textAlign: 'center',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: 'white'
      }}
        onMouseOver={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; }}
      >
        {label}
      </div>
    </Link>
  )
}
