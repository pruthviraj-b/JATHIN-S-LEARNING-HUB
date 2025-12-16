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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
          <DashCard title="⭐ My Total Stars" value={loading ? '...' : stats.stars} color="#ffa800" icon="✨" />
          <Link href="/student/attendance" style={{ textDecoration: 'none' }}>
            <DashCard title="✅ My Attendance" value={loading ? '...' : stats.attendance} color="#1bc5bd" icon="📝" />
          </Link>
          <DashCard title="🏆 Class Rank" value={loading ? '...' : stats.rank} color="#8950fc" icon="🎖️" />
        </div>

        {/* Subjects Grid (New Section) */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>📚 My Subjects (Class {user?.student?.classLevel})</h3>
          {loading ? <p>Loading subjects...</p> : stats.subjects.length === 0 ? (
            <p style={{ color: '#999' }}>No subjects assigned for this class yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {stats.subjects.map((sub, i) => (
                // Using random colors for vibrancy from a palette
                <div key={sub.id} style={{
                  background: 'white',
                  padding: 24,
                  borderRadius: 16,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  border: '1px solid #f0f0f0',
                  cursor: 'default',
                  transition: 'transform 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: 12, marginBottom: 15,
                    background: ['#e0f2fe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff'][i % 5],
                    color: ['#0284c7', '#16a34a', '#d97706', '#dc2626', '#9333ea'][i % 5],
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                  }}>
                    {sub.name.charAt(0)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{sub.name}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{sub.code || 'Main'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <h3 style={{ marginTop: 0 }}>📅 Your Schedule</h3>
            {loading ? <p>Loading...</p> : stats.classes.length === 0 ? (
              <p style={{ color: '#999' }}>No upcoming classes scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {stats.classes.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f9f9f9', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{c.subject?.name}: {c.title}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{new Date(c.scheduledAt).toLocaleString()}</div>
                    </div>
                    {c.meetingLink && <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#3699ff', textDecoration: 'none', fontWeight: 500 }}>Join</a>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <h3 style={{ marginTop: 0 }}>📢 Latest Notices</h3>
            {loading ? <p>Loading...</p> : stats.announcements.length === 0 ? (
              <p style={{ color: '#999' }}>No new announcements.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {stats.announcements.map(a => (
                  <div key={a.id} style={{ paddingBottom: 10, borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{new Date(a.createdAt).toLocaleDateString()}</div>
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

function DashCard({ title, value, icon, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 0 20px 0 rgba(76,87,125,0.02)', border: '1px solid #f0f0f0' }}>
      <div>
        <div style={{ color: '#b5b5c3', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 5, color: '#3f4254' }}>{value}</div>
      </div>
      <div style={{ width: 48, height: 48, background: `${color}20`, color: color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
        {icon}
      </div>
    </div>
  )
}

