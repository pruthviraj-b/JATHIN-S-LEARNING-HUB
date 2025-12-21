import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiCall } from '../../lib/api'
import StudentLayout from '../../components/StudentLayout'

export default function StudentDashboard() {
  const { user } = useAuth()
  const studentName = user?.student?.firstName || 'Student'
  const [stats, setStats] = useState({
    stars: 0,
    rank: '—',
    attendance: '—',
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
        const data = await apiCall('/dashboard/student')
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <StudentLayout>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Track your progress and schedule.</p>
        </div>

        <div className="stats-grid">
          <DashCard title="⭐ My Total Stars" value={loading ? '...' : stats.stars} icon="✨" />
          <Link href="/student/attendance" style={{ textDecoration: 'none' }}>
            <DashCard title="✅ My Attendance" value={loading ? '...' : stats.attendance} icon="📝" />
          </Link>
          <DashCard title="🏆 Class Rank" value={loading ? '...' : stats.rank} icon="🎖️" />
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
                  background: '#09090B',
                  padding: 24,
                  borderRadius: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  border: '1px solid #27272A',
                  cursor: 'default',
                  transition: 'transform 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = '#18181B' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#09090B' }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 12, marginBottom: 15,
                    background: '#27272A',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    border: '1px solid #3F3F46'
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
          <div style={{ background: '#09090B', padding: 24, borderRadius: 12, border: '1px solid #27272A' }}>
            <h3 style={{ marginTop: 0 }}>📅 Your Schedule</h3>
            {loading ? <p>Loading...</p> : (stats.classes || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No upcoming classes scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {(stats.classes || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#18181B', borderRadius: 8, border: '1px solid #27272A' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{c.subject?.name}: {c.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.scheduledAt).toLocaleString()}</div>
                    </div>
                    {c.meetingLink && <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'underline', fontWeight: 500 }}>Join</a>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#09090B', padding: 24, borderRadius: 12, border: '1px solid #27272A' }}>
            <h3 style={{ marginTop: 0 }}>📢 Latest Notices</h3>
            {loading ? <p>Loading...</p> : (stats.announcements || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No new announcements.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {(stats.announcements || []).map(a => (
                  <div key={a.id} style={{ paddingBottom: 10, borderBottom: '1px solid #27272A' }}>
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
    <div style={{ background: '#09090B', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #27272A' }}>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 5, color: 'var(--text-main)' }}>{value}</div>
      </div>
      <div style={{ width: 48, height: 48, background: '#18181B', color: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid #27272A' }}>
        {icon}
      </div>
    </div>
  )
}

