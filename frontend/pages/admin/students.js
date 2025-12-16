import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Create Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dob: '',
    profileUrl: '',
    active: true,
    classLevel: 1,
    teamId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Credentials Display State
  const [createdCredentials, setCreatedCredentials] = useState(null)

  // Star Award Modal State
  const [starModal, setStarModal] = useState(null) // studentId or null
  const [starData, setStarData] = useState({ reason: 'Excellent Performance', points: 1 })

  // Edit Mode
  const [editingId, setEditingId] = useState(null)

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sData, tData] = await Promise.all([
        apiCall('/students'),
        apiCall('/teams') // Assuming /teams exists and returns list
      ])

      setStudents(sData)
      setTeams(tData)
      setError('')
    } catch (err) {
      // If teams fail (maybe empty), just load students
      console.error('Error fetching data:', err)
      try {
        const sData = await apiCall('/students')
        setStudents(sData)
      } catch (e) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        // Update existing
        await apiCall(`/students/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
        setEditingId(null)
      } else {
        // Create new
        await apiCall('/students', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
        // Show credentials for new student
        setCreatedCredentials({ email: formData.email, password: formData.password })
      }

      // Reset form but keep credentials modal open if applicable
      setFormData({ firstName: '', lastName: '', email: '', password: '', dob: '', profileUrl: '', active: true, classLevel: 1, teamId: '' })
      setShowForm(false)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (student) => {
    setEditingId(student.id)
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName || '',
      email: student.user?.email || '',
      password: '', // Password always blank initially in edit mode
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
      profileUrl: student.profileUrl || '',
      active: student.active,
      classLevel: student.classLevel || 1,
      teamId: student.teamId || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      await apiCall(`/students/${studentId}`, { method: 'DELETE' })
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleActive = async (studentId, currentStatus) => {
    try {
      await apiCall(`/students/${studentId}/activate`, {
        method: 'POST',
        body: JSON.stringify({ active: !currentStatus })
      })
      await fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const awardStar = async (studentId) => {
    if (!starData.reason) return alert('Reason required')
    try {
      await apiCall('/stars', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          reason: starData.reason,
          points: Number(starData.points)
        })
      })
      alert('⭐ Star Awarded!')
      setStarModal(null)
      await fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Students</h1>
            <p style={{ color: '#aaa', margin: '5px 0 0 0' }}>Manage profiles and performance.</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({ firstName: '', lastName: '', email: '', password: '', dob: '', profileUrl: '', active: true, classLevel: 1, teamId: '' })
              setShowForm(!showForm)
            }}
            style={{ padding: '10px 20px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {showForm ? 'Cancel' : <span>+ New Student</span>}
          </button>
        </div>

        {error && <div style={{ background: '#fee', color: '#c00', padding: 15, borderRadius: 4, marginBottom: 20 }}>⚠️ {error}</div>}



        {showForm && (
          <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 30, border: '1px solid #eeffff', boxShadow: '0 0 10px rgba(0,0,0,0.02)' }}>
            <h2 style={{ marginTop: 0, marginBottom: 20 }}>{editingId ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>{editingId ? "New Password (Optional)" : "Password"}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Leave blank to keep current" : ""}
                    required={!editingId}
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Class</label>
                  <select
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: Number(e.target.value) })}
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Team</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
                  >
                    <option value="">-- No Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Date of Birth</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 16 }}>📅</span>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: 6, border: '1px solid #ddd' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Profile Image URL</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 16 }}>🖼️</span>
                    <input
                      type="text"
                      value={formData.profileUrl}
                      onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: 6, border: '1px solid #ddd' }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{ marginTop: 25, padding: '12px 24px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span>💾</span> {submitting ? 'Saving...' : (editingId ? 'Update Profile' : 'Create Profile')}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 0 20px 0 rgba(76,87,125,0.02)', border: '1px solid #f0f0f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rank</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Class</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Team</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#666', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Stars</th>
                <th style={{ padding: '15px', textAlign: 'right', color: '#666', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0', background: index === 0 ? '#fff8dd' : 'white', transition: 'background 0.2s' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: index === 0 ? '#ffa800' : '#333' }}>
                    {index === 0 ? '👑 #' + (index + 1) : '#' + (index + 1)}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={s.profileUrl || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=random&color=fff`}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{s.firstName} {s.lastName}</div>
                        <div style={{ color: '#999', fontSize: 13 }}>{s.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}><span style={{ background: '#f0f2f5', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>Class {s.classLevel}</span></td>
                  <td style={{ padding: '15px' }}>{s.team ? <span style={{ color: '#3699ff', fontWeight: 500 }}>{s.team.name}</span> : <span style={{ color: '#ccc' }}>—</span>}</td>
                  <td style={{ padding: '15px', fontSize: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>⭐ <span style={{ fontWeight: 700 }}>{s.totalPoints || 0}</span></div>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button title="Award Star" onClick={() => setStarModal(s.id)} style={{ width: 32, height: 32, background: '#fff4de', color: '#ffa800', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⭐</button>
                      <button title="Edit" onClick={() => handleEdit(s)} style={{ width: 32, height: 32, background: '#e1f0ff', color: '#3699ff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                      <button title={s.active ? "Deactivate" : "Activate"} onClick={() => toggleActive(s.id, s.active)} style={{ width: 32, height: 32, background: s.active ? '#ffe2e5' : '#e8f5e9', color: s.active ? '#f64e60' : '#1bc5bd', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {s.active ? '🚫' : '✅'}
                      </button>
                      <button title="Delete" onClick={() => handleDelete(s.id)} style={{ width: 32, height: 32, background: '#f5f5f5', color: '#999', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Star Modal */}
        {starModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 350, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <h3 style={{ marginTop: 0, fontSize: 18 }}>⭐ Award Star</h3>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Reason</label>
                <input type="text" value={starData.reason} onChange={e => setStarData({ ...starData, reason: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#666' }}>Points</label>
                <input type="number" value={starData.points} onChange={e => setStarData({ ...starData, points: e.target.value })} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setStarModal(null)} style={{ padding: '10px 20px', background: '#f5f5f5', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => awardStar(starModal)} style={{ background: '#ffa800', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', color: 'white', cursor: 'pointer' }}>Award Star</button>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {createdCredentials && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: 30, borderRadius: 8, maxWidth: 400, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <h2 style={{ marginTop: 0 }}>Student Created!</h2>
              <p>Please share these credentials with the student:</p>
              <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 4, margin: '20px 0', textAlign: 'left' }}>
                <div style={{ marginBottom: 5 }}><strong>Email:</strong> {createdCredentials.email}</div>
                <div><strong>Password:</strong> {createdCredentials.password}</div>
              </div>
              <button onClick={() => setCreatedCredentials(null)} style={{ width: '100%', padding: '12px', fontSize: 16 }}>Okay, I copied it</button>
            </div>
          </div>
        )}

      </AdminLayout>
    </ProtectedRoute>
  )
}
