import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiCall } from '../../lib/api'
import StudentLayout from '../../components/StudentLayout'
import StudentProfileImage from '../../components/StudentProfileImage'

export default function StudentDashboard() {
  const { user } = useAuth()
  const studentName = user?.student?.firstName || 'Student'
  const [stats, setStats] = useState({
    stars: 0,
    rank: '—',
    attendance: '—',
    classes: [],
    announcements: [],
    subjects: [] // Added
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        // Fetch in parallel but handle failures independently
        const [dashboardRes, rolesRes] = await Promise.allSettled([
          apiCall('/dashboard/student'),
          apiCall('/roles')
        ])

        const dashboardData = dashboardRes.status === 'fulfilled' ? dashboardRes.value : {}
        const rolesData = rolesRes.status === 'fulfilled' ? rolesRes.value : {}

        if (dashboardRes.status === 'rejected') {
          console.error('Dashboard API failed:', dashboardRes.reason)
        }
        if (rolesRes.status === 'rejected') {
          console.error('Roles API failed:', rolesRes.reason)
        }

        // Merge what we have. If dashboard failed, we at least show structure (though empty values)
        setStats(prev => ({ ...prev, ...dashboardData, ...rolesData }))
      } catch (err) {
        console.error('Critical Layout Error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <StudentLayout>
        <div style={{
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
          borderRadius: 24,
          padding: '30px',
          marginBottom: 30,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #333',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'white' }}>
              Welcome to Jathin's Hub, {studentName} 👋
            </h1>
            <p style={{ color: '#D4D4D8', marginTop: 8, fontSize: 15 }}>
              Track your progress and stay updated.
            </p>
          </div>
          {/* Decorative Circle */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            background: 'var(--secondary)',
            opacity: 0.2,
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
        </div>

        <div className="stats-grid">
          <DashCard title="⭐ My Total Stars" value={loading ? '...' : stats.stars} icon="✨" />
          <Link href="/student/attendance" style={{ textDecoration: 'none' }}>
            <DashCard title="✅ My Attendance" value={loading ? '...' : stats.attendance} icon="📝" />
          </Link>
          <DashCard title="🏆 Class Rank" value={loading ? '...' : stats.rank} icon="🎖️" />

          {/* Institute Leaders Card */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 15 }}>
            <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Institute Leaders</h4>

            {/* Head Captain */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {stats.captain ? <StudentProfileImage student={stats.captain} size={40} /> : <div style={{ width: 40, height: 40, background: '#F4F4F5', borderRadius: '50%' }} />}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#D4AF37' }}>{stats.captain ? stats.captain.firstName : 'Vacant'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>👑 Head Captain</div>
              </div>
            </div>

            {/* Vice Captain */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {stats.viceCaptain ? <StudentProfileImage student={stats.viceCaptain} size={40} /> : <div style={{ width: 40, height: 40, background: '#F4F4F5', borderRadius: '50%' }} />}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>{stats.viceCaptain ? stats.viceCaptain.firstName : 'Vacant'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🛡️ Vice Captain</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Grid (New Section) */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>📚 My Subjects (Class {user?.student?.classLevel})</h3>
          {loading ? <p>Loading subjects...</p> : (stats.subjects || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No subjects assigned for this class yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {(stats.subjects || []).map((sub, i) => (
                <div key={sub.id} style={{
                  background: 'var(--bg-card)',
                  padding: 24,
                  borderRadius: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  border: '1px solid var(--glass-border)',
                  cursor: 'default',
                  transition: 'transform 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'white' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--bg-card)' }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 12, marginBottom: 15,
                    background: 'black',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    border: '1px solid #333'
                  }}>
                    {sub.name.charAt(0)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>{sub.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub.code || 'Main'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>📅 Your Schedule</h3>
            {loading ? <p>Loading...</p> : (stats.classes || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No upcoming classes scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {(stats.classes || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#F4F4F5', borderRadius: 8, border: '1px solid #E4E4E7' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{c.subject?.name}: {c.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.scheduledAt).toLocaleString()}</div>
                    </div>
                    {c.meetingLink && <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline', fontWeight: 700 }}>Join</a>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>📢 Latest Notices</h3>
            {loading ? <p>Loading...</p> : (stats.announcements || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No new announcements.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {(stats.announcements || []).map(a => (
                  <div key={a.id} style={{ paddingBottom: 10, borderBottom: '1px solid #F4F4F5' }}>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </StudentLayout>
    </ProtectedRoute>
  )
}

function DashCard({ title, value, icon }) {
  return (
    <div className="card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 5, color: 'var(--text-main)' }}>{value}</div>
      </div>
      <div style={{ width: 48, height: 48, background: '#000', color: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
        {icon}
      </div>
    </div>
  )
}

