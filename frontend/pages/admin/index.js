import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import { Users, Calendar, ClipboardCheck, Star, Zap, Activity, BookOpen, Bell } from 'lucide-react'

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

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatsCard
            label="Total Students"
            value={loading ? '...' : stats.totalStudents}
            icon={Users}
          />
          <StatsCard
            label="Classes Today"
            value={loading ? '...' : stats.classesToday}
            icon={Calendar}
          />
          <StatsCard
            label="Avg Attendance"
            value={loading ? '...' : stats.attendanceRate + '%'}
            icon={ClipboardCheck}
          />
          <StatsCard
            label="Top Performer"
            value={loading ? '...' : stats.topStudent}
            icon={Star}
          />
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

          {/* Quick Actions */}
          <div className="card" style={{ minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Quick Actions</h3>
              <div style={{ background: '#18181B', padding: 8, borderRadius: 10 }}>
                <Zap size={18} color="white" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <QuickAction href="/admin/students" label="Add Student" icon={Users} />
              <QuickAction href="/admin/classes" label="Schedule Class" icon={Calendar} />
              <QuickAction href="/admin/announcements" label="Post Notice" icon={Bell} />
              <QuickAction href="/admin/tests" label="Create Test" icon={BookOpen} />
            </div>
          </div>

          {/* System Status */}
          <div className="card" style={{ minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>System Status</h3>
              <div style={{ background: '#18181B', padding: 8, borderRadius: 10 }}>
                <Activity size={18} color="white" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <StatusItem label="Backend API" status="Online" />
              <StatusItem label="Database" status="Connected" />
              <StatusItem label="Star System" status="Active" />
            </div>

            <div style={{ marginTop: 'auto', padding: 15, background: '#18181B', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'start', border: '1px solid #27272A' }}>
              <span>💡</span>
              <span>Tip: Award stars weekly to keep students engaged and motivated!</span>
            </div>
          </div>

        </div>

      </AdminLayout>
    </ProtectedRoute>
  )
}

function StatsCard({ label, value, icon: Icon, href }) {
  const Content = (
    <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 15, transition: 'transform 0.2s', cursor: href ? 'pointer' : 'default' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #27272A' }}>
        <Icon size={24} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  )

  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{Content}</Link> : Content
}

function QuickAction({ href, label, icon: Icon }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#09090B',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s',
        border: '1px solid #27272A',
        cursor: 'pointer'
      }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.background = '#000000'; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.background = '#09090B'; }}
      >
        <div style={{ background: '#18181B', padding: 8, borderRadius: 8, border: '1px solid #27272A' }}>
          <Icon size={18} color="white" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
      </div>
    </Link>
  )
}

function StatusItem({ label, status }) {
  return (
    <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #27272A' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }}></div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{status}</span>
      </div>
    </div>
  )
}
