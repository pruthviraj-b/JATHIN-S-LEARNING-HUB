import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import AdminLayout from '../../components/AdminLayout'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import { Users, Calendar, ClipboardCheck, Star, Zap, Activity, BookOpen, Bell } from 'lucide-react'
import StudentProfileImage from '../../components/StudentProfileImage'

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
        const roles = await apiCall('/roles') // Fetch roles
        setStats({ ...(data || {}), ...roles }) // Merge roles into stats
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

        {/* Welcome Banner - Forced Inline Styles to fix visibility */}
        <div style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          borderRadius: 24,
          padding: 30,
          marginBottom: 30,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #333',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
          display: 'block',
          color: 'white'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: 'white' }}>
              Welcome to Jathin's Hub
            </h1>
            <p style={{ color: '#D4D4D8', marginTop: 10, fontSize: 16 }}>
              Manage your institute efficiently.
            </p>
          </div>
          {/* Decorative Circle */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'var(--secondary)',
            opacity: 0.2,
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
        </div>

        {/* Stats Grid - Responsive Grid Inline */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', // Smaller min-width for mobile 2-col
          gap: 15,
          marginBottom: 40
        }}>
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
            href="/admin/stars"
          />
        </div>

        {/* Institute Leaders */}
        <div className="card" style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #000 0%, #333 100%)', padding: 8, borderRadius: 10 }}>
              <div style={{ fontSize: 18 }}>👑</div>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Institute Leaders</h3>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Head Captain */}
            <LeaderDisplay
              title="Head Captain"
              student={stats.captain}
              color="#D4AF37"
              icon="👑"
            />
            {/* Vice Captain */}
            <LeaderDisplay
              title="Vice Captain"
              student={stats.viceCaptain}
              color="#94A3B8"
              icon="🛡️"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="responsive-grid">

          {/* Quick Actions */}
          <div className="card" style={{ minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Quick Actions</h3>
              <div style={{ background: 'var(--primary)', padding: 8, borderRadius: 10 }}>
                <Zap size={18} color="white" />
              </div>
            </div>

            <div className="quick-actions-grid">
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
              <div style={{ background: 'var(--primary)', padding: 8, borderRadius: 10 }}>
                <Activity size={18} color="white" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <StatusItem label="Backend API" status="Online" />
              <StatusItem label="Database" status="Connected" />
              <StatusItem label="Star System" status="Active" />
            </div>

            <div style={{ marginTop: 'auto', padding: 15, background: 'rgba(212, 175, 55, 0.1)', borderRadius: 12, fontSize: 13, color: 'var(--text-main)', display: 'flex', gap: 10, alignItems: 'start', border: '1px solid var(--secondary)' }}>
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
    <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 15, transition: 'transform 0.2s', cursor: href ? 'pointer' : 'default', border: 'none', boxShadow: 'var(--shadow-md)' }}>
      <div className="stats-card-icon" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #000 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
        <Icon size={24} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div className="stats-card-value" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  )

  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{Content}</Link> : Content
}

function QuickAction({ href, label, icon: Icon }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s',
        border: '1px solid #E4E4E7',
        cursor: 'pointer'
      }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.transform = 'none' }}
      >
        <div style={{ background: 'var(--text-main)', padding: 8, borderRadius: 8 }}>
          <Icon size={18} color="white" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{label}</span>
      </div>
    </Link>
  )
}

function LeaderDisplay({ title, student, color, icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 200,
      background: 'rgba(255,255,255,0.5)',
      border: `1px solid ${color}33`,
      borderRadius: 16,
      padding: 20,
      display: 'flex', alignItems: 'center', gap: 15
    }}>
      {student ? (
        <StudentProfileImage student={student} size={60} />
      ) : (
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px dashed #A1A1AA' }}>❓</div>
      )}
      <div>
        <div style={{ fontSize: 12, color: color, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{icon} {title}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{student ? `${student.firstName} ${student.lastName || ''}` : 'Vacant'}</div>
      </div>
    </div>
  )
}

function StatusItem({ label, status }) {
  return (
    <div style={{ display: 'flex', items: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #E4E4E7' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{status}</span>
      </div>
    </div>
  )
}
